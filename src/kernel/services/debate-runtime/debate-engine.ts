import { genId } from '../../../utils/gen-id';
import { DebateProviderResolver } from './debate-query-engine';
import { buildConclusionLlmCall } from './debate-conclusion-engine';
import { DebateTopologyService } from './debate-topology';
import { createDebateOrchestrator } from './index';
import { buildPipeline } from './debate-pipeline-builder';
import type { PipelineEngine, PipelineEngineDeps } from './debate-pipeline-builder';
import { debateCallLlm, debateGetDefaultPrompt, type LlmCallerDeps } from './debate-llm-caller';
import type {
    DebateTopology,
    ParticipantConfig,
    DebateSessionSnapshot,
    IDebateEngine,
    IDebateSession,
    IDebateBudget,
    TimelineEntry,
} from '../../contracts/debate-runtime';
import type { DebateSession as DebateSessionInterface } from '../../contracts/debate-types';
import type { ILifecycle } from '../../contracts/lifecycle';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { createPhaseChangeHandler } from './debate-phase-handler';

import { DebateSessionContext } from './debate-session-context';
import { DebateMemory } from './debate-memory';
import { DebateBudget } from './debate-budget';
import { DebateSession as DebateSessionClass } from './debate-session';
import { snapshotToSession, type SnapshotBridgeContext } from './debate-snapshot-bridge';
import {
    DebatePersistenceManager,
    type PersistenceEngineState,
    type PersistenceDeps,
} from './debate-persistence-manager';

import type { DebateEngineDeps } from './debate-engine-types';
import { getDebateMaxDurationMs } from './debate-engine-types';
import {
    runProviderPreflight,
    evictExpiredWarmCache,
    clearWarmCacheAll,
    getWarmCacheSize,
} from './debate-provider-preflight';
import { cancelDebateSession, cleanupStaleSessions } from './debate-engine-cancel';

const LOGGER = rootLogger.child('DebateEngine');

export type { DebateEngineDeps } from './debate-engine-types';

export class DebateEngine implements IDebateEngine, ILifecycle {
    private sessionContexts = new Map<string, DebateSessionContext>();
    private sessions = new Map<string, IDebateSession>();
    private budgets = new Map<string, IDebateBudget>();
    private memories = new Map<string, DebateMemory>();
    private deps: DebateEngineDeps;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;
    private warmCacheEvictInterval: ReturnType<typeof setInterval> | null = null;
    private providerResolver: DebateProviderResolver;
    private topologyService: DebateTopologyService;
    private sessionStartTimes = new Map<string, number>();
    private sessionTimeoutTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private sessionAbortControllers = new Map<string, Map<string, AbortController>>();
    private sessionPhaseControllers = new Map<string, AbortController>();
    private runningSessions = new Set<string>();
    private preflightDone = new Set<string>();
    /** C13: Guards against duplicate concurrent preflight for the same provider across sessions */
    private _preflightingProviders = new Set<string>();
    /** Tracks cancelled session IDs so getContext() never recreates contexts for them. */
    private _cancelledSessionIds = new Set<string>();
    private persistence: DebatePersistenceManager;

    // Track fire-and-forget async ops so destroy() can await them with timeout
    private _pendingOps = new Map<string, Promise<unknown>>();
    private _nextOpId = 0;
    private _destroyed = false;
    private _trackOp<T>(name: string, promise: Promise<T>): Promise<T> {
        if (this._destroyed) return promise;
        const id = `${name}-${++this._nextOpId}`;
        this._pendingOps.set(id, promise);
        promise
            .finally(() => this._pendingOps.delete(id))
            .catch((err) => LOGGER.error('DebateEngine', 'Pending op failed', err));
        return promise;
    }

