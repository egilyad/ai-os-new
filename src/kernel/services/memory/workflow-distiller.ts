/**
 * WorkflowDistiller — Voyager-style skill extraction.
 *
 * Turns a finished session scratchpad (SessionMemoryService) into a reusable
 * workflow: an ordered step list produced by the LLM when available, or
 * heuristically from the recorded commands/decisions otherwise. The workflow is
 * persisted as an agent-owned long-term memory (durable across reloads) and,
 * when an SOP service is present, registered as an in-memory SOP definition.
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type {
    ISessionMemoryService,
    SessionMemoryItem,
    SessionMemoryRecord,
} from '../../contracts/session-memory';
import type { ILtMemoryService } from '../../contracts/persona';
import type { ISopService } from '../../contracts/rivals';
import type { LongTermMemory } from '../../types/persona-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Workflow');

/** Minimum actionable items (commands + decisions) needed to distill. */
export const MIN_WORKFLOW_STEPS = 2;
const MAX_STEPS = 20;
const MAX_STEP_CHARS = 400;
const MAX_NAME_CHARS = 120;

export interface DistilledWorkflow {
    name: string;
    steps: string[];
    source: 'llm' | 'heuristic';
    memoryId?: string;
    sopId?: string;
}

export interface WorkflowDistillerDeps {
    sessionMemory: ISessionMemoryService;
    ltMemory?: ILtMemoryService;
    sop?: ISopService;
    llm?: ILLMClientService;
}

function chronological(items: SessionMemoryItem[], kind: SessionMemoryItem['kind']): string[] {
    return items
        .filter((i) => i.kind === kind)
        .slice()
        .reverse()
        .map((i) => i.text);
}

function truncate(text: string, max: number): string {
    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export class WorkflowDistiller {
    constructor(private readonly deps: WorkflowDistillerDeps) {}

    async distill(
        sessionId: string,
        opts: { name?: string; persist?: boolean; registerSop?: boolean } = {},
    ): Promise<DistilledWorkflow | null> {
        const rec = this.deps.sessionMemory.get(sessionId);
        if (!rec || rec.items.length === 0) return null;

        const commands = chronological(rec.items, 'command');
        const decisions = chronological(rec.items, 'decision');
        const actionable = commands.length + decisions.length;
        if (actionable < MIN_WORKFLOW_STEPS) return null;

        const name = truncate(
            opts.name?.trim() || this.defaultName(rec),
            MAX_NAME_CHARS,
        );

        let source: DistilledWorkflow['source'] = 'heuristic';
        let steps = this.heuristicSteps(commands, decisions);
        if (this.deps.llm) {
            const viaLlm = await this.llmSteps(rec, commands, decisions);
            if (viaLlm.length >= MIN_WORKFLOW_STEPS) {
                steps = viaLlm;
                source = 'llm';
            }
        }
        steps = steps.slice(0, MAX_STEPS).map((s) => truncate(s, MAX_STEP_CHARS));
        if (steps.length < MIN_WORKFLOW_STEPS) return null;

        const result: DistilledWorkflow = { name, steps, source };

        if (opts.persist !== false && this.deps.ltMemory) {
            const memory = await this.persist(rec, result);
            if (memory) result.memoryId = memory.id;
        }
        if (opts.registerSop !== false && this.deps.sop) {
            try {
                const def = await this.deps.sop.defineSop(
                    name,
                    result.steps.map((instruction, i) => ({
                        name: `Step ${i + 1}`,
                        role: 'Agent',
                        artifact: `step-${i + 1}`,
                        instruction,
                    })),
                );
                result.sopId = def.id;
            } catch (e) {
                LOGGER.warn('Workflow', 'SOP registration failed', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        return result;
    }

    private defaultName(rec: SessionMemoryRecord): string {
        const objective = rec.objective?.trim();
        return objective ? `Workflow: ${objective}` : `Workflow: session ${rec.sessionId}`;
    }

    private heuristicSteps(commands: string[], decisions: string[]): string[] {
        const steps: string[] = [];
        for (const cmd of commands) steps.push(`Run: ${cmd}`);
        for (const decision of decisions) steps.push(`Decide: ${decision}`);
        return steps;
    }

    private async llmSteps(
        rec: SessionMemoryRecord,
        commands: string[],
        decisions: string[],
    ): Promise<string[]> {
        const files = chronological(rec.items, 'file');
        const issues = chronological(rec.items, 'issue');
        const prompt = [
            'Turn this coding session into a reusable, ordered workflow.',
            'Output ONLY a numbered list of 2-12 short imperative steps (no prose).',
            '',
            `Objective: ${rec.objective ?? '(none)'}`,
            `Commands (chronological):\n${commands.map((c) => `- ${c}`).join('\n') || '- none'}`,
            `Decisions:\n${decisions.map((d) => `- ${d}`).join('\n') || '- none'}`,
            `Files:\n${files.map((f) => `- ${f}`).join('\n') || '- none'}`,
            `Issues:\n${issues.map((i) => `- ${i}`).join('\n') || '- none'}`,
        ].join('\n');
        try {
            const res = await this.deps.llm!.chat(
                [
                    { role: 'system', content: 'You distill agent sessions into reusable checklists.' },
                    { role: 'user', content: prompt },
                ],
                { temperature: 0.2, maxTokens: 600 },
            );
            if (res.error) return [];
            return this.parseSteps(res.content);
        } catch (e) {
            LOGGER.warn('Workflow', 'LLM distillation failed', {
                error: e instanceof Error ? e.message : String(e),
            });
            return [];
        }
    }

    private parseSteps(text: string): string[] {
        const out: string[] = [];
        for (const line of text.split(/\r?\n/)) {
            const m = /^\s*(?:\d+[.)]|[-*])\s+(.+)$/.exec(line);
            if (!m) continue;
            const step = m[1].trim();
            if (step) out.push(step);
        }
        return out;
    }

    private async persist(
        rec: SessionMemoryRecord,
        wf: DistilledWorkflow,
    ): Promise<LongTermMemory | null> {
        try {
            return await this.deps.ltMemory!.remember({
                ownerId: 'agent',
                content: this.render(rec, wf),
                tier: 'core',
                tags: ['workflow', `session:${rec.sessionId}`],
                importance: 0.8,
            });
        } catch (e) {
            LOGGER.warn('Workflow', 'persist failed', {
                error: e instanceof Error ? e.message : String(e),
            });
            return null;
        }
    }

    private render(rec: SessionMemoryRecord, wf: DistilledWorkflow): string {
        const lines = [`# ${wf.name}`, ''];
        if (rec.objective) lines.push(`Objective: ${rec.objective}`, '');
        lines.push('Steps:');
        wf.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
        const files = chronological(rec.items, 'file');
        if (files.length > 0) lines.push('', `Files: ${files.join(', ')}`);
        return lines.join('\n');
    }
}
