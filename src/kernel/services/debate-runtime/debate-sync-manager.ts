import { EVENTS } from '../../events/event-names';
import { CONFIG } from '../config-registry';
import { DebateGovernor } from './debate-governor';
import { DebateInterpreter } from './debate-interpreter';
import { DebatePostProcessor } from './debate-post-processor';
import type {
    DebateParticipant,
    DebateConfig,
    DebateSession,
    DebateStrategy,
    DebateVerdict,
    VerdictKeyArgument,
    ConclusionType,
    StanceResult,
} from '../../contracts/debate-types';
import type { DebateServiceDeps } from '../../contracts/debate-service-deps';
import type { IDebateEngine, DebateTopology } from '../../contracts/debate-runtime';
import { rootLogger } from '../logger-service';
import { DEFAULT_DEBATE_LANGUAGE } from '../config-registry';
import {
    participantsToConfig,
    mergeAndProcessSession,
    buildRoundtableTopology,
} from './debate-session-bridge';
import type { SnapshotBridgeContext } from './debate-session-bridge';
import { finalizeDebateState, emitFinalizeEvents } from './debate-finalizer';
import { loadActiveSession } from './debate-session-persistence';
import { checkDebatePreflight } from './debate-preflight';
import { getAllSettings } from './quality-settings-store';
import type { GovernorState } from './debate-governor/types';

import { logMemoryStats, estimateSessionBytes } from '../../utils/memory-tracker';

const LOGGER = rootLogger.child('DebateService.Sync');

export const DEFAULT_CONFIG: DebateConfig = {
    roundDelayMs: 2000,
    maxTokens: 1024,
    temperature: 0.7,
    debateTemperature: 0.5,
    useModerator: true,
    timeoutMs: 30000,
    maxDurationMs: 1_800_000,
    language: 'ru',
};

/** Thrown when a debate start collides with an already-active debate of the
 *  SAME owner (B-16 Phase 2 idempotency guard). Different owners (and manual,
 *  owner-less debates) are allowed to coexist — the structural silent-kill bug
 *  is gone because `startDebate` no longer cancels the previous session. */
export class DebateAlreadyActiveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DebateAlreadyActiveError';
    }
}

/**
 * Per-session runtime state. `DebateSyncManager` keeps one of these per running
 * (or recently-finished) debate in a `Map<sessionId, SyncEntry>`. The engine
 * (`IDebateEngine`) already supports multiple sessions keyed by `runtimeId`
 * (which equals `session.id`); the singleton was the only thing forcing a
 * single active debate. See docs/road/DEBATE_MULTI_SESSION_DESIGN.md (B-15/B-16
 * Phase 2).
 */
interface SyncEntry {
    /** Debate id — equals the engine `runtimeId` in practice. */
    sessionId: string;
    activeSession: DebateSession | null;
    runtimeSessionId: string | null;
    governor: DebateGovernor | null;
    bridgeCtx: SnapshotBridgeContext | null;
    /** Owner tag (B-16). `null` = manual/UI-owned. */
    owner: string | null;
    /** Completion promise so an execution delegate can await the run end. */
    runPromise: Promise<void>;
    unsubs: Array<() => void>;
    durationTimer: ReturnType<typeof setTimeout> | null;
    syncing: boolean;
    syncDebounceTimer: ReturnType<typeof setTimeout> | null;
    finalized: boolean;
}

export class DebateSyncManager {
    engine: IDebateEngine | null = null;
    postProcessor: DebatePostProcessor;
    deps: DebateServiceDeps | null = null;

    /** All live/terminal debate sessions, keyed by session id. */
    private readonly _entries = new Map<string, SyncEntry>();
    /** Which entry the UI is currently viewing (single-view projection, B-15/B-16). */
    private _activeSessionId: string | null = null;

    private _initUnsubs: Array<() => void> = [];
    private readonly _interpreter = new DebateInterpreter();
    private _engineOnly = false;
    private readonly _verdictCache = new Map<string, DebateVerdict>();
    private static readonly MAX_VERDICT_CACHE = 50;
    private static readonly RESTART_COOLDOWN_MS = 10_000;
    private _lastStartTime = 0;
    private _initialized = false;

    constructor(postProcessor: DebatePostProcessor) {
        this.postProcessor = postProcessor;
    }

    private _makeEntry(sessionId: string, owner: string | null): SyncEntry {
        return {
            sessionId,
            activeSession: null,
            runtimeSessionId: null,
            governor: DEFAULT_CONFIG.useGovernor !== false ? new DebateGovernor() : null,
            bridgeCtx: null,
            owner,
            runPromise: Promise.resolve(),
            unsubs: [],
            durationTimer: null,
            syncing: false,
            syncDebounceTimer: null,
            finalized: false,
        };
    }

    private _isTerminal(entry: SyncEntry): boolean {
        if (entry.runtimeSessionId === null) return true;
        const snap = entry.runtimeSessionId
            ? this.engine?.getSession(entry.runtimeSessionId)
            : null;
        const phase = snap?.phase ?? entry.activeSession?.status;
        return phase === 'completed' || phase === 'failed' || phase === 'cancelled';
    }

