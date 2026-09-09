import { DEFAULT_DEBATE_LANGUAGE } from '../config-registry';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import type { IEventBus } from '../../types/interfaces';
import { safeJsonParse } from '../../../kernel/utils/safe-json';
import { DebateSession as DebateSessionClass } from './debate-session';
import { DebateBudget } from './debate-budget';
import { DebateSessionRecordSchema } from '../../types/schema-types';
import type { DebateStore } from '../../contracts/storage/debate-store';
import { createPhaseChangeHandler } from './debate-phase-handler';
import { DebateSessionContext } from './debate-session-context';
import type {
    DebateTopology,
    ParticipantConfig,
    DebateSessionSnapshot,
    IDebateSession,
    IDebateBudget,
} from '../../contracts/debate-runtime';

import { DebateMemory } from './debate-memory';
import type { DebateProviderResolver } from './debate-query-engine';
import type { DebateMemoryExtractor } from './debate-memory-extractor';
import type { IDebateEvaluator } from '../../contracts/debate-runtime';

const LOGGER = rootLogger.child('DebatePersistence');

const HEAP_HIGH_MB = 150;
const HEAP_CRITICAL_MB = 300;
const PRUNE_KEEP_ROUNDS = 3;
const MINIMAL_MEMORY_ITEMS = 50;

export interface PersistenceEngineState {
    sessions: Map<string, IDebateSession>;
    budgets: Map<string, IDebateBudget>;
    memories: Map<string, DebateMemory>;
    contexts: Map<string, DebateSessionContext>;
    preflightDone: Set<string>;
    providerResolver: DebateProviderResolver;
}

export interface PersistenceDeps {
    debateStore?: DebateStore;
    eventBus: IEventBus;
    memoryExtractor?: DebateMemoryExtractor;
    evaluator?: IDebateEvaluator;
}

export class DebatePersistenceManager {
    constructor(
        private state: PersistenceEngineState,
        private deps: PersistenceDeps,
    ) {}

    /** Sessions whose version=1 checkpoint warning has already been logged. */
    private readonly _versionWarnedSessions = new Set<string>();

    destroy(): void {
        this.state.sessions.clear();
        this.state.budgets.clear();
        this.state.memories.clear();
        this.state.contexts.clear();
        this.state.preflightDone.clear();
        this._versionWarnedSessions.clear();
    }

    private getMemory(sessionId: string): DebateMemory {
        let mem = this.state.memories.get(sessionId);
        if (!mem) {
            mem = new DebateMemory();
            this.state.memories.set(sessionId, mem);
        }
        return mem;
    }

    private currentHeapMB(): number {
        try {
            const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
            return mem?.usedJSHeapSize ? mem.usedJSHeapSize / (1024 * 1024) : 0;
        } catch {
            return 0;
        }
    }

    private pruneArgumentsForSave(
        args: ReadonlyArray<{
            agentId: string;
            content: string;
            round: number;
            timestamp: number;
            confidence: number;
            position?: string;
        }>,
        heapMB: number,
    ): Array<{
        agentId: string;
        content: string;
        round: number;
        timestamp: number;
        confidence: number;
        position?: string;
    }> {
        if (args.length === 0 || heapMB < HEAP_HIGH_MB) return [...args];
        let maxRound = 0;
        for (const a of args) {
            if (a.round > maxRound) maxRound = a.round;
        }
        const cutoff = maxRound - PRUNE_KEEP_ROUNDS;
        if (cutoff <= 0) return [...args];
        const pruned: Array<{
            agentId: string;
            content: string;
            round: number;
            timestamp: number;
            confidence: number;
            position?: string;
        }> = [];
        let stripped = 0;
        for (const a of args) {
            if (a.round <= cutoff && a.content) {
                pruned.push({ ...a, content: '' });
                stripped++;
            } else {
                pruned.push(a);
            }
        }
        if (stripped > 0) {
            LOGGER.info('DebatePersistence', `Pruned ${stripped} argument bodies before save`, {
                sessionId: args[0]?.agentId ?? '',
                heapMB: heapMB.toFixed(1),
                totalArgs: args.length,
                keepRounds: PRUNE_KEEP_ROUNDS,
            });
        }
        return pruned;
    }

