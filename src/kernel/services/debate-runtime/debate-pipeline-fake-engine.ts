import { buildPipeline } from './debate-pipeline-builder';
import type { PipelineEngine, PipelineEngineDeps } from './debate-pipeline-builder';
import { DebateTopologyService } from './debate-topology';
import { DebateSession } from './debate-session';
import { DebateMemory } from './debate-memory';
import { DebateSessionContext } from './debate-session-context';
import { DebateOrchestrator } from './debate-orchestrator';
import { ConversationBackedDebateOrchestrator } from './conversation-backed-debate-orchestrator';
import type {
    IDebateSession,
    IDebateBudget,
    DebateTopology,
    ParticipantConfig,
    BudgetSnapshot,
    PressureLevel,
    PressureAction,
} from '../../contracts/debate-runtime';
import type { IEventBus } from '../../types/interfaces';
import type { DebateProviderResolver } from './debate-query-engine';

class RecordingBus implements IEventBus {
    events: { event: string; data: unknown }[] = [];
    emit(e: string, d?: unknown): boolean {
        this.events.push({ event: e, data: d });
        return true;
    }
    emitOnce(e: string, _k: string, d?: unknown): boolean {
        this.events.push({ event: e, data: d });
        return true;
    }
    on(): () => void {
        return () => {};
    }
    off(): void {}
    onSafe(): () => void {
        return () => {};
    }
    subscribeAll(): () => void {
        return () => {};
    }
}

type CallLLM = (
    s: string,
    sess: IDebateSession,
    p: ParticipantConfig,
    sig?: AbortSignal,
) => Promise<string>;

class FakeEngine implements PipelineEngine {
    sessions = new Map<string, IDebateSession>();
    budgets = new Map<string, IDebateBudget>();
    deps: PipelineEngineDeps;
    providerResolver: DebateProviderResolver;
    sessionAbortControllers = new Map<string, Map<string, AbortController>>();
    paused = new Set<string>();
    private memories = new Map<string, DebateMemory>();
    private contexts = new Map<string, DebateSessionContext>();

    constructor(
        private topologyService: DebateTopologyService,
        public bus: RecordingBus,
        private callLLMImpl: CallLLM,
        private path: 'old' | 'new' = 'new',
    ) {
        this.providerResolver = {
            isKeyAuthFailed: () => false,
        } as unknown as DebateProviderResolver;
        this.deps = {
            eventBus: bus,
            getKeyService: () => ({
                getKeys: () => [{ id: 'k1', key: 'x', provider: 'openai', status: 'active' }],
                recordUsage: () => {},
                updateKeyStatus: () => {},
            }),
            getAdapterRegistry: () => ({}) as never,
            getKeyStateStore: () => ({ get: () => undefined, update: () => {} }),
        };
    }
    getMemory(id: string): DebateMemory {
        let m = this.memories.get(id);
        if (!m) {
            m = new DebateMemory();
            this.memories.set(id, m);
        }
        return m;
    }
    getContext(id: string): DebateSessionContext {
        let c = this.contexts.get(id);
        if (!c) {
            const orch =
                this.path === 'old'
                    ? new DebateOrchestrator(this.topologyService)
                    : new ConversationBackedDebateOrchestrator(this.topologyService);
            c = new DebateSessionContext(async () => 'verdict', undefined, undefined, orch);
            this.contexts.set(id, c);
        }
        return c;
    }
    runProviderPreflight(): Promise<void> {
        return Promise.resolve();
    }
    callLLM(
        s: string,
        sess: IDebateSession,
        p: ParticipantConfig,
        sig?: AbortSignal,
    ): Promise<string> {
        return this.callLLMImpl(s, sess, p, sig);
    }
    pauseSession(id: string): void {
        this.paused.add(id);
    }
}

export class RejectBudget implements IDebateBudget {
    async reserveAndRecord(): Promise<boolean> {
        return false;
    }
    incrementRound(): void {}
    getPressure(): PressureLevel {
        return 'critical';
    }
    getPressureAction(): PressureAction {
        return {
            level: 'critical',
            reduceRounds: 1,
            downgradeModels: false,
            trimContext: false,
            reduceTopologyDepth: false,
        };
    }
    snapshot(): BudgetSnapshot {
        return {
            sessionId: 'x',
            tokensUsed: 0,
            costUsed: 0,
            roundsUsed: 0,
            durationMs: 0,
            pressure: 'critical',
            estimatedRemainingTokens: 0,
            estimatedRemainingCost: 0,
        };
    }
}

function roundtableTopology(maxRounds: number): DebateTopology {
    return {
        id: 'rt',
        type: 'roundtable',
        maxRounds,
        nodes: [
            { id: 'a', label: 'Alpha', role: 'pro' },
            { id: 'b', label: 'Beta', role: 'con' },
            { id: 'c', label: 'Gamma', role: 'neutral' },
        ],
        edges: [
            { from: 'a', to: 'b', type: 'sequential' },
            { from: 'b', to: 'c', type: 'sequential' },
        ],
    };
}

export interface RunResult {
    events: { event: string; data: unknown }[];
    phase: string;
    round: number;
}

export interface RunBudgetOpts {
    scenario: 'budget' | 'resume' | 'happy' | 'abort';
    callLLM?: CallLLM;
    abortAfterFirst?: boolean;
    maxRounds?: number;
}

export async function runBudgetScenario(
    path: 'old' | 'new',
    opts: RunBudgetOpts,
): Promise<RunResult> {
    const topologyService = new DebateTopologyService();
    const bus = new RecordingBus();
    let firstCall = true;
    const defaultLLM: CallLLM = (_s, _sess, p) => Promise.resolve(`reply-${p.agentId}`);
    const engine = new FakeEngine(
        topologyService,
        bus,
        (s, sess, p, sig) => {
            if (opts.abortAfterFirst && firstCall) {
                firstCall = false;
                engine.getContext(s).orchestrator.abort(s);
            }
            return (opts.callLLM ?? defaultLLM)(s, sess, p, sig);
        },
        path,
    );
    const topology = roundtableTopology(opts.maxRounds ?? 2);
    const sessionId = 'sess-' + Math.random().toString(36).slice(2);
    const participants: ParticipantConfig[] = topology.nodes.map((n) => ({
        agentId: n.id,
        nodeId: n.id,
        role: n.role,
    }));
    const session = new DebateSession(sessionId, 'topic', topology, participants, 'en');
    if (opts.scenario === 'resume') session.incrementRound();
    engine.sessions.set(sessionId, session);
    if (opts.scenario === 'budget') engine.budgets.set(sessionId, new RejectBudget());

    await buildPipeline(engine, opts.scenario === 'resume').run(sessionId);
    return { events: bus.events, phase: session.phase, round: session.round };
}
