/**
 * AssistantService — the project assistant's brain.
 *
 * It is a harness, not a personality: the model is a replaceable engine, the
 * knowledge, the memory and the actions belong to the system. That is what
 * lets the assistant keep working when the user switches provider.
 *
 * The prompt is assembled from four layers of knowledge (see the design
 * note):
 *   A — documentary: wiki articles about the system;
 *   B — structural: panel → route → component → tests, derived from the code;
 *   C — episodic: what was learned earlier (long-term memory);
 *   D — operational: what is true right now (agents, tools, the session).
 *
 * Every action goes through the permission gate: reads are free, writes and
 * executions ask the human first.
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ChatMessage } from '../../types/llm-types';
import type {
    AssistantAction,
    AssistantActionResult,
    AssistantTurnRequest,
    AssistantTurnResult,
} from '../../contracts/assistant';
import type { IToolApprovalService } from '../../contracts/tool-approval';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { runToolLoop, type ToolLoopMessage, type ToolLoopTool } from '../tool-loop/tool-loop';
import { AssistantActionRegistry } from './assistant-action-registry';
import { ProjectKnowledgeService } from './project-knowledge-service';
import type { AgentPermissionService } from '../permissions/permission-service';
import type { CapabilityTrustService } from '../capability-trust/capability-trust-service';
import type { AssistantDiaryService } from './assistant-diary-service';
import type { AssistantExamService } from './assistant-exam-service';
import type { AssistantDiagnosisService } from './assistant-diagnosis-service';
import type { AssistantViewService } from './assistant-view-service';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Assistant');

const MAX_ROUNDS = 5;

export interface AssistantServiceDeps {
    llm: ILLMClientService;
    actions: AssistantActionRegistry;
    knowledge: ProjectKnowledgeService;
    events: IEventBus;
    /** Agent id the assistant acts as — its permission state decides the gate. */
    agentId: string;
    /** Human-readable name of that agent node. */
    agentLabel?: string;
    /** Live lifecycle of that node, so the assistant does not lie about itself. */
    lifecycle?: { status(agentId: string): string };
    permissionService?: AgentPermissionService;
    approvalService?: IToolApprovalService;
    /** The trust ledger — what is verified vs only documented. */
    trust?: CapabilityTrustService;
    /** The assistant's own experience log. */
    diary?: AssistantDiaryService;
    /** The self-check gate. */
    exam?: AssistantExamService;
    /** Routing a symptom to the layer that owns it. */
    diagnosis?: AssistantDiagnosisService;
    /** Where the operator is right now. */
    view?: AssistantViewService;
    /** Long-term memory (episodic layer). */
    memory?: {
        recall(
            context: string,
            limit?: number,
        ): Promise<Array<{ content: string; metadata: { type?: string } }>>;
    };
    /** Provider/model of the assistant; the session may override it. */
    provider?: string;
    model?: string;
    /**
     * Last-resort route when neither the request nor the service names one:
     * the assistant is expected to work on whatever key the user has.
     */
    resolveRoute?: () => { provider?: string; model?: string } | undefined;
}

const IDENTITY = `You are the project assistant of SuperAgents OS — a multi-agent runtime with many panels, services and tools.

How you work:
- You answer questions about THIS system. You do not guess: use the actions to find the real implementation, its route, its file and its tests.
- You state what you observed, not what you intended. If an action was not confirmed, say it was not.
- Documentation states intent; the panel/component chain comes from the code. When they disagree, trust the code and say so.
- You may act on the system: create agents, open panels, store facts, start debates. Actions that change something ask the user first — wait for the answer instead of trying again.
- Before you claim that something works, examine it (system.exam). If the exam does not pass, say what is known and what is not.
- You are an agent of this system, not a chat box: the [SELF] block states your node and permission mode; use system.self when the user asks who you are or what you may do.
- Keep a diary of what you learned (diary.write): decisions, lessons and mistakes. Do not write noise.
- Answer in the language of the question. Be concise: a few sentences plus concrete references (file, route, id).`;

export class AssistantService {
    constructor(private readonly deps: AssistantServiceDeps) {}

    /** The system prompt of the assistant (identity + rules). */
    systemPrompt(): string {
        const rules: string[] = [];
        if (this.deps.exam) rules.push(this.deps.exam.rule());
        if (this.deps.diagnosis) rules.push(this.deps.diagnosis.rule());
        if (rules.length === 0) return IDENTITY;
        return `${IDENTITY}\n\n${rules.join('\n')}`;
    }

