import type { ConversationScenario } from '../contracts/conversation/scenario';
import type {
    IConversationDirectorService,
    DirectorState,
} from '../contracts/conversation/director';
import type { TurnProposal } from '../contracts/conversation/turn';
import type { TurnResult } from '../contracts/conversation/execution';
import type { IExecutionEngine } from '../contracts/conversation/execution';
import type { ConversationContext } from '../contracts/conversation/context';
import type { ConversationSession, SessionCheckpoint } from '../contracts/conversation/session';
import { HybridPolicy } from './conversation-hybrid-policy';
import { ConversationOrchestrator } from './conversation-orchestrator';
import type { ScenarioRepository } from '../dal/scenario-repository';
import type { DirectorRepository } from '../dal/director-repository';
import { EVENTS } from '../events/event-bus';
import type { IEventBus } from '../types/interfaces';

/**
 * Recording decorator over an `IExecutionEngine`. Delegates execution to the
 * real engine and records every `TurnResult` so the Director can observe
 * progress and detect step completion (a step "did nothing" when no new result
 * is recorded — i.e. the policy is exhausted).
 */
class RecordingExecutionEngine implements IExecutionEngine {
    readonly results: TurnResult[] = [];
    constructor(private readonly delegate: IExecutionEngine) {}
    async execute(
        proposal: TurnProposal,
        context: ConversationContext,
        signal: AbortSignal,
    ): Promise<TurnResult> {
        try {
            const r = await this.delegate.execute(proposal, context, signal);
            this.results.push(r);
            return r;
        } catch (e) {
            const failed: TurnResult = {
                success: false,
                error: e instanceof Error ? e.message : String(e),
            };
            this.results.push(failed);
            throw e;
        }
    }
}

/**
 * Generic Admin Conversation Director (runtime service).
 *
 * Owns: the loaded scenario, the runtime lifecycle, the `HybridPolicy`, and the
 * binding of Policy + Orchestrator + ExecutionEngine. It does NOT own React,
 * UI state, Dexie, Debate, Forum, or any Debate-specialized runtime dependency.
 * The production wiring (added later) supplies a `ChatExecutionEngine` as the
 * `IExecutionEngine`.
 */
export class ConversationDirectorService implements IConversationDirectorService {
    private scenario: ConversationScenario | undefined;
    private orchestrator: ConversationOrchestrator | undefined;
    private recording: RecordingExecutionEngine | undefined;
    private sessionId = '';
    private state: DirectorState = 'idle';
    private isRunning = false;
    /** Live run record — distinct from the static scenario blueprint. */
    private session: ConversationSession | undefined;
    /** Kept so checkpoints can snapshot the orchestrator's running context. */
    private context: ConversationContext | undefined;
    private busUnsubs: Array<() => void> = [];

    /** Read state without TS control-flow narrowing (pause/abort mutate it externally). */
    private get phase(): DirectorState {
        return this.state;
    }

    /**
     * Single writer for the Director's lifecycle status (B-10). Keeps `this.state`
     * (exposed via `getState()`) and `this.session.status` (the persisted run record)
     * in lockstep so they can never diverge into three parallel channels. Every
     * status transition — lifecycle methods AND `conversation:*` events — flows here.
     */
    private setState(s: DirectorState): void {
        this.state = s;
        if (this.session) {
            this.session.status = s;
            this.session.updatedAt = Date.now();
        }
    }

    constructor(
        private readonly scenarioRepository: ScenarioRepository,
        private readonly executionEngine: IExecutionEngine,
        private readonly directorRepository?: DirectorRepository,
        private readonly eventBus?: IEventBus,
    ) {
        // Observe the conversation:* lifecycle for the active session so the
        // `ConversationSession` run record stays in sync with what actually
        // happened — independent of the UI/store, which have their own observer.
        for (const name of [
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
            EVENTS.CONVERSATION_TURN_ERROR,
            EVENTS.CONVERSATION_PAUSED,
            EVENTS.CONVERSATION_RESUMED,
            EVENTS.CONVERSATION_ABORTED,
            EVENTS.CONVERSATION_COMPLETED,
        ] as const) {
            this.busUnsubs.push(
                this.eventBus?.onSafe(name, (d) => this.applyConversationEvent(name, d)) ??
                    (() => {}),
            );
        }
    }

    /**
     * Best-effort persistence of the live run record so the Director panel can
     * show past runs (with their operator checkpoints) after reload (Q7).
     * Fire-and-forget: a storage failure must never break the run.
     */
    private persist(): void {
        if (!this.directorRepository || !this.session) return;
        void this.directorRepository.put(this.session).catch(() => undefined);
    }

    async loadScenario(id: string, invocationId?: string): Promise<ConversationScenario> {
        const found = await this.scenarioRepository.get(id);
        if (!found) {
            throw new Error(`ConversationDirectorService: scenario '${id}' not found`);
        }
        this.scenario = found;
        // A session is a distinct live run — its id is NOT the scenario id, so
        // the same blueprint can be launched many times and each run is tracked
        // separately.
        const sessionId = crypto.randomUUID();
        this.sessionId = sessionId;
        this.recording = new RecordingExecutionEngine(this.executionEngine);
        const context: ConversationContext = {
            topic: found.topic ?? found.name,
            participants: found.participants,
            history: [],
            metadata: {
                scenarioId: found.id,
                scenarioName: found.name,
                sessionId,
                ...(invocationId ? { invocationId } : {}),
            },
        };
        this.context = context;
        this.orchestrator = new ConversationOrchestrator(
            new HybridPolicy(found.turns),
            this.recording,
            context,
            this.eventBus,
        );
        const now = Date.now();
        this.session = {
            id: sessionId,
            scenarioId: found.id,
            scenarioName: found.name,
            status: 'idle',
            createdAt: now,
            updatedAt: now,
            events: [],
            checkpoints: [],
            results: [],
            currentParticipantId: null,
            currentTurnIndex: null,
            plannedTotal: found.turns.length,
            plannedDone: 0,
            injectedDone: 0,
            failed: 0,
        };
        this.setState('idle');
        this.persist();
        return found;
    }