    constructor(deps: DebateEngineDeps) {
        this.deps = deps;
        this.topologyService = new DebateTopologyService();
        this.providerResolver =
            deps.providerResolver ??
            new DebateProviderResolver({
                get keyService() {
                    return deps.getKeyService();
                },
                get routerService() {
                    return deps.getRouterService();
                },
                get adapterRegistry() {
                    return deps.getAdapterRegistry();
                },
                getKeyStateStore: deps.getKeyStateStore,
            });
        const persistenceState: PersistenceEngineState = {
            sessions: this.sessions,
            budgets: this.budgets,
            memories: this.memories,
            contexts: this.sessionContexts,
            preflightDone: this.preflightDone,
            providerResolver: this.providerResolver,
        };
        const persistenceDeps: PersistenceDeps = {
            debateStore: deps.debateStore,
            eventBus: deps.eventBus,
            memoryExtractor: deps.memoryExtractor,
            evaluator: deps.evaluator,
        };
        this.persistence = new DebatePersistenceManager(persistenceState, persistenceDeps);
    }

    async init(): Promise<void> {}
    private _started = false;
    private _beforeUnloadHandler?: () => void;
    private _visibilityHandler?: () => void;
    async start(): Promise<void> {
        if (this._started) return;
        this._started = true;
        this.cleanupInterval = setInterval(() => this._cleanupStaleSessions(), 60000);
        this.warmCacheEvictInterval = setInterval(() => evictExpiredWarmCache(), 5 * 60 * 1000);
        // C1: Use visibilitychange (fires 5-10s before beforeunload) to persist
        // snapshots before tab close. Also keep a sync localStorage fallback for
        // beforeunload since async saveSnapshot may not complete in time.
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            this._visibilityHandler = () => {
                if (document.hidden) {
                    // Serialize saves to avoid Dexie transaction conflicts.
                    // Per-session try-catch so one corrupt session doesn't
                    // prevent others from persisting.
                    this._trackOp(
                        'visibilitySave',
                        (async () => {
                            for (const sessionId of this.sessions.keys()) {
                                if (!this.sessions.has(sessionId)) continue;
                                try {
                                    await this.saveSnapshot(sessionId);
                                } catch (e) {
                                    LOGGER.debug('DebateEngine', 'visibilitychange save skipped', {
                                        error: e,
                                        sessionId,
                                    });
                                }
                            }
                        })(),
                    ).catch((e) =>
                        LOGGER.debug('DebateEngine', 'visibilitychange save loop failed', {
                            error: e,
                        }),
                    );
                }
            };
            document.addEventListener('visibilitychange', this._visibilityHandler);
            this._beforeUnloadHandler = () => {
                // Tracked ops for graceful shutdown; sync backup below for crash recovery
                for (const sessionId of this.sessions.keys()) {
                    this._trackOp(
                        `beforeunload-save:${sessionId}`,
                        this.saveSnapshot(sessionId),
                    ).catch((err) => LOGGER.error('DebateEngine', 'beforeunload save failed', err));
                }
                // audit1#2: Sync localStorage fallback for crash recovery
                try {
                    const snapshot: Record<string, unknown> = {};
                    for (const [sid] of this.sessions) {
                        const snap = this.getSession(sid);
                        if (!snap) continue;
                        snapshot[sid] = {
                            id: snap.id,
                            topic: snap.topic,
                            phase: snap.phase,
                            round: snap.round,
                            startedAt: snap.startedAt,
                            updatedAt: Date.now(),
                        };
                    }
                    if (Object.keys(snapshot).length > 0) {
                        localStorage.setItem('debate-engine:sync-backup', JSON.stringify(snapshot));
                    }
                } catch {
                    // Sync backup is best-effort
                }
            };
            window.addEventListener('beforeunload', this._beforeUnloadHandler);
        }
        // P1-9: Restore orphaned sessions on bootstrap — zombie detection + paused restore
        try {
            await this._restoreOrphanedSessions();
        } catch (e) {
            LOGGER.warn(
                'DebateEngine',
                '_restoreOrphanedSessions failed during start — continuing',
                { error: e },
            );
        }
    }

    private async _restoreOrphanedSessions(): Promise<void> {
        const store = this.deps.debateStore;
        if (!store) return;
        const ZOMBIE_THRESHOLD = 5 * 60 * 1000;
        const records = await store.listSessions();
        for (const record of records) {
            if (record.phase === 'active' || record.phase === 'deliberating') {
                if (Date.now() - record.updatedAt > ZOMBIE_THRESHOLD) {
                    record.phase = 'failed';
                    await store.saveSnapshot(record);
                    LOGGER.warn(
                        'DebateEngine',
                        `Orphaned ${record.phase} session auto-failed (zombie)`,
                        {
                            sessionId: record.id,
                            age: Date.now() - record.updatedAt,
                        },
                    );
                } else {
                    record.phase = 'paused';
                    await store.saveSnapshot(record);
                    LOGGER.info('DebateEngine', `${record.phase} session auto-paused on reload`, {
                        sessionId: record.id,
                    });
                }
            }
            if (record.phase === 'paused') {
                await this.restoreSession(record.id);
            }
        }
    }

    private _cleanupStaleSessions(): void {
        cleanupStaleSessions({
            sessions: this.sessions,
            budgets: this.budgets,
            memories: this.memories,
            sessionContexts: this.sessionContexts,
            sessionAbortControllers: this.sessionAbortControllers,
            sessionPhaseControllers: this.sessionPhaseControllers,
            sessionTimeoutTimers: this.sessionTimeoutTimers,
            sessionStartTimes: this.sessionStartTimes,
            runningSessions: this.runningSessions,
            preflightDone: this.preflightDone,
            _cancelledSessionIds: this._cancelledSessionIds,
            providerResolver: this.providerResolver,
            eventBus: this.deps.eventBus,
        });
    }

    createSession(
        topology: DebateTopology,
        topic: string,
        participants: ParticipantConfig[],
        language?: string,
        qualitySettings?: Record<string, boolean>,
    ): string {
        const id = genId('debate');
        const session = new DebateSessionClass(id, topic, topology, participants, language);
        if (qualitySettings) {
            session.setQualitySettings(qualitySettings);
        }
        const budget = new DebateBudget(id, { maxRounds: topology.maxRounds });
        const phaseAbort = new AbortController();
        this.sessionPhaseControllers.set(id, phaseAbort);

        session.onPhaseChange(
            createPhaseChangeHandler(
                id,
                session,
                {
                    eventBus: this.deps.eventBus,
                    debateStore: this.deps.debateStore,
                    memoryExtractor: this.deps.memoryExtractor,
                    evaluator: this.deps.evaluator,
                    bayesianJudge: this.deps.bayesianJudge,
                    stanceDriftTracker: this.deps.stanceDriftTracker,
                    blindEval: this.deps.blindEval,
                    qualityCollector: this.deps.qualityCollector,
                },
                {
                    getContext: (sid) => this.getContext(sid),
                    getMemory: (sid) => this.getMemory(sid),
                    getTimeline: (sid) => this.getTimeline(sid),
                    saveSnapshot: (sid) => this.saveSnapshot(sid),
                },
                phaseAbort.signal,
            ),
        );

        this.sessions.set(id, session as IDebateSession);
        this.budgets.set(id, budget);

        this.deps.eventBus.emit(EVENTS.DEBATE_SESSION_CREATED, {
            sessionId: id,
            topic: topic || '(no topic)',
            topologyType: topology?.type || 'roundtable',
        });

        return id;
    }

    private getContext(sessionId: string): DebateSessionContext {
        let ctx = this.sessionContexts.get(sessionId);
        if (!ctx) {
            // DEFENSE: never recreate contexts for cancelled sessions — the
            // async pipeline generator may still yield events after cleanupMaps,
            // and each event handler calls getContext(). Recreating contexts
            // would allocate new DebateSessionContext objects (with timeline,
            // orchestrator, conclusionEngine) that are never cleaned up.
            if (this._cancelledSessionIds.has(sessionId)) {
                return new DebateSessionContext(async () => '', undefined, undefined, undefined);
            }
            const isOrphan = !this.sessions.has(sessionId);
            const llmCall = buildConclusionLlmCall({
                getAdapterRegistry: () => this.deps.getAdapterRegistry(),
                getKeyService: () => this.deps.getKeyService(),
                getKeyStateStore: this.deps.getKeyStateStore,
                providerResolver: this.providerResolver,
            });
            ctx = new DebateSessionContext(
                llmCall ?? (async () => ''),
                undefined,
                undefined,
                createDebateOrchestrator(this.topologyService),
            );
            // Don't persist orphan contexts in the map — the async pipeline
            // generator may still yield events after cleanupMaps, and each
            // event handler calls getContext(). Persisting orphans would pin
            // them in memory forever.
            if (!isOrphan) {
                this.sessionContexts.set(sessionId, ctx);
                this._trackOp('loadTimeline', ctx.timeline.loadPersisted(sessionId)).catch((e) =>
                    LOGGER.warn('DebateEngine', `Failed to load timeline for ${sessionId}`, {
                        error: e,
                    }),
                );
            }
        }
        return ctx;
    }

    private getMemory(sessionId: string): DebateMemory {
        let mem = this.memories.get(sessionId);
        if (!mem) {
            // Same defense as getContext: don't persist recreated memory for cleaned-up sessions
            if (!this.sessions.has(sessionId)) return new DebateMemory();
            mem = new DebateMemory();
            this.memories.set(sessionId, mem);
        }
        return mem;
    }

    async startSession(sessionId: string, isResume = false): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);
        if (session.phase === 'active') return;
        if (this.runningSessions.has(sessionId)) return;
        this.runningSessions.add(sessionId);

        const lockSvc = this.deps.distributedLock;
        let lock: import('../../contracts/cross-tab-lock').LockAcquisition | null = null;
        if (lockSvc) {
            const result = await lockSvc.acquire(`debate:${sessionId}`, { ttl: 60_000 });
            if (!result.lock) {
                this.runningSessions.delete(sessionId);
                throw new Error(`Cannot acquire debate lock: ${result.error}`);
            }
            lock = result.lock;
        }

        session.transition('queued');
        session.transition('initializing');
        session.transition('active');

        if (!this.sessionStartTimes.has(sessionId)) {
            this.sessionStartTimes.set(sessionId, Date.now());
            this.sessionTimeoutTimers.set(
                sessionId,
                setTimeout(() => {
                    const s = this.sessions.get(sessionId);
                    if (
                        !s ||
                        s.phase === 'cancelled' ||
                        s.phase === 'failed' ||
                        s.phase === 'completed'
                    ) {
                        this.sessionTimeoutTimers.delete(sessionId);
                        return;
                    }
                    LOGGER.warn(
                        'DebateEngine',
                        `Session ${sessionId} exceeded max duration (${getDebateMaxDurationMs()}ms) — cancelling`,
                    );
                    this.deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                        sessionId,
                        error: 'Debate exceeded max duration',
                    });
                    this.cancelSession(sessionId);
                    this.sessionTimeoutTimers.delete(sessionId);
                }, getDebateMaxDurationMs()),
            );
        }

        try {
            const result = await buildPipeline(this.toPipelineEngine(), isResume).run(sessionId);
            if (!result.ok) {
                const s = this.sessions.get(sessionId);
                if (
                    s &&
                    s.phase !== 'cancelled' &&
                    s.phase !== 'failed' &&
                    s.phase !== 'completed'
                ) {
                    try {
                        s.transition('failed');
                    } catch {
                        /* phase already terminal */
                    }
                    this.deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                        sessionId,
                        error: result.error,
                    });
                }
            }
        } finally {
            this.runningSessions.delete(sessionId);
            const timer = this.sessionTimeoutTimers.get(sessionId);
            if (timer) {
                clearTimeout(timer);
                this.sessionTimeoutTimers.delete(sessionId);
            }
            this.sessionStartTimes.delete(sessionId);
            if (lock) {
                lockSvc!.release(lock).catch((e) =>
                    LOGGER.warn('DebateEngine', 'Failed to release debate lock', {
                        sessionId,
                        error: e,
                    }),
                );
            }
        }
    }

    private toPipelineEngine(): PipelineEngine {
        return {
            sessions: this.sessions,
            budgets: this.budgets,
            deps: this.deps as unknown as PipelineEngineDeps,
            getMemory: (id) => this.getMemory(id),
            getContext: (id) => this.getContext(id),
            runProviderPreflight: (id) => this.runProviderPreflight(id),
            callLLM: (id, s, p, sig) => this.callLLM(id, s, p, sig),
            pauseSession: (id) => this.pauseSession(id),
            providerResolver: this.providerResolver,
            sessionAbortControllers: this.sessionAbortControllers,
        };
    }

    private async runProviderPreflight(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        return runProviderPreflight(
            sessionId,
            session,
            {
                getKeyService: () => this.deps.getKeyService(),
                getRouterService: () => this.deps.getRouterService(),
                getAdapterRegistry: () => this.deps.getAdapterRegistry(),
                getKeyStateStore: this.deps.getKeyStateStore,
            },
            this.preflightDone,
            this._preflightingProviders,
        );
    }

    private async callLLM(
        sessionId: string,
        session: IDebateSession,
        participant: ParticipantConfig,
        externalSignal?: AbortSignal,
    ): Promise<string> {
        const deps: LlmCallerDeps = {
            eventBus: this.deps.eventBus,
            deadLetterQueue: this.deps.deadLetterQueue,
            getKeyService: () => this.deps.getKeyService(),
            getAdapterRegistry: () => this.deps.getAdapterRegistry(),
            getKeyStateStore: this.deps.getKeyStateStore,
            getExecutionGovernor: this.deps.getExecutionGovernor,
            providerResolver: this.providerResolver,
            getMemory: (id) => this.getMemory(id),
            getDefaultPrompt: (nodeId, s) => this.getDefaultPrompt(nodeId, s),
            sessionAbortControllers: this.sessionAbortControllers,
            ragRetriever: this.deps.ragRetriever,
            isSessionCancelled: (id) => this._cancelledSessionIds.has(id),
            entanglementEngine: this.deps.entanglementEngine,
            anchoringService: this.deps.anchoringService,
            argumentGraphService: this.deps.argumentGraphService,
            vulnerabilityTargeting: this.deps.vulnerabilityTargeting,
            shadowOpponent: this.deps.shadowOpponent,
            adversarialSource: this.deps.adversarialSource,
            beliefMiningService: this.deps.beliefMiningService,
            minimaxPlanner: this.deps.minimaxPlanner,
            metaAgent: this.deps.metaAgent,
            steelmanService: this.deps.steelmanService,
            boPTracker: this.deps.boPTracker,
            consistencyService: this.deps.consistencyService,
            credibilityScorer: this.deps.credibilityScorer,
            similarityMonitor: this.deps.similarityMonitor,
            driftDetector: this.deps.driftDetector,
            insightBus: this.deps.insightBus,
            logicalFormExtractor: this.deps.logicalFormExtractor,
            justificationEnforcer: this.deps.justificationEnforcer,
            biasProfiler: this.deps.biasProfiler,
            interruptQueue: this.deps.interruptQueue,
            stakeholderMapper: this.deps.stakeholderMapper,
            calibrationService: this.deps.calibrationService,
            personaMixer: this.deps.personaMixer,
            frameTracker: this.deps.frameTracker,
            expertWitness: this.deps.expertWitness,
            stanceDriftTracker: this.deps.stanceDriftTracker,
            rhetoricalDeviceSelector: this.deps.rhetoricalDeviceSelector,
            scratchpadService: this.deps.scratchpadService,
            factCheckService: this.deps.factCheckService,
            qualityCollector: this.deps.qualityCollector,
            incentiveDetector: this.deps.incentiveDetector,
            gotDeliberation: this.deps.gotDeliberation,
            conceptBlender: this.deps.conceptBlender,
            outcomeForecaster: this.deps.outcomeForecaster,
        };

        // P2.4: Best-of-N — generate N responses and pick the best.
        // Configurable via session metadata. Default: 1 (disabled).
        const bestOfN = (session as { metadata?: Record<string, unknown> }).metadata?.bestOfN as
            number | undefined;
        if (bestOfN && bestOfN > 1 && session.round >= 2) {
            const candidates: Array<{ content: string; score: number }> = [];
            for (let i = 0; i < Math.min(bestOfN, 3); i++) {
                const candidateBudget = this.budgets.get(sessionId);
                try {
                    if (candidateBudget) {
                        await candidateBudget.reserveAndRecord(sessionId, 250, 250 * 0.000002);
                    }
                    const content = await debateCallLlm(
                        sessionId,
                        session,
                        participant,
                        deps,
                        externalSignal,
                    );
                    if (content && content !== 'cancelled' && content.length > 20) {
                        // Score: prefer longer responses with more substance
                        const score =
                            content.length +
                            (content.split(' ').length > 15 ? 50 : 0) +
                            (content.includes('because') ||
                            content.includes('therefore') ||
                            content.includes('however')
                                ? 30
                                : 0);
                        candidates.push({ content, score });
                    }
                } catch {
                    // Individual generation failure — skip this candidate
                }
            }
            if (candidates.length > 0) {
                candidates.sort((a, b) => b.score - a.score);
                return candidates[0]!.content;
            }
            // Fallthrough: if Best-of-N produced no valid candidates, return the
            // single-call result below
        }

        return debateCallLlm(sessionId, session, participant, deps, externalSignal);
    }

    private async getDefaultPrompt(nodeId: string, session: IDebateSession): Promise<string> {
        return debateGetDefaultPrompt(nodeId, session);
    }

    pauseSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        if (
            session.phase === 'paused' ||
            session.phase === 'completed' ||
            session.phase === 'cancelled'
        )
            return;
        // HIGH-4.1 fix: abort all in-flight LLM calls for this session on pause.
        // Previously only the orchestrator signal was aborted, leaving agent calls
        // to run until timeout, wasting tokens.
        const agentControllers = this.sessionAbortControllers.get(sessionId);
        if (agentControllers) {
            for (const [, controller] of agentControllers)
                controller.abort(new Error('SessionPaused'));
        }
        this.getContext(sessionId).orchestrator.abort(sessionId);
        // H-6: graceful if transition invalid (e.g. consensus → paused)
        try {
            session.transition('paused');
        } catch {
            LOGGER.warn('DebateEngine', 'pauseSession: invalid transition', {
                sessionId,
                phase: session.phase,
            });
            return;
        }
        this.deps.eventBus.emit(EVENTS.DEBATE_SESSION_PAUSED, { sessionId });
        this._trackOp('pauseCheckpoint', this.saveSnapshot(sessionId)).catch((e) =>
            LOGGER.warn('DebateEngine', 'pause checkpoint failed', { error: e }),
        );
    }

    resumeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        const phase = session.phase;
        if (phase !== 'paused') return;
        this.getContext(sessionId).orchestrator.clearAbort(sessionId);
        // DR-2: Don't set phase here — startSession handles transitions
        this._trackOp('resumeSession', this.startSession(sessionId, true))
            .then(() => {
                this.deps.eventBus.emit(EVENTS.DEBATE_SESSION_RESUMED, { sessionId });
            })
            .catch((e) => {
                LOGGER.error('DebateEngine', 'resumeSession failed', {
                    sessionId,
                    error: e,
                });
                const s = this.sessions.get(sessionId);
                if (
                    s &&
                    s.phase !== 'completed' &&
                    s.phase !== 'cancelled' &&
                    s.phase !== 'failed'
                ) {
                    try {
                        s.transition('failed');
                    } catch {
                        /* phase already terminal */
                    }
                }
                this.deps.eventBus.emitOnce(EVENTS.DEBATE_SESSION_FAILED, sessionId, {
                    sessionId,
                    error: String(e),
                });
            });
    }

    cancelSession(sessionId: string): void {
        cancelDebateSession(sessionId, {
            sessions: this.sessions,
            budgets: this.budgets,
            memories: this.memories,
            sessionContexts: this.sessionContexts,
            sessionAbortControllers: this.sessionAbortControllers,
            sessionPhaseControllers: this.sessionPhaseControllers,
            sessionTimeoutTimers: this.sessionTimeoutTimers,
            sessionStartTimes: this.sessionStartTimes,
            runningSessions: this.runningSessions,
            preflightDone: this.preflightDone,
            _cancelledSessionIds: this._cancelledSessionIds,
            providerResolver: this.providerResolver,
            eventBus: this.deps.eventBus,
            distributedLock: this.deps.distributedLock,
        });
    }

    getSession(sessionId: string): DebateSessionSnapshot | undefined {
        return this.sessions.get(sessionId)?.snapshot();
    }

    getActiveSessions(): DebateSessionSnapshot[] {
        const active: DebateSessionSnapshot[] = [];
        for (const session of this.sessions.values()) {
            const phase = session.phase;
            if (phase !== 'completed' && phase !== 'failed' && phase !== 'cancelled') {
                active.push(session.snapshot());
            }
        }
        return active;
    }

    getAllSessions(): DebateSessionSnapshot[] {
        const all: DebateSessionSnapshot[] = [];
        for (const session of this.sessions.values()) {
            all.push(session.snapshot());
        }
        return all.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async saveSnapshot(sessionId: string): Promise<void> {
        return this.persistence.saveSnapshot(sessionId);
    }

    async restoreSession(sessionId: string): Promise<DebateSessionSnapshot | null> {
        return this.persistence.restoreSession(sessionId);
    }

    getTimeline(sessionId: string): TimelineEntry[] {
        return this.getContext(sessionId).timeline.getEntries(sessionId);
    }

    exportLegacySession(
        sessionId: string,
        ctx: Omit<SnapshotBridgeContext, 'timeline'>,
    ): DebateSessionInterface | null {
        const snapshot = this.getSession(sessionId);
        if (!snapshot) return null;
        const timeline = this.getTimeline(sessionId);
        return snapshotToSession(snapshot, { ...ctx, timeline });
    }

    dumpSizes(): import('../../utils/memory-tracker').EngineSizes {
        let abortControllersAgents = 0;
        for (const ctrl of this.sessionAbortControllers.values())
            abortControllersAgents += ctrl.size;
        return {
            sessionContexts: this.sessionContexts.size,
            sessions: this.sessions.size,
            budgets: this.budgets.size,
            memories: this.memories.size,
            sessionStartTimes: this.sessionStartTimes.size,
            sessionTimeoutTimers: this.sessionTimeoutTimers.size,
            sessionAbortControllers: this.sessionAbortControllers.size,
            sessionAbortControllersAgents: abortControllersAgents,
            sessionPhaseControllers: this.sessionPhaseControllers.size,
            runningSessions: this.runningSessions.size,
            preflightDone: this.preflightDone.size,
            warmCache: getWarmCacheSize(),
        };
    }

    async destroy(): Promise<void> {
        // C11: Set destroyed flag BEFORE cleanup — prevents _trackOp from
        // registering new pending ops while we're tearing down.
        this._destroyed = true;
        // Cancel all active sessions — cascades to budget/memory/context cleanup
        for (const sessionId of this.sessions.keys()) {
            this.cancelSession(sessionId);
        }
        // Await pending fire-and-forget ops with 5s timeout
        if (this._pendingOps.size > 0) {
            const pending = [...this._pendingOps.values()];
            await Promise.race([
                Promise.allSettled(pending),
                new Promise<void>((resolve) =>
                    setTimeout(() => {
                        LOGGER.warn(
                            'DebateEngine',
                            `destroy timed out waiting for ${this._pendingOps.size} pending ops`,
                        );
                        resolve();
                    }, 5000),
                ),
            ]);
        }
        // Safe-clear any remaining maps
        this.sessions.clear();
        this.budgets.clear();
        this.memories.clear();
        this.sessionContexts.clear();
        this._cancelledSessionIds.clear();
        this.providerResolver.clearAll();
        this.sessionAbortControllers.clear();
        for (const [, ctrl] of this.sessionPhaseControllers) ctrl.abort();
        this.sessionPhaseControllers.clear();
        this.runningSessions.clear();
        this.preflightDone.clear();
        this._preflightingProviders.clear();
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.warmCacheEvictInterval) {
            clearInterval(this.warmCacheEvictInterval);
            this.warmCacheEvictInterval = null;
        }
        clearWarmCacheAll();
        if (typeof window !== 'undefined' && this._beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this._beforeUnloadHandler);
            this._beforeUnloadHandler = undefined;
        }
        // H-33: Remove visibilitychange handler stored in start()
        if (typeof document !== 'undefined' && this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this._visibilityHandler = undefined;
        }
        this._started = false;
    }

    /** Clear the warm cache — called by MemoryWatchdog on heap pressure. */
    clearWarmCache(): void {
        clearWarmCacheAll();
    }
}