    /**
     * Assemble the context block for a question.
     *
     * Layer A/B come from the knowledge service, layer C from the long-term
     * memory, layer D from the live state of the system.
     */
    async buildContext(question: string, sessionId?: string): Promise<string> {
        const blocks: string[] = [];

        const knowledge = await this.deps.knowledge.context(question);
        if (knowledge.markdown) blocks.push(knowledge.markdown);

        if (this.deps.memory) {
            try {
                const hits = await this.deps.memory.recall(question, 5);
                if (hits.length > 0) {
                    blocks.push(
                        '[RECALLED MEMORY]',
                        hits
                            .map(
                                (h) => `- (${h.metadata.type ?? 'memory'}) ${h.content.slice(0, 240)}`,
                            )
                            .join('\n'),
                    );
                }
            } catch (e) {
                LOGGER.warn('Assistant', 'context: memory recall failed', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }

        blocks.push(
            '[LIVE STATE]',
            `- assistant agent id: ${this.deps.agentId}`,
            `- session: ${sessionId ?? 'none'}`,
            `- actions available: ${this.deps.actions.list().length}`,
        );

        const self = this.describeSelf();
        blocks.push(
            '[SELF]',
            `- you are the agent node "${self.id}" (${self.name}) of this system, status ${self.status}`,
            `- permission mode: ${self.mode} (preset ${self.preset})${self.denials > 0 ? `, ${self.denials} consecutive denials` : ''}`,
            '- reads need no approval; writes and executions ask the operator first',
        );

        const view = this.deps.view?.summary();
        if (view) {
            blocks.push(`[CURRENT VIEW] ${view} — the operator is looking at this screen`);
        }

        if (this.deps.trust) {
            const stats = this.deps.trust.stats();
            blocks.push(
                '[TRUST LEDGER]',
                `- ${stats.total} capability/capabilities: ${stats.verified} verified, ${stats.discovered} discovered, ${stats.declared} declared${stats.stale ? `, ${stats.stale} stale` : ''}`,
                '- rely on verified and discovered; a "declared" capability is only documentation',
            );
        }

        if (this.deps.diary) {
            const summary = this.deps.diary.summary(5);
            if (summary) {
                blocks.push('[DIARY — your own recent experience]', summary);
            }
        }

        return blocks.join('\n\n');
    }

    /**
     * The permission gate for one action.
     *
     * Reads pass, writes and executions ask the human through the approval
     * channel. A denial is returned as a result so the model can explain it
     * instead of crashing.
     */
    private async gate(
        action: AssistantAction,
        args: Record<string, unknown>,
    ): Promise<AssistantActionResult | null> {
        // Pausing the agent in the admin must mean something: a paused
        // assistant still answers, but it does not act.
        const lifecycle = this.deps.lifecycle?.status(this.deps.agentId);
        if (lifecycle === 'paused') {
            return {
                ok: false,
                detail: 'The assistant is paused in the Agents panel; resume it before acting.',
            };
        }
        const permissions = this.deps.permissionService;
        if (!permissions) return null;
        const decision = await permissions.evaluate(this.deps.agentId, action.action, action.id);
        if (decision.effect === 'allow') return null;
        if (decision.effect === 'deny') {
            return { ok: false, detail: `Permission denied: ${decision.reason}` };
        }
        const approval = this.deps.approvalService;
        if (!approval) {
            return { ok: false, detail: `Permission required: ${decision.reason}` };
        }
        const verdict = await approval.request({
            toolId: action.id,
            agentId: this.deps.agentId,
            action: action.action,
            resource: action.id,
            reason: decision.reason,
            input: args,
        });
        if (verdict === 'allow') return null;
        return { ok: false, detail: 'The user did not allow this action.' };
    }

    /**
     * Which provider/model a turn runs on.
     *
     * The request wins, then the configured assistant route, then whatever
     * active key the system has — an assistant that needs a hand-configured
     * default provider is useless on a fresh install.
     */
    private resolveRoute(req: AssistantTurnRequest): { provider?: string; model?: string } {
        const pick = (provider?: string) =>
            provider && provider !== 'auto' && provider !== 'race' ? provider : undefined;
        const provider = pick(req.provider) ?? pick(this.deps.provider);
        const model = req.model ?? this.deps.model;
        if (provider) return { provider, model };
        const fallback = this.deps.resolveRoute?.();
        return { provider: pick(fallback?.provider), model: model ?? fallback?.model };
    }

    /**
     * Who the assistant is in this system: its agent node and its explicit
     * permission profile. Used both in the prompt and by `system.self`.
     */
    describeSelf(): {
        id: string;
        name: string;
        status: string;
        mode: string;
        preset: string;
        denials: number;
    } {
        const permissions = this.deps.permissionService;
        const state =
            permissions && typeof permissions.getState === 'function'
                ? permissions.getState(this.deps.agentId)
                : null;
        return {
            id: this.deps.agentId,
            name: this.deps.agentLabel ?? 'Project Assistant',
            status: this.deps.lifecycle?.status(this.deps.agentId) ?? 'unknown',
            mode: state?.mode ?? 'unknown',
            preset: state?.preset ?? 'unknown',
            denials: state?.consecutiveDenials ?? 0,
        };
    }

    /**
     * Make the assistant an explicit member of the permission system.
     *
     * Without stored state the engine treats the agent as "never configured";
     * the assistant is configured by design: guarded — reads are free, writes
     * and executions ask the operator.
     */
    private async ensurePermissionState(): Promise<void> {
        const permissions = this.deps.permissionService;
        if (!permissions) return;
        if (
            typeof permissions.hasState !== 'function' ||
            typeof permissions.setMode !== 'function'
        )
            return;
        if (permissions.hasState(this.deps.agentId)) return;
        try {
            await permissions.setMode(this.deps.agentId, 'guarded');
        } catch (e) {
            LOGGER.warn('Assistant', 'Failed to seed the guarded permission state', {
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    /** Run one turn of the assistant. */
    async ask(req: AssistantTurnRequest): Promise<AssistantTurnResult> {
        const requestId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const startedAt = Date.now();
        await this.ensurePermissionState();
        const context = await this.buildContext(req.text, req.sessionId);
        const messages: ToolLoopMessage[] = [
            { role: 'system', content: this.systemPrompt() },
            { role: 'user', content: `${context}\n\n[QUESTION]\n${req.text}` },
        ];

        const definitions = this.deps.actions.definitions();
        const tools: ToolLoopTool[] = definitions.map((d) => ({
            name: d.function.name,
            description: d.function.description,
            parameters: d.function.parameters,
        }));
        const used: string[] = [];
        const route = this.resolveRoute(req);

        const loop = await runToolLoop(
            messages,
            async (conversation, available) => {
                const res = await this.deps.llm.sendMessage(
                    conversation as unknown as ChatMessage[],
                    {
                        provider: route.provider,
                        model: route.model,
                        temperature: 0.2,
                        maxTokens: 1500,
                        tools: available.map((t) => ({
                            type: 'function',
                            function: {
                                name: t.name,
                                description: t.description,
                                parameters: t.parameters,
                            },
                        })),
                        onChunk: (chunk: string) => {
                            this.deps.events.emit(EVENTS.ASSISTANT_CHUNK, { requestId, chunk });
                        },
                    },
                );
                if (res.error) throw new Error(`LLM error: ${res.error}`);
                return { content: res.content, toolCalls: res.toolCalls };
            },
            {
                tools,
                maxRounds: MAX_ROUNDS,
                runTool: async (name, args) => {
                    const action = this.deps.actions.get(name);
                    if (!action) return `Unknown action: ${name}`;
                    this.deps.events.emit(EVENTS.ASSISTANT_TOOL_CALL, {
                        requestId,
                        action: name,
                        group: action.group,
                        args,
                        status: 'started',
                    });
                    const blocked = await this.gate(action, args);
                    const result = blocked ?? (await this.deps.actions.run(name, args));
                    used.push(name);
                    this.deps.events.emit(EVENTS.ASSISTANT_TOOL_CALL, {
                        requestId,
                        action: name,
                        group: action.group,
                        args,
                        status: result.ok ? 'done' : 'error',
                        detail: result.detail,
                    });
                    return [
                        result.ok ? 'OK' : 'FAILED',
                        result.detail,
                        result.evidence ? `evidence: ${result.evidence}` : '',
                    ]
                        .filter(Boolean)
                        .join('\n');
                },
            },
        );

        this.deps.events.emit(EVENTS.ASSISTANT_DONE, {
            requestId,
            content: loop.content,
            toolCalls: loop.toolCalls,
            rounds: loop.rounds,
        });

        // The assistant is an agent of the topology: its turns feed the same
        // per-agent statistics the admin shows for every other agent.
        this.deps.events.emit(EVENTS.COGNITIVE_STEP_COMPLETED, {
            nodeId: this.deps.agentId,
            traceId: requestId,
            status: 'done',
            duration: Date.now() - startedAt,
            output: loop.content,
            provider: route.provider ?? 'auto',
            model: route.model ?? 'auto',
        });

        await this.recordExperience(req.text, loop.content, used);

        return {
            content: loop.content,
            toolCalls: used,
            rounds: loop.rounds,
        };
    }

    /**
     * Write the turn into the diary.
     *
     * The entry is deliberately thin: what was asked, which actions ran and
     * what the answer was. Lessons and mistakes are written by the assistant
     * itself (the `diary.write` action) — the harness only records the trace.
     */
    private async recordExperience(
        question: string,
        answer: string,
        toolCalls: string[],
    ): Promise<void> {
        const diary = this.deps.diary;
        if (!diary) return;
        try {
            await diary.write({
                kind: 'question',
                text: question.slice(0, 240),
                evidence: [
                    toolCalls.length ? `actions: ${toolCalls.join(', ')}` : 'no actions',
                    answer.slice(0, 400),
                ].join(' | '),
                outcome: answer ? 'success' : 'partial',
                importance: 0.35,
            });
        } catch (e) {
            LOGGER.warn('Assistant', 'diary write failed', {
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }
}