    /** Get the currently-viewed debate session (single-view projection). */
    getActiveDebateSession(): DebateSession | null {
        const id = this._activeSessionId;
        if (!id) return null;
        return this._entries.get(id)?.activeSession ?? null;
    }

    /** Switch which running debate the UI views (no effect on execution). */
    setActiveSessionId(id: string): void {
        if (!this._entries.has(id)) return;
        this._activeSessionId = id;
        this.deps?.activeDebateStore.setActiveSessionId(id);
    }

    /** Completion promise for a running debate (B-16), so an execution delegate
     *  can await the real end of the run. `undefined` if the session id is
     *  unknown or already finished. */
    getRunCompletion(sessionId: string): Promise<void> | undefined {
        return this._entries.get(sessionId)?.runPromise;
    }

    /** Get governor state (projection of the viewed session). */
    getDebateGovernorState(): GovernorState | null {
        return (
            (this.deps?.activeDebateStore.governorState as unknown as GovernorState | null) ?? null
        );
    }

    /** Set governor state (delegates to the active entry in the store). */
    setDebateGovernorState(state: GovernorState | null): void {
        this.deps?.activeDebateStore.setGovernorState(state);
    }

    /** Get cached verdict for a session. */
    getCachedVerdict(sessionId: string): DebateVerdict | undefined {
        return this._verdictCache.get(sessionId);
    }

    private _setCachedVerdict(sessionId: string, verdict: DebateVerdict): void {
        if (this._verdictCache.size >= DebateSyncManager.MAX_VERDICT_CACHE) {
            const firstKey = this._verdictCache.keys().next().value;
            if (firstKey) this._verdictCache.delete(firstKey);
        }
        this._verdictCache.set(sessionId, verdict);
    }

    /** Clear all cached verdicts — used between tournament matches to free memory. */
    clearVerdictCache(): void {
        this._verdictCache.clear();
    }

    /**
     * Strip argument content for rounds older than keepRounds behind the latest round.
     * Called under memory pressure to free LLM response strings without destroying
     * the argument structure (IDs, agentIds, metadata remain intact).
     * The governor's internal state and metrics are unaffected.
     */
    truncateArguments(entry: SyncEntry, keepRounds = 2): number {
        if (!entry.activeSession?.arguments?.length) return 0;
        const args = entry.activeSession.arguments;
        let maxRound = 0;
        for (const a of args) {
            if (a.round > maxRound) maxRound = a.round;
        }
        const cutoff = maxRound - keepRounds;
        let truncated = 0;
        for (const a of args) {
            if (a.round <= cutoff && a.content) {
                (a as { content?: string }).content = '';
                truncated++;
            }
        }
        if (truncated > 0) {
            LOGGER.info('DebateSyncManager', 'truncateArguments under memory pressure', {
                truncated,
                totalArgs: args.length,
                maxRound,
                keepRounds,
                bytesFreed: truncated * 1024,
            });
        }
        return truncated;
    }

    /** Expose FactCheckService for UI consumers (DebatePanel, FactCheckBadge). */
    get factCheckService() {
        return this.postProcessor.factCheckService;
    }

    /** Set deps after construction (called during DI wiring). */
    setDeps(deps: DebateServiceDeps): void {
        this.deps = deps;
        this._engineOnly = CONFIG.featureFlags.debate.engineOnly;
    }