    private async attemptSave(
        record: Record<string, unknown>,
        sessionId: string,
        session: IDebateSession,
    ): Promise<void> {
        const parsed = DebateSessionRecordSchema.safeParse(record);
        if (!parsed.success) {
            LOGGER.error('DebatePersistence', `saveSnapshot validation failed for ${sessionId}`, {
                errors: parsed.error.issues,
            });
            throw new Error(
                `saveSnapshot validation failed for ${sessionId}: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
            );
        }
        const MAX_RETRIES = 3;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const newVersion = await this.deps.debateStore!.saveSnapshot(
                    parsed.data as Parameters<DebateStore['saveSnapshot']>[0],
                );
                session.incrementVersion?.(newVersion);
                const ctx = this.state.contexts.get(sessionId);
                if (ctx) {
                    ctx.timeline.persist(sessionId).catch((e) =>
                        LOGGER.warn(
                            'DebatePersistence',
                            `Failed to persist timeline for ${sessionId}`,
                            {
                                error: e,
                            },
                        ),
                    );
                }
                return;
            } catch (err) {
                const errStr = String(err);
                if (errStr.includes('version conflict') && attempt < MAX_RETRIES - 1) {
                    LOGGER.warn(
                        'DebatePersistence',
                        `Version conflict on save, retrying (${attempt + 1}/${MAX_RETRIES})`,
                        {
                            sessionId,
                        },
                    );
                    const current = await this.deps.debateStore!.getSnapshot(sessionId);
                    if (current) {
                        const dbVersion = (current as { version?: number })?.version ?? 0;
                        parsed.data.version = dbVersion;
                    }
                    const backoffMs = Math.min(
                        100 * Math.pow(2, attempt) * (0.5 + Math.random()),
                        2000,
                    );
                    await new Promise((r) => setTimeout(r, backoffMs));
                    continue;
                }
                throw err;
            }
        }
    }

    async saveSnapshot(sessionId: string): Promise<void> {
        const store = this.deps.debateStore;
        if (!store) return;
        const session = this.state.sessions.get(sessionId);
        if (!session) return;
        const heapMB = this.currentHeapMB();
        const snap = session.snapshot();
        const args = [...(snap.arguments ?? [])];
        const prunedArgs = heapMB >= HEAP_HIGH_MB ? this.pruneArgumentsForSave(args, heapMB) : args;
        const memJson = (() => {
            const raw = this.getMemory(sessionId).toJSON();
            if (heapMB < HEAP_CRITICAL_MB) return JSON.stringify(raw);
            return JSON.stringify({
                claims: raw.claims.slice(-MINIMAL_MEMORY_ITEMS),
                steps: raw.steps.slice(-MINIMAL_MEMORY_ITEMS),
                chains: raw.chains.slice(-MINIMAL_MEMORY_ITEMS),
            });
        })();

        try {
            // Defensive: ensure all required string fields have fallbacks
            const record = {
                id: snap.id ?? session.id,
                topic: snap.topic && snap.topic.length > 0 ? snap.topic : session.topic,
                topologyType: snap.topology?.type ?? 'roundtable',
                phase: snap.phase ?? 'unknown',
                round: snap.round ?? 0,
                totalTokens: snap.totalTokens ?? 0,
                totalCost: snap.totalCost ?? 0,
                agentStates: JSON.stringify(snap.agentStates ?? []),
                topology: JSON.stringify(snap.topology ?? { type: 'roundtable' }),
                participants: JSON.stringify(session.participants ?? []),
                startedAt: snap.startedAt ?? Date.now(),
                updatedAt: snap.updatedAt ?? Date.now(),
                createdAt: snap.startedAt ?? Date.now(),
                arguments: JSON.stringify(prunedArgs),
                memory: memJson,
                language: snap.language ?? DEFAULT_DEBATE_LANGUAGE,
                version: snap.version ?? 1,
                failedProviders: JSON.stringify(
                    snap.failedProviders ? [...snap.failedProviders] : [],
                ),
                failedModels: JSON.stringify(snap.failedModels ? [...snap.failedModels] : []),
            };
            if (snap.version === 1 && !this._versionWarnedSessions.has(sessionId)) {
                this._versionWarnedSessions.add(sessionId);
                LOGGER.warn(
                    'DebatePersistence',
                    `saveSnapshot version=1 for ${sessionId} phase=${snap.phase} round=${snap.round}`,
                );
            }
            await this.attemptSave(record as Record<string, unknown>, sessionId, session);
        } catch (primaryErr) {
            LOGGER.error('DebatePersistence', `Primary saveSnapshot failed for ${sessionId}`, {
                error: primaryErr,
            });
            LOGGER.warn(
                'DebatePersistence',
                `Primary saveSnapshot failed for ${sessionId}, attempting minimal save`,
                {
                    error: primaryErr,
                    heapMB: heapMB.toFixed(1),
                },
            );
            try {
                const minimalRecord = {
                    id: snap.id ?? session.id,
                    topic: snap.topic && snap.topic.length > 0 ? snap.topic : session.topic,
                    topologyType: snap.topology?.type ?? 'roundtable',
                    phase: snap.phase ?? 'unknown',
                    round: snap.round ?? 0,
                    totalTokens: snap.totalTokens ?? 0,
                    totalCost: snap.totalCost ?? 0,
                    agentStates: JSON.stringify(
                        (snap.agentStates ?? []).map((s) => ({
                            agentId: s.agentId,
                            nodeId: s.nodeId,
                            phase: s.phase,
                            round: s.round,
                            tokensUsed: s.tokensUsed,
                            latency: s.latency,
                            lastActiveAt: s.lastActiveAt,
                        })),
                    ),
                    topology: JSON.stringify({ type: snap.topology?.type ?? 'roundtable' }),
                    participants: JSON.stringify(
                        (session.participants ?? []).map((p) => ({
                            agentId: p.agentId,
                            nodeId: p.nodeId,
                        })),
                    ),
                    startedAt: snap.startedAt ?? Date.now(),
                    updatedAt: snap.updatedAt ?? Date.now(),
                    createdAt: snap.startedAt ?? Date.now(),
                    arguments: '[]',
                    memory: '{}',
                    language: snap.language ?? DEFAULT_DEBATE_LANGUAGE,
                    version: snap.version ?? 1,
                    failedProviders: JSON.stringify(
                        snap.failedProviders ? [...snap.failedProviders] : [],
                    ),
                    failedModels: JSON.stringify(snap.failedModels ? [...snap.failedModels] : []),
                };
                await this.attemptSave(
                    minimalRecord as Record<string, unknown>,
                    sessionId,
                    session,
                );
                LOGGER.info(
                    'DebatePersistence',
                    `Minimal saveSnapshot succeeded for ${sessionId}`,
                    {
                        heapMB: heapMB.toFixed(1),
                    },
                );
            } catch (fallbackErr) {
                LOGGER.error(
                    'DebatePersistence',
                    `Minimal saveSnapshot also failed for ${sessionId}`,
                    { error: fallbackErr },
                );
                LOGGER.error(
                    'DebatePersistence',
                    `Minimal saveSnapshot also failed for ${sessionId}`,
                    {
                        error: fallbackErr,
                        heapMB: heapMB.toFixed(1),
                    },
                );
                this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `[DebatePersistence] Checkpoint failed for ${sessionId} — debate results may be lost`,
                    type: 'error',
                });
                throw fallbackErr;
            }
        }
    }

    async restoreSession(sessionId: string): Promise<DebateSessionSnapshot | null> {
        const store = this.deps.debateStore;
        if (!store) return null;
        const record = await store.getSnapshot(sessionId);
        if (!record) return null;
        const rp = DebateSessionRecordSchema.safeParse(record);
        if (!rp.success) {
            LOGGER.warn('DebatePersistence', `restoreSession: corrupted record ${sessionId}`, {
                errors: rp.error.issues,
            });
            return null;
        }
        const existing = this.state.sessions.get(sessionId);
        if (existing) return existing.snapshot();

        try {
            let topology: DebateTopology = safeJsonParse(record.topology) ?? ({} as DebateTopology);
            const participants: ParticipantConfig[] =
                safeJsonParse(record.participants || '[]') ?? [];

            // Defensive: fallback for corrupted records with missing fields
            const safeTopic =
                record.topic && record.topic.length > 0 ? record.topic : '(restored session)';
            const safeTopologyType =
                record.topologyType && record.topologyType.length > 0
                    ? record.topologyType
                    : 'roundtable';
            // Ensure topology always has a type
            if (!topology || typeof (topology as DebateTopology).type !== 'string') {
                (topology as DebateTopology) = {
                    type: safeTopologyType as DebateTopology['type'],
                } as DebateTopology;
            }

            const session = new DebateSessionClass(record.id, safeTopic, topology, participants);

            // Build snapshot from record for restore
            const parsedArgs: DebateSessionSnapshot['arguments'] = (() => {
                try {
                    if (record.arguments) {
                        const a = safeJsonParse(record.arguments);
                        return Array.isArray(a) ? a : [];
                    }
                } catch {
                    /* arguments optional */
                }
                return [];
            })();
            const restoredSnapshot: DebateSessionSnapshot = {
                id: record.id,
                topic: safeTopic,
                topology,
                phase: (record.phase || 'unknown') as DebateSessionSnapshot['phase'],
                round: record.round || 0,
                totalTokens: record.totalTokens || 0,
                totalCost: record.totalCost || 0,
                agentStates: safeJsonParse(record.agentStates || '[]') ?? [],
                startedAt: record.startedAt || Date.now(),
                updatedAt: record.updatedAt || Date.now(),
                language: (record as { language?: string }).language ?? DEFAULT_DEBATE_LANGUAGE,
                version: record.version || 1,
                arguments: parsedArgs,
                failedProviders:
                    safeJsonParse(
                        (record as { failedProviders?: string }).failedProviders ?? '[]',
                    ) ?? [],
                failedModels:
                    safeJsonParse((record as { failedModels?: string }).failedModels ?? '[]') ?? [],
            };
            session.restoreInternalState(restoredSnapshot);

            try {
                const mem = this.getMemory(record.id);
                const memData = safeJsonParse(record.memory || '{}');
                mem.restoreFrom(memData as import('../../contracts/debate-runtime').MemoryRecord);
            } catch {
                /* memory is optional */
            }

            session.onPhaseChange(
                createPhaseChangeHandler(
                    record.id,
                    session,
                    {
                        eventBus: this.deps.eventBus,
                        debateStore: this.deps.debateStore,
                        memoryExtractor: this.deps.memoryExtractor,
                        evaluator: this.deps.evaluator,
                    },
                    {
                        getContext: (sid) => {
                            let ctx = this.state.contexts.get(sid);
                            if (!ctx) {
                                ctx = new DebateSessionContext(
                                    async () => '',
                                    undefined,
                                    undefined,
                                    undefined,
                                );
                                this.state.contexts.set(sid, ctx);
                            }
                            return ctx;
                        },
                        getMemory: (sid) => this.getMemory(sid),
                        getTimeline: (sid) =>
                            (
                                this.state.contexts.get(sid) as DebateSessionContext
                            )?.timeline.getEntries(sid) ?? [],
                        saveSnapshot: (sid) => this.saveSnapshot(sid),
                    },
                    undefined,
                    ' (restored)',
                ),
            );

            this.state.sessions.set(record.id, session as IDebateSession);
            const budget = new DebateBudget(record.id);
            this.state.budgets.set(record.id, budget);

            this.deps.eventBus.emit(EVENTS.DEBATE_SESSION_CREATED, {
                sessionId: record.id,
                topic: safeTopic,
                topologyType: safeTopologyType,
            });

            return session.snapshot();
        } catch (e) {
            LOGGER.warn('DebatePersistence', 'Failed to reconstruct session from snapshot', {
                error: e,
            });
            return null;
        }
    }
}