    async run(): Promise<void> {
        if (!this.scenario || !this.orchestrator || !this.recording) {
            throw new Error('ConversationDirectorService: no scenario loaded');
        }
        if (this.isRunning) return;
        this.isRunning = true;
        this.setState('running');
        const sessionId = this.sessionId;
        const recording = this.recording;
        // Eagerly create the session AbortController so an abort() arriving
        // during the very first turn has a live signal to fire (B-08).
        this.orchestrator.getAbortSignal(sessionId);
        try {
            while ((this.phase as any) !== 'paused' && (this.phase as any) !== 'aborted') {
                const before = recording.results.length;
                await this.orchestrator.processNextStep(sessionId);
                if (recording.results.length === before) {
                    // Nothing executed: either paused/aborted (handled above) or the
                    // policy is exhausted → completion.
                    if (this.phase === 'paused' || this.phase === 'aborted') break;
                    this.setState('completed');
                    break;
                }
            }
        } catch (e) {
            // An abort-induced throw must be reported as 'aborted', never as a
            // generic failure (B-01).
            if (this.orchestrator?.isAborted(sessionId)) {
                this.setState('aborted');
            } else {
                this.setState('error');
            }
            throw e;
        } finally {
            this.isRunning = false;
            this.persist();
        }
    }

    pause(): void {
        this.orchestrator?.pause();
        this.setState('paused');
        this.persist();
    }

    async resume(): Promise<void> {
        // Resume must clear the abort flag and drop the (poisoned) controller,
        // otherwise the next processNextStep immediately returns and the run is
        // silently marked 'completed' (B-09).
        this.orchestrator?.clearAbort(this.sessionId);
        this.orchestrator?.resume();
        this.setState('running');
        await this.run();
    }

    abort(): void {
        this.orchestrator?.abortSession(this.sessionId);
        this.setState('aborted');
        this.persist();
    }

    skipNext(): void {
        this.orchestrator?.skipNext();
    }

    overrideTurn(proposal: TurnProposal): void {
        this.orchestrator?.overrideTurn(proposal);
    }

    getState(): DirectorState {
        return this.state;
    }

    getResults(): TurnResult[] {
        return this.recording?.results ?? [];
    }

    getScenario(): ConversationScenario | undefined {
        return this.scenario;
    }

    getSession(): ConversationSession | undefined {
        return this.session;
    }

    /**
     * Capture a named snapshot of the live run into the session's checkpoints.
     * Checkpoints make the run inspectable and are the foundation for later
     * rewind/replay — without ever mutating the scenario blueprint.
     */
    checkpoint(label?: string): string {
        if (!this.session) {
            throw new Error('ConversationDirectorService: no session loaded');
        }
        const id = crypto.randomUUID();
        const checkpoint: SessionCheckpoint = {
            id,
            at: Date.now(),
            label,
            cursor: this.session.results.length,
            history: this.context ? [...this.context.history] : [],
            results: [...this.session.results],
            status: this.session.status,
        };
        this.session.checkpoints.push(checkpoint);
        this.session.updatedAt = Date.now();
        this.persist();
        return id;
    }

    getCheckpoints(): SessionCheckpoint[] {
        return this.session?.checkpoints ?? [];
    }

    /** Release bus subscriptions (call when the service is disposed). */
    destroy(): void {
        this.busUnsubs.forEach((u) => u());
        this.busUnsubs = [];
    }

    /**
     * Keep the `ConversationSession` run record in sync with the actual
     * `conversation:*` events emitted during execution. Filtered by session id
     * so only this run's events are recorded.
     */
    private applyConversationEvent(type: string, d: Record<string, unknown>): void {
        const s = this.session;
        if (!s || (d.sessionId as string | undefined) !== s.id) return;

        s.events.push({ type, at: Date.now(), payload: d });

        const lifecycleStable = s.status !== 'paused' && s.status !== 'aborted';

        switch (type) {
            case EVENTS.CONVERSATION_TURN_START:
                s.currentParticipantId = d.participantId as string;
                s.currentTurnIndex = (d.turnIndex as number | undefined) ?? null;
                if (lifecycleStable) this.setState('running');
                break;
            case EVENTS.CONVERSATION_TURN_COMPLETE:
                s.currentParticipantId = null;
                s.currentTurnIndex = null;
                s.results.push({ success: true, content: d.content as string | undefined });
                if (d.injected) s.injectedDone++;
                else s.plannedDone++;
                if (lifecycleStable) this.setState('running');
                break;
            case EVENTS.CONVERSATION_TURN_ERROR:
                s.currentParticipantId = null;
                s.currentTurnIndex = null;
                s.results.push({ success: false, error: d.error as string });
                s.failed++;
                if (lifecycleStable) this.setState('error');
                break;
            case EVENTS.CONVERSATION_PAUSED:
                this.setState('paused');
                break;
            case EVENTS.CONVERSATION_RESUMED:
                this.setState('running');
                break;
            case EVENTS.CONVERSATION_ABORTED:
                this.setState('aborted');
                break;
            case EVENTS.CONVERSATION_COMPLETED:
                this.setState('completed');
                break;
        }
        s.updatedAt = Date.now();
    }
}
