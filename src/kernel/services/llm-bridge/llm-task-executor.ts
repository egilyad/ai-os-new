/**
 * LLM bridge — GAP E.1 (real execution for Crew/Council/Graph/Eval).
 *
 * Four thin adapters over ILLMClientService (phase5 `llmClientService`):
 *   - LlmCrewExecutor  : ICrewTaskExecutor (role system prompt + task + context)
 *   - LlmCouncilPort   : ICouncilLlmPort (stance drafts + judge ballots)
 *   - LlmGraphPort     : IGraphLlmPort (task nodes + reflections)
 *   - LlmFrontierExecutor : IFrontierExecutor (benchmark cases)
 *
 * Every call carries cacheScope { agentId, sessionId, role } (B-20 pattern)
 * so agents never contaminate each other's cache. Temperature/maxTokens are
 * conservative defaults; per-agent model override via `modelFor` callback.
 */
import type {
    ILLMClientService,
    AdapterMessage,
} from '../../contracts/provider-adapter';
import type { ICrewTaskExecutor } from '../../contracts/crew';
import type { ICouncilLlmPort } from '../../contracts/council';
import type { IGraphLlmPort } from '../../contracts/graph';
import type { IFrontierExecutor } from '../../contracts/frontier';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('LlmBridge');

export interface LlmBridgeOptions {
    client: ILLMClientService;
    defaultModel?: string;
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    /** Resolve a model per logical agent id (per-agent LLM selection). */
    modelFor?: (agentId: string) => string | undefined;
    /** GAP E.3 — trained guidance per role name (CrewAI `train` analogue). */
    guideFor?: (role: string) => Promise<string>;
    /** 6.1 — optional tool loop per task (when role declares tools) */
    toolRunner?: { runWithTools(prompt: string, opts?: { agentId?: string; system?: string; maxRounds?: number }): Promise<{ output: string }> };
    /** 6.1 — allow-list gating via ToolGovernance */
    toolCheck?: (agentId: string, tool: string) => Promise<boolean>;
}

async function chat(
    opts: LlmBridgeOptions,
    system: string,
    user: string,
    scope: { agentId?: string; sessionId?: string; role?: string },
    agentIdForModel?: string,
): Promise<string> {
    const messages: AdapterMessage[] = [
        { role: 'system', content: system.slice(0, 6000) },
        { role: 'user', content: user.slice(0, 12000) },
    ];
    const model = (agentIdForModel && opts.modelFor?.(agentIdForModel)) ?? opts.defaultModel;
    const res = await opts.client.chat(messages, {
        model,
        temperature: opts.defaultTemperature ?? 0.5,
        maxTokens: opts.defaultMaxTokens ?? 1024,
        cacheScope: scope,
    });
    if (res.error) throw new Error(`LLM error: ${res.error}`);
    return res.content;
}

export class LlmCrewExecutor implements ICrewTaskExecutor {
    constructor(private opts: LlmBridgeOptions) {}