    /** Initialize: load active session + register global event listeners. */
    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        if (!this.deps) return;
        const loaded = await loadActiveSession(this.deps.debateStore);
        if (loaded) {
            const entry = this._makeEntry(loaded.id, null);
            entry.activeSession = loaded;
            // A reloaded (non-running) debate has no engine runtime session.
            this._entries.set(loaded.id, entry);
            this._activeSessionId = loaded.id;
            this.deps.activeDebateStore.setSession(loaded);
        }
        this._initUnsubs.push(
            this.deps.eventBus.on(EVENTS.DEBATE_VERDICT_GENERATED, (data) => {
                const payload = data as { sessionId: string; verdict: DebateVerdict };
                // Only cache verdicts for sessions we are actually tracking.
                // DEBATE_VERDICT_GENERATED fires asynchronously (inside an LLM
                // .then() callback), so it can arrive long after clearVerdictCache()
                // and even after the next match has started. Without this guard,
                // the cache grows unboundedly between tournament matches.
                if (!this._entries.has(payload.sessionId)) return;
                this._setCachedVerdict(payload.sessionId, payload.verdict);
            }),
            this.deps.eventBus.on(EVENTS.SESSION_DELETED, (data) => {
                const payload = data as { id: string; type: string };
                if (payload.type !== 'debate') return;
                if (this._entries.has(payload.id)) {
                    LOGGER.info(
                        'DebateSyncManager',
                        `Debate session ${payload.id} deleted — cancelling`,
                    );
                    this.stopDebateInternal(payload.id);
                }
            }),
        );
    }

    /** Full debate start orchestration: preflight → entry → engine session → emit → start.
     *  Does NOT cancel any previously-running debate — concurrent debates coexist
     *  (B-16). The newly started debate becomes the viewed one. */
    async startDebate(
        topic: string,
        participants: DebateParticipant[],
        strategy: DebateStrategy = 'round_robin',
        maxRounds: number = 5,
        config?: Partial<DebateConfig>,
        chatSessionId?: string,
        owner?: string,
    ): Promise<DebateSession> {
        if (!this.deps) throw new Error('DebateService not initialized');
        const now = Date.now();
        if (now - this._lastStartTime < DebateSyncManager.RESTART_COOLDOWN_MS) {
            LOGGER.warn('DebateSyncManager', 'Restart throttled — cooldown active', {
                elapsed: now - this._lastStartTime,
            });
            throw new Error('Debate restart throttled — too soon since last start');
        }
        this._lastStartTime = now;
        // Phase 2 owner guard: an invocation (owner set) cannot start a second
        // non-terminal debate under the SAME owner. Different owners (and manual
        // owner-less debates) coexist — the structural silent-kill bug (B-16) is
        // gone because startDebate no longer cancels the previous session.
        if (owner) {
            for (const e of this._entries.values()) {
                if (e.owner === owner && !this._isTerminal(e)) {
                    throw new DebateAlreadyActiveError(
                        `Cannot start another debate owned by '${owner}': a non-terminal debate is already running for this owner`,
                    );
                }
            }
        }
        LOGGER.info('DebateSyncManager', 'Starting debate', {
            topic,
            participants: participants.length,
            strategy,
            maxRounds,
        });
        checkDebatePreflight(this.deps, participants);
        if (this._engineOnly && !this.engine)
            throw new Error('debate.engineOnly flag is set but no DebateEngine configured');
        const entry = this._makeEntry('', owner ?? null);
        const sessionConfig = { ...DEFAULT_CONFIG };
        if (config) Object.assign(sessionConfig, config);
        this._setupDurationTimer(entry, sessionConfig);
        for (const p of ['groq', 'gemini', 'openrouter', 'nvidia']) {
            try {
                this.deps.adapterRegistry.resetCircuitBreaker(p);
            } catch {
                /* ignore — circuit may not exist for this provider */
            }
        }
        const session = this._initEngineSession(
            entry,
            buildRoundtableTopology(participants, maxRounds),
            topic,
            participants,
            sessionConfig,
            { participants, strategy, maxRounds, config: sessionConfig },
        );
        entry.owner = owner ?? null;
        this._emitDebateStarted(session, topic, participants.length, chatSessionId);
        this._startEngineWithFinalize(entry);
        return session;
    }

    /** Topology-based debate start. */
    async startTopologyDebate(
        topology: DebateTopology,
        topic: string,
        participants: DebateParticipant[],
        config?: Partial<DebateConfig>,
        chatSessionId?: string,
    ): Promise<DebateSession> {
        if (!this.deps) throw new Error('DebateService not initialized');
        const now = Date.now();
        if (now - this._lastStartTime < DebateSyncManager.RESTART_COOLDOWN_MS) {
            LOGGER.warn('DebateSyncManager', 'Topology restart throttled — cooldown active', {
                elapsed: now - this._lastStartTime,
            });
            throw new Error('Debate restart throttled — too soon since last start');
        }
        this._lastStartTime = now;
        checkDebatePreflight(this.deps, participants);
        const entry = this._makeEntry('', null);
        const sessionConfig = { ...DEFAULT_CONFIG };
        if (config) Object.assign(sessionConfig, config);
        this._setupDurationTimer(entry, sessionConfig);
        for (const p of ['groq', 'gemini', 'openrouter', 'nvidia']) {
            try {
                this.deps.adapterRegistry.resetCircuitBreaker(p);
            } catch {
                /* ignore — circuit may not exist for this provider */
            }
        }
        const session = this._initEngineSession(
            entry,
            topology,
            topic,
            participants,
            sessionConfig,
            {
                participants,
                strategy: topology.type as DebateSession['strategy'],
                maxRounds: topology.maxDepth ?? 5,
                config: sessionConfig,
            },
        );
        entry.owner = null;
        this._emitDebateStarted(session, topic, participants.length, chatSessionId);
        this._startEngineWithFinalize(entry);
        return session;
    }

    /** Public stop — delegates to internal (finalizes the given or viewed session). */
    stopDebate(sessionId?: string): void {
        this.stopDebateInternal(sessionId ?? this._activeSessionId ?? undefined);
    }

    private _setupDurationTimer(entry: SyncEntry, sessionConfig: DebateConfig): void {
        const maxDuration = sessionConfig.maxDurationMs ?? 1_800_000;
        entry.durationTimer = setTimeout(() => {
            if (entry.activeSession?.status === 'active') {
                LOGGER.warn('DebateSyncManager', 'Debate timed out', { maxDuration });
                this.stopDebateInternal(entry.sessionId);
            }
        }, maxDuration);
    }

    private _initEngineSession(
        entry: SyncEntry,
        topology: DebateTopology,
        topic: string,
        participants: DebateParticipant[],
        sessionConfig: DebateConfig,
        bridgeCtx: SnapshotBridgeContext,
    ): DebateSession {
        if (!this.engine) throw new Error('No DebateEngine configured');

        // If experiment engine is active, randomize technique settings before session starts
        if (this.deps?.experimentEngine && sessionConfig.qualitySettings) {
            const enabledTechniques = Object.keys(sessionConfig.qualitySettings);
            const tempId = crypto.randomUUID();
            this.deps.experimentEngine.generateAssignmentForSession(tempId, enabledTechniques);
            sessionConfig.qualitySettings = getAllSettings();
        }

        const runtimeId = this.engine.createSession(
            topology,
            topic,
            participantsToConfig(participants),
            sessionConfig.language === 'en' ? 'English' : DEFAULT_DEBATE_LANGUAGE,
            sessionConfig.qualitySettings,
        );
        entry.runtimeSessionId = runtimeId;
        entry.sessionId = runtimeId;
        entry.bridgeCtx = bridgeCtx;
        entry.governor?.setMaxRounds(bridgeCtx.maxRounds);
        this._setupListeners(entry, runtimeId);
        this._syncSession(entry, true);
        const session = entry.activeSession;
        if (!session) throw new Error('No active session after sync');
        this._entries.set(session.id, entry);
        this._activeSessionId = session.id;
        this.deps?.activeDebateStore.setSession(session);
        if (entry.governor) {
            this.deps?.activeDebateStore.setGovernorStateFor(session.id, entry.governor.getState());
        }
        return session;
    }

    private _emitDebateStarted(
        session: DebateSession,
        topic: string,
        matchParticipants: number,
        chatSessionId?: string,
    ): void {
        if (!this.deps) return;
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Debate started: ${topic} with ${matchParticipants} agents`,
            type: 'info',
        });
        this.deps.eventBus.emit(EVENTS.DEBATE_STARTED, session);
        // 'default' is the chat store's virtual in-memory session (never persisted to
        // the session DB). Linking to it would create orphan link rows and fail
        // updateMeta with "Session default not found" — skip both.
        if (chatSessionId && chatSessionId !== 'default' && session?.id) {
            this.deps.sessionManager
                .link(chatSessionId, session.id, 'chat_to_debate', `Debate: ${topic}`)
                .catch((err) =>
                    LOGGER.error('DebateSyncManager', 'Failed to link debate to chat session', {
                        error: err,
                    }),
                );
            this.deps.sessionManager
                .updateMeta(chatSessionId, { linkedDebateId: session.id })
                .catch((err) =>
                    LOGGER.error(
                        'DebateSyncManager',
                        'Failed to update session meta with linkedDebateId',
                        { error: err },
                    ),
                );
        }
    }

    private _startEngineWithFinalize(entry: SyncEntry): void {
        const myId = entry.runtimeSessionId;
        if (!myId) return;
        const runPromise = this.engine!.startSession(myId)
            .then(() => {
                // Don't finalize if session was paused — pause/stop buttons need
                // runtimeSessionId to remain alive for engine-level operations.
                const snap = this.engine?.getSession(myId);
                if (snap && snap.phase === 'paused') {
                    this._syncSession(entry);
                    return;
                }
                // Terminal phase guard: if session is already completed/cancelled/failed,
                // stopDebateInternal() already finalized it. Skip silently.
                if (
                    snap &&
                    (snap.phase === 'completed' ||
                        snap.phase === 'cancelled' ||
                        snap.phase === 'failed')
                ) {
                    return;
                }
                this._finalizeInternal(entry);
            })
            .catch((e) => {
                LOGGER.warn('DebateSyncManager', 'Engine debate failed', { error: e });
                try {
                    // Defensive: if pipeline threw but session stuck in non-terminal
                    // phase (e.g. 'deliberating'), transition to 'failed'
                    const catchSnap = this.engine?.getSession(myId);
                    if (
                        catchSnap &&
                        catchSnap.phase !== 'completed' &&
                        catchSnap.phase !== 'cancelled' &&
                        catchSnap.phase !== 'failed'
                    ) {
                        this.engine?.cancelSession(myId);
                    }
                    this._syncSession(entry);
                    const catchSnap2 = this.engine?.getSession(myId);
                    if (
                        catchSnap2 &&
                        (catchSnap2.phase === 'completed' ||
                            catchSnap2.phase === 'cancelled' ||
                            catchSnap2.phase === 'failed')
                    ) {
                        return;
                    }
                    this._finalizeInternal(entry);
                } catch (inner) {
                    LOGGER.error('DebateSyncManager', 'Catch body failed', { error: inner });
                }
            });
        entry.runPromise = runPromise;
        void runPromise;
    }

    private stopDebateInternal(sessionId?: string): void {
        if (!sessionId) return;
        const entry = this._entries.get(sessionId);
        if (!entry) return;
        const sid = entry.runtimeSessionId;
        if (this.engine && sid) {
            const snap = this.engine.getSession(sid);
            if (
                snap &&
                snap.phase !== 'completed' &&
                snap.phase !== 'failed' &&
                snap.phase !== 'cancelled'
            ) {
                // Generate heuristic verdict BEFORE cancelSession destroys the
                // session data. The phase handler only generates an LLM verdict on
                // phase transition to 'completed', but governor stop / manual stop
                // transition directly to 'cancelled', bypassing the normal verdict path.
                if (entry.activeSession && entry.activeSession.arguments?.length > 0) {
                    this._emitHeuristicVerdict(entry.activeSession);
                }
                // Save snapshot BEFORE cancelSession destroys engine maps.
                this.engine
                    .saveSnapshot(sid)
                    .catch((e) =>
                        LOGGER.error(
                            'DebateSyncManager',
                            'saveSnapshot in stopDebateInternal failed',
                            { error: e, sessionId: sid },
                        ),
                    );
                this.engine.cancelSession(sid);
            }
            this._syncSession(entry);
            this._finalizeInternal(entry);
        }
    }

    private _emitHeuristicVerdict(session: DebateSession): void {
        const participantNameById = new Map(session.participants.map((p) => [p.id, p.name]));
        const agentScores = new Map<
            string,
            { count: number; totalWords: number; totalConfidence: number }
        >();
        for (const arg of session.arguments ?? []) {
            if (!arg.agentId || arg.agentId === 'human') continue;
            const entry = agentScores.get(arg.agentId) ?? {
                count: 0,
                totalWords: 0,
                totalConfidence: 0,
            };
            entry.count++;
            entry.totalWords += (arg.content ?? '').split(/\s+/).filter(Boolean).length;
            entry.totalConfidence += arg.confidence ?? 0.7;
            agentScores.set(arg.agentId, entry);
        }

        const allArgs = session.arguments ?? [];
        const keyArguments: VerdictKeyArgument[] = allArgs.slice(-5).map((a) => ({
            agentId: a.agentId ?? 'unknown',
            agentName: a.agentName ?? a.agentId ?? 'unknown',
            content: (a.content ?? '').slice(0, 500),
            stance: (a.position as 'pro' | 'con' | 'neutral') ?? 'neutral',
            strength: a.confidence ?? 0.7,
        }));

        let bestAgentId = '';
        let bestScore = -1;
        for (const [agentId, s] of agentScores) {
            const score =
                s.count * 1_000_000 +
                Math.min(s.totalWords, 999_999) +
                Math.min(Math.round(s.totalConfidence * 100), 999);
            if (score > bestScore) {
                bestScore = score;
                bestAgentId = agentId;
            }
        }

        const convergenceScore = session.convergenceScore ?? 0;
        let conclusionType: ConclusionType;
        let stanceResult: StanceResult;
        if (convergenceScore > 75) {
            conclusionType = 'consensus';
            stanceResult = 'balanced';
        } else if (bestAgentId && agentScores.size > 1) {
            const bestEntry = agentScores.get(bestAgentId)!;
            if (bestEntry.count > allArgs.length * 0.4) {
                conclusionType = 'dominance';
                stanceResult = 'pro_wins';
            } else {
                conclusionType = 'partial_agreement';
                stanceResult = 'no_clear_winner';
            }
        } else {
            conclusionType = 'inconclusive';
            stanceResult = 'no_clear_winner';
        }

        const verdict: DebateVerdict = {
            sessionId: session.id,
            topic: session.topic,
            summary:
                session.consensus ??
                `Debate concluded after ${session.currentRound ?? 0} rounds with ${allArgs.length} total arguments.`,
            conclusionType,
            stanceResult,
            keyArguments,
            reasoning: `Heuristic verdict (governor stop). ${bestAgentId ? `Leading participant: ${participantNameById.get(bestAgentId) || bestAgentId}` : 'No clear leader.'}`,
            confidence: Math.min(0.7, 0.3 + allArgs.length * 0.02),
            generatedAt: Date.now(),
            roundsTotal: session.currentRound ?? 0,
            totalTokens: 0,
        };

        this._setCachedVerdict(session.id, verdict);
        this.deps!.eventBus.emitOnce(EVENTS.DEBATE_VERDICT_GENERATED, session.id, {
            sessionId: session.id,
            verdict,
        });
    }

    destroy(): void {
        for (const entry of [...this._entries.values()]) {
            if (entry.runtimeSessionId && this.engine) {
                const snap = this.engine.getSession(entry.runtimeSessionId);
                if (
                    snap &&
                    snap.phase !== 'completed' &&
                    snap.phase !== 'failed' &&
                    snap.phase !== 'cancelled'
                ) {
                    this.engine.cancelSession(entry.runtimeSessionId);
                }
            }
            if (entry.activeSession && this.deps) {
                this.deps.sessionManager.saveToDebateHistory(entry.activeSession);
                if (entry.activeSession.arguments) {
                    for (const arg of entry.activeSession.arguments) {
                        (arg as { content?: string }).content = '';
                    }
                    entry.activeSession.arguments = [];
                }
            }
            this._clearListeners(entry);
        }
        for (const unsub of this._initUnsubs) unsub();
        this._initUnsubs = [];
        this.deps?.activeDebateStore.clearAll();
        this._entries.clear();
        this._activeSessionId = null;
        this.engine = null;
        this._verdictCache.clear();
    }

    private _syncSession(entry: SyncEntry, immediate = false): void {
        if (entry.syncing || !this.engine || !entry.runtimeSessionId || !entry.bridgeCtx) return;
        // Debounce rapid event-driven syncs by coalescing into a single microtask.
        // The initial _syncSession(entry, true) call from _initEngineSession bypasses debounce.
        if (!immediate) {
            if (entry.syncDebounceTimer) clearTimeout(entry.syncDebounceTimer);
            entry.syncDebounceTimer = setTimeout(() => {
                entry.syncDebounceTimer = null;
                void this._syncSessionImpl(entry).catch((e) =>
                    LOGGER.warn('DebateSyncManager', '_syncSessionImpl failed', { error: e }),
                );
            }, 16);
            return;
        }
        void this._syncSessionImpl(entry).catch((e) =>
            LOGGER.warn('DebateSyncManager', '_syncSessionImpl failed', { error: e }),
        );
    }

    private async _syncSessionImpl(entry: SyncEntry): Promise<void> {
        if (entry.syncing || !this.engine || !entry.runtimeSessionId || !entry.bridgeCtx) return;
        entry.syncing = true;
        try {
            const { session, newArgs } = mergeAndProcessSession(
                this.engine,
                entry.runtimeSessionId,
                entry.bridgeCtx,
                this.postProcessor,
                entry.governor,
                entry.activeSession,
            );
            if (!session) return;
            entry.activeSession = session;
            // Preserve consensus from previous store session if merge produced none.
            // Zombie-recovery (loadActiveSession) sets consensus on the store session,
            // but mergeAndProcessSession creates a fresh object without it.
            if (!entry.activeSession.consensus) {
                const prev = this.deps!.activeDebateStore.getSession(entry.activeSession.id);
                if (prev?.consensus) {
                    entry.activeSession.consensus = prev.consensus;
                }
            }
            // Check governor stop conditions BEFORE updating the Zustand store.
            const shouldStop = entry.governor && this._checkGovernorStopConditions(entry);
            // MEMORY PRESSURE: if total argument content exceeds 256KB, truncate old
            // rounds to reduce the payload sent to Zustand → React re-render → Chrome
            // renderer. This prevents OOM ("Aw, Snap!") before verdict generation.
            const totalBytes =
                entry.activeSession.arguments?.reduce(
                    (sum, a) => sum + (a.content?.length ?? 0),
                    0,
                ) ?? 0;
            if (totalBytes > 256_000) {
                this.truncateArguments(entry, 2);
            }
            this.deps!.activeDebateStore.upsertSession(entry.activeSession, false);
            // Governor state is mutated in-place by processGovernorFeeding() inside
            // mergeAndProcessSession(). Push the fresh state to the per-session store
            // slot so panels (Argument Graph) see the new claims each sync cycle.
            if (entry.governor) {
                this.deps!.activeDebateStore.setGovernorStateFor(
                    entry.activeSession.id,
                    entry.governor.getState(),
                );
            }
            if (shouldStop) {
                if (entry.runtimeSessionId) {
                    // AWAIT saveSnapshot BEFORE emitting events — prevents dual-write
                    // where listeners react to DEBATE_ARGUMENT/DEBATE_UPDATED before
                    // data is persisted to the database.
                    try {
                        await this.engine.saveSnapshot(entry.runtimeSessionId);
                    } catch (e) {
                        LOGGER.error(
                            'DebateSyncManager',
                            'saveSnapshot in syncSession (governor stop) failed',
                            { error: e },
                        );
                    }
                }
                this.stopDebateInternal(entry.sessionId);
                return;
            }
            if (!entry.runtimeSessionId) return;
            for (const arg of newArgs) {
                this.deps!.eventBus.emit(EVENTS.DEBATE_ARGUMENT, {
                    sessionId: entry.runtimeSessionId,
                    argument: arg,
                });
            }
            this.deps!.eventBus.emitOnce(EVENTS.DEBATE_UPDATED, session.id, session);
        } finally {
            entry.syncing = false;
        }
    }

    isEngineActive(): boolean {
        return this.engine !== null && this._entries.size > 0;
    }

    private _setupListeners(entry: SyncEntry, runtimeId: string): void {
        this._clearListeners(entry);
        const syncIfOurs = (payload: unknown) => {
            const p = payload as { sessionId?: string };
            if (p.sessionId !== runtimeId) return;
            this._syncSession(entry);
        };
        const events = [
            EVENTS.DEBATE_SESSION_STARTED,
            EVENTS.DEBATE_SESSION_PAUSED,
            EVENTS.DEBATE_SESSION_RESUMED,
            EVENTS.DEBATE_AGENT_RESPONDED,
            EVENTS.DEBATE_PHASE_CHANGED,
            EVENTS.DEBATE_ROUND_STARTED,
            EVENTS.DEBATE_ROUND_ENDED,
            // DEBATE_SESSION_COMPLETED intentionally excluded — DEBATE_PHASE_CHANGED
            // with to='completed' fires first and already triggers _syncSession().
            EVENTS.DEBATE_SESSION_FAILED,
            EVENTS.DEBATE_SESSION_CANCELLED,
        ];
        for (const event of events) {
            entry.unsubs.push(this.deps!.eventBus.on(event as string, syncIfOurs));
        }
    }

    private _finalizeInternal(entry: SyncEntry): void {
        // ATOMIC GUARD: set finalized FIRST to prevent concurrent calls from
        // stopDebateInternal (sync path) and _startEngineWithFinalize's .then()/
        // .catch() handler (async path) from both executing finalize logic.
        if (entry.finalized) return;
        entry.finalized = true;

        // DEFENSE: if runtimeSessionId is already null, another finalize (or a new
        // debate start) already cleaned up — don't touch listeners.
        if (!entry.runtimeSessionId) {
            LOGGER.warn(
                'DebateSyncManager',
                'finalizeInternal: runtimeSessionId already null — skipping',
                { sessionId: entry.sessionId },
            );
            return;
        }
        // DEFENSE: if the session is already cancelled/failed, skip verdict generation
        // and history persistence — the pipeline never reached natural completion.
        const session = entry.activeSession;
        if (session && (session.status === 'cancelled' || session.status === 'failed')) {
            this._clearTimers(entry);
            // Emit events even for failed/cancelled sessions — the session may have
            // accumulated arguments before the failure, and listeners like
            // DebateKnowledgeSyncService need them for memory sync.
            emitFinalizeEvents(session, {
                interpreter: this._interpreter,
                eventBus: this.deps!.eventBus,
            });
            this._clearListeners(entry);
            entry.runtimeSessionId = null;
            entry.bridgeCtx = null;
            entry.activeSession = null;
            entry.governor = null;
            LOGGER.info(
                'DebateSyncManager',
                'finalizeInternal: terminal session — events emitted',
                {
                    status: session.status,
                    sessionId: entry.sessionId,
                },
            );
            return;
        }
        this._clearTimers(entry);
        if (!session) return;
        // Apply final state mutations (status, metrics, interpretation) without emitting
        finalizeDebateState(session, {
            interpreter: this._interpreter,
            eventBus: this.deps!.eventBus,
        });
        // Update Zustand store with a DEEP COPY of the completed session so the
        // UI displays argument content (what each agent said). Then strip content
        // from the original session for memory-efficient history persistence.
        const storeArgs = session.arguments ? session.arguments.map((a) => ({ ...a })) : [];
        const storeSession = Object.assign(Object.create(Object.getPrototypeOf(session)), session, {
            arguments: storeArgs,
        }) as typeof session;
        this.deps!.debateLiveStore.clearSession(session.id);
        // upsert WITHOUT stealing focus: if the user is viewing a different running
        // debate, the view must not jump to this one as it finalizes.
        this.deps!.activeDebateStore.upsertSession(storeSession, false);
        if (entry.governor) {
            this.deps!.activeDebateStore.setGovernorStateFor(session.id, entry.governor.getState());
        }
        // Strip argument content BEFORE saveToDebateHistory. saveToDebateHistory
        // does structuredClone(session) — stripping content first prevents cloning
        // large LLM response strings, reducing old-gen promotion pressure.
        if (session.arguments) {
            for (const arg of session.arguments) {
                (arg as { content?: string }).content = '';
            }
        }
        // Persist BEFORE emitting events — prevents dual-write where listeners
        // react to DEBATE_ENDED before data is saved to the database
        this.deps!.sessionManager.saveToDebateHistory(session);
        // Use storeSession (contentful clone) for emit so that knowledge-sync
        // receives argument content for claim extraction, not the stripped session.
        emitFinalizeEvents(storeSession, {
            interpreter: this._interpreter,
            eventBus: this.deps!.eventBus,
        });
        // Finalize quality impact tracking for this session
        if (this.deps?.qualityCollector) {
            const qs = (session.config as { qualitySettings?: Record<string, boolean> } | undefined)
                ?.qualitySettings;
            const enabledTechniques = qs
                ? Object.entries(qs)
                      .filter(([, v]) => v !== false)
                      .map(([k]) => k)
                : [];
            this.deps.qualityCollector
                .finalizeSession(session.id, {
                    enabledTechniques,
                    topic: session.topic || '(no topic)',
                    strategy: session.strategy || 'round-robin',
                    participantCount: session.participants?.length ?? 0,
                    roundCount: session.currentRound ?? 0,
                    totalTokens: (session as { totalTokens?: number }).totalTokens ?? 0,
                    durationMs: session.createdAt ? Date.now() - session.createdAt : 0,
                })
                .catch((e: unknown) =>
                    LOGGER.warn('DebateSyncManager', 'qualityCollector.finalizeSession failed', {
                        sessionId: session.id,
                        error: String(e),
                    }),
                );
        }
        // Record experiment completion for this session
        if (this.deps?.experimentEngine) {
            const techniqueResults: Record<string, number> = {};
            const qualityCollector = this.deps.qualityCollector;
            if (qualityCollector) {
                for (const m of qualityCollector.getAllMetrics()) {
                    techniqueResults[m.techniqueId] = m.avgJudgeScoreDelta;
                }
            }
            this.deps.experimentEngine
                .recordSessionCompletion(session.id, techniqueResults)
                .catch((e: unknown) =>
                    LOGGER.warn('DebateSyncManager', 'recordSessionCompletion failed', {
                        sessionId: session.id,
                        error: String(e),
                    }),
                );
        }
        // Save engine snapshot BEFORE cleanupMaps destroys the session.
        const sid = entry.runtimeSessionId;
        if (this.engine && sid) {
            this.engine.saveSnapshot(sid).catch((e) =>
                LOGGER.error('DebateSyncManager', 'saveSnapshot in finalizeInternal failed', {
                    error: e,
                    sessionId: sid,
                }),
            );
        }
        this._clearListeners(entry);
        entry.runtimeSessionId = null;
        entry.bridgeCtx = null;
        entry.activeSession = null;
        entry.governor = null;
        // MEMORY TRACKER: log engine + sync manager + aggregate state after finalize
        if (this.engine) {
            const engineSizes = this.engine.dumpSizes();
            const liveState = this.deps!.debateLiveStore;
            const streamingMapsSize =
                liveState.streamingContent.size +
                liveState.emotions.size +
                liveState.agentCountdowns.size +
                liveState.agentAddressing.size +
                liveState.memoryBubbles.size +
                liveState.currentThinking.size;
            const ebStats = this.deps!.eventBus.getSubscriptionStats();
            logMemoryStats(
                'AfterFinalize',
                engineSizes,
                {
                    unsubs: entry.unsubs.length,
                    initUnsubs: this._initUnsubs.length,
                    verdictCache: this._verdictCache.size,
                    runtimeSessionId: entry.runtimeSessionId,
                    activeSessionSize: estimateSessionBytes(
                        entry.activeSession as Record<string, unknown> | null,
                    ),
                },
                {
                    embeddingChunks: 0,
                    policyRules: 0,
                    policyFirings: 0,
                    modeVersions: 0,
                    strategyVersions: 0,
                    eventBusListeners: ebStats.totalCallbacks,
                    completedSessions: this.deps?.sessionManager.getDebateHistory().length ?? 0,
                    liveStoreAgentEvents: liveState.agentEvents.length,
                    liveStoreRoundEvents: liveState.roundEvents.length,
                    liveStoreStreamingMaps: streamingMapsSize,
                    activeDebateSession: this._entries.size > 0 ? 1 : 0,
                },
            );
        }
    }

    private _checkGovernorStopConditions(entry: SyncEntry): boolean {
        if (!entry.governor) return false;
        if (!entry.governor.shouldStop()) return false;

        const synthesis = entry.governor.generateSynthesis();
        if (entry.activeSession) {
            const coreDisagreement = synthesis.coreDisagreement;
            const resolvedCount = synthesis.resolvedPoints.length;
            const unresolvedCount = synthesis.unresolvedPoints.length;
            entry.activeSession.consensus = `## Synthesis\n\n${synthesis.consensus}\n\n### Core Disagreement\n${coreDisagreement}\n\n### Resolved\n${resolvedCount} point(s)\n\n### Unresolved\n${unresolvedCount} point(s)`;
            this.deps!.eventBus.emit(EVENTS.DEBATE_CONSENSUS, {
                sessionId: entry.activeSession.id,
                topic: entry.activeSession.topic,
                consensus: entry.activeSession.consensus,
                convergenceScore: entry.activeSession.convergenceScore,
                synthesis,
            });
        }
        return true;
    }

    private _clearTimers(entry: SyncEntry): void {
        if (entry.durationTimer !== null) {
            clearTimeout(entry.durationTimer);
            entry.durationTimer = null;
        }
        if (entry.syncDebounceTimer !== null) {
            clearTimeout(entry.syncDebounceTimer);
            entry.syncDebounceTimer = null;
        }
    }

    private _clearListeners(entry: SyncEntry): void {
        for (const unsub of entry.unsubs) unsub();
        entry.unsubs = [];
    }
}