    async execute(input: {
        crew: { id: string; name: string };
        task: { id: string; description: string; expectedOutput: string };
        role: { id: string; name: string; role: string; goal: string; backstory: string };
        context: string;
    }): Promise<string> {
        let guide = '';
        try {
            guide = (await this.opts.guideFor?.(input.role.role)) ?? '';
        } catch {
            guide = '';
        }
        const system =
            `You are ${input.role.name} (${input.role.role}).\n` +
            `Goal: ${input.role.goal}\nBackstory: ${input.role.backstory}\n` +
            (guide ? `${guide}\n` : '') +
            `Crew: ${input.crew.name}. Be concrete and cite facts when possible.`;
        const user =
            `Task: ${input.task.description}\n` +
            `Expected output: ${input.task.expectedOutput}` +
            (input.context ? `\nContext from previous tasks:\n${input.context}` : '');
        // 6.1 tool-loop branch: if role declares tools and runner is wired, use it
        const hasTools = Array.isArray((input.role as unknown as { tools?: string[] }).tools) && ((input.role as unknown as { tools?: string[] }).tools!.length > 0);
        if (hasTools && this.opts.toolRunner) {
            try {
                const allowed = this.opts.toolCheck ? await this.opts.toolCheck(input.role.id, 'tool:use') : true;
                if (allowed) {
                    const res = await this.opts.toolRunner.runWithTools(user, { agentId: input.role.id, system, maxRounds: 2 });
                    if (res.output) return res.output;
                }
            } catch (e) {
                LOGGER.warn('LlmBridge', 'crew tool-loop failed, fallback to chat', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        try {
            return await chat(
                this.opts,
                system,
                user,
                { agentId: input.role.id, sessionId: input.crew.id, role: input.role.role },
                input.role.id,
            );
        } catch (e) {
            LOGGER.warn('LlmBridge', 'crew task llm failed, echo fallback', {
                error: e instanceof Error ? e.message : String(e),
            });
            return `[${input.role.name}] completed: ${input.task.description}\nExpected: ${input.task.expectedOutput}`;
        }
    }
}

export class LlmCouncilPort implements ICouncilLlmPort {
    constructor(private opts: LlmBridgeOptions) {}

    async draftStance(input: {
        topic: string;
        participant: { id: string; name: string; kind: string };
    }): Promise<string> {
        return chat(
            this.opts,
            `You are ${input.participant.name} (${input.participant.kind}) in a structured debate. Be sharp and evidence-driven.`,
            `Topic: ${input.topic}\nDraft your opening stance in 5 sentences or less.`,
            { agentId: input.participant.id, role: input.participant.kind },
            input.participant.id,
        );
    }

    async judgeRound(input: {
        topic: string;
        messages: Array<{ authorId: string; body: string }>;
        judgeName: string;
        dimensions: string[];
        blindMap?: Record<string, string>;
    }): Promise<{ winnerId: string; scores: Record<string, number>; rationale: string }> {
        const transcript = input.messages
            .slice(-20)
            .map((m) => {
                const who = (input.blindMap && input.blindMap[m.authorId]) || m.authorId;
                return `[${who}]: ${m.body.slice(0, 800)}`;
            })
            .join('\n');
        const out = await chat(
            this.opts,
            `You are ${input.judgeName}, an impartial debate judge. Score dimensions: ${input.dimensions.join(', ')}. ` +
                `Reply as JSON: {"winnerId":"<speaker id or draw>","scores":{"<id>":0-10},"rationale":"..."}. ` +
                `Use the exact speaker ids shown in brackets.`,
            `Topic: ${input.topic}\nTranscript:\n${transcript}`,
            { role: 'judge' },
        );
        try {
            const start = out.indexOf('{');
            const parsed = JSON.parse(out.slice(start, out.lastIndexOf('}') + 1)) as {
                winnerId?: string;
                scores?: Record<string, number>;
                rationale?: string;
            };
            return {
                winnerId: typeof parsed.winnerId === 'string' ? parsed.winnerId : 'draw',
                scores: parsed.scores ?? {},
                rationale: parsed.rationale ?? out.slice(0, 500),
            };
        } catch {
            return { winnerId: 'draw', scores: {}, rationale: out.slice(0, 500) };
        }
    }
}

export class LlmGraphPort implements IGraphLlmPort {
    constructor(private opts: LlmBridgeOptions) {}

    async runTask(input: { label: string; state: Record<string, unknown> }): Promise<string> {
        const keys = Object.keys(input.state).filter((k) => !k.startsWith('out:')).slice(0, 20);
        return chat(
            this.opts,
            'You are a workflow step executor. Produce the step result concisely.',
            `Step: ${input.label}\nState keys: ${keys.join(', ') || 'none'}\nLast output: ${String(input.state['lastOutput'] ?? 'n/a').slice(0, 2000)}`,
            {},
        );
    }

    async reflect(input: { visited: string[]; state: Record<string, unknown> }): Promise<string> {
        return chat(
            this.opts,
            'You are a workflow reflector. Summarize progress, risks and next best action in 5 lines.',
            `Visited: ${input.visited.join(' → ') || 'none'}\nLast output: ${String(input.state['lastOutput'] ?? 'n/a').slice(0, 2000)}`,
            {},
        );
    }
}

export class LlmFrontierExecutor implements IFrontierExecutor {
    constructor(private opts: LlmBridgeOptions) {}

    async execute(task: string): Promise<string> {
        return chat(
            this.opts,
            'You are a benchmark subject. Solve the task directly and completely.',
            task,
            {},
        );
    }
}
