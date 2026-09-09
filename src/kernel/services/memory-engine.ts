import { EVENTS } from '../events/event-names';
import { CONFIG } from './config-registry';
import { MemoryRepository } from '../dal/memory-repository';
import { computeMemoryId } from '../utils/compute-memory-id';
import type {
    MemoryEntry,
    MemoryStats,
    MemorySearchResult,
    MemoryPruneOptions,
    MemoryPruneResult,
} from '../types/memory-types';
import type { IMemoryEngine, MemoryCapability } from '../contracts/memory';
import type { ITransaction } from '../contracts/transaction';
import { TransactionContext } from './transaction';
import type { DatabaseService } from './database-service';
import { rootLogger } from './logger-service';
import { MemoryCache } from './memory/memory-cache';
import { MemoryWorkerClient, MEMORY_PENDING_TIMEOUT_MS } from './memory/memory-worker-client';
import { MemoryPruneScheduler } from './memory/memory-prune-scheduler';
import { passesMemoryQualityGate } from './memory/memory-quality-gate';
import { keywordFilterSearch, recallRank, computeEngineStats } from './memory/memory-search-utils';
const LOGGER = rootLogger.child('MemoryEngine');

function getMaxMemoryEntries(): number {
    return CONFIG?.services?.memory?.maxEntries ?? 1000;
}
function getMemoryTtlMs(): number {
    return CONFIG?.services?.cache?.defaultTTLMs ?? 30 * 24 * 60 * 60 * 1000;
}
function getPruneIntervalMs(): number {
    return getMemoryTtlMs() * 0.5;
}

export type SearchMode = 'auto' | 'semantic' | 'fulltext';

export interface MemoryServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    database: DatabaseService;
    executionGovernor?: {
        start(spec: { type: string; timeoutMs: number; metadata?: Record<string, unknown> }): {
            complete(): void;
            fail(e: Error): void;
        };
    };
}

export class MemoryService implements IMemoryEngine {
    private cache: MemoryCache;
    private semanticReady = false;
    private workerClient: MemoryWorkerClient;
    private pruneScheduler: MemoryPruneScheduler;
    private unsubs: Array<() => void> = [];
    private deps: MemoryServiceDeps;
    private memoryRepo: MemoryRepository;
    private _listenersSetup = false;

    private async _withTransaction<T>(
        source: string,
        fn: (tx: TransactionContext) => Promise<T>,
    ): Promise<T> {
        const tx = new TransactionContext(`MemoryEngine:${source}`);
        try {
            const result = await fn(tx);
            await tx.commit({
                emit: (event, data) => this.deps.eventBus.emit(event, data),
            });
            return result;
        } catch (e) {
            await tx.rollback({
                emit: (event, data) => this.deps.eventBus.emit(event, data),
            });
            throw e;
        }
    }

    constructor(deps: MemoryServiceDeps) {
        this.deps = deps;
        this.cache = new MemoryCache(getMaxMemoryEntries());
        this.memoryRepo = new MemoryRepository(deps.database);
        this.workerClient = new MemoryWorkerClient({
            onBackfill: (id, vector) => void this.backfillVector(id, vector),
        });
        this.pruneScheduler = new MemoryPruneScheduler({
            ttlMs: getMemoryTtlMs,
            intervalMs: getPruneIntervalMs,
            getMemories: () => this.cache.entries,
            setMemories: (memories) => this.cache.setAll(memories),
            pruneRepo: async (cutoff) => {
                await this.memoryRepo.prune(cutoff);
            },
            removeFromWorker: async (id) => {
                await this.workerClient.send('remove', { id });
            },
            withLock: (fn) => this.cache.withLock(fn),
            emitUpdated: () => {
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
            },
        });
    }

    async init() {
        if (this._listenersSetup) return;
        this.setupListeners();
        this._listenersSetup = true;
        await this.load();
        this.pruneScheduler.start();
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.pruneScheduler.stop();
        this.workerClient.destroy();
        this.cache.clear();
        this._listenersSetup = false;
        this.semanticReady = false;
    }

    async ensureSemantic(): Promise<void> {
        if (this.semanticReady) return;
        if (!CONFIG?.services?.memory?.semanticEnabled) return;
        if (!this.workerClient.ready) await this.workerClient.ensure(this.cache.entries);
        if (!this.workerClient.ready) return;
        try {
            await this.workerClient.send('enable_semantic');
            this.semanticReady = true;
            LOGGER.info('MemoryEngine', 'Semantic search ready (lazy)');
        } catch (e) {
            LOGGER.warn('MemoryEngine', 'Semantic search unavailable:', { error: e });
        }
    }

    private async backfillVector(id: string, vector: number[]) {
        try {
            await this.memoryRepo.update(id, { vector });
            await this.cache.withLock(async () => {
                const mem = this.cache.get(id);
                if (mem) {
                    const idx = this.cache.findIndex(id);
                    if (idx >= 0) {
                        this.cache.replaceAt(idx, { ...mem, vector });
                        this.deps.eventBus.emitOnce(
                            EVENTS.MEMORY_UPDATED,
                            'all',
                            this.cache.entries,
                        );
                    }
                }
            });
        } catch (e) {
            LOGGER.warn('MemoryEngine', 'Failed to persist embedding vector', { error: e });
        }
    }

    private async load() {
        try {
            if ((await this.memoryRepo.getCount()) > 0) {
                const loaded = (await this.memoryRepo.getAll()).slice(0, getMaxMemoryEntries());
                await this.cache.withLock(async () => {
                    this.cache.setAll(loaded);
                });
            }
        } catch (e) {
            LOGGER.error('MemoryEngine', 'Failed to load memory mesh', { error: e });
        }
        this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{
                output?: string;
                fullContent?: string;
                nodeId?: string;
                provider?: string;
            }>(EVENTS.COGNITIVE_STEP_COMPLETED, (d) => {
                if (d.output || d.fullContent) {
                    this._withTransaction('cognitiveStep', async (tx) => {
                        await this.store(
                            {
                                content: d.output || d.fullContent || '',
                                metadata: {
                                    source: d.nodeId || d.provider || 'unknown',
                                    type: 'decision',
                                    timestamp: Date.now(),
                                    importance: 0.4,
                                },
                            },
                            tx,
                        );
                    }).catch((e) => {
                        LOGGER.warn('MemoryEngine', 'Cognitive step store failed', { error: e });
                    });
                }
            }),
        );

        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.SETTINGS_UPDATED, (data: unknown) => {
                const changes = (data as { changes?: Record<string, unknown> })?.changes;
                if (
                    changes &&
                    'featureFlags.memory.enabled' in changes &&
                    changes['featureFlags.memory.enabled'] === false
                ) {
                    this.clear();
                }
            }),
        );
    }

    async store(entry: Omit<MemoryEntry, 'id'>, tx?: ITransaction) {
        if (!CONFIG.featureFlags.memory.enabled) return;
        if (!passesMemoryQualityGate(entry)) return;
        const source = entry.metadata.source ?? 'unknown';
        const type = entry.metadata.type ?? 'generic';
        const newEntry: MemoryEntry = {
            ...entry,
            id: await this.computeId(entry.content, source, type),
        } as MemoryEntry;
        await this.cache.withLock(async () => {
            const doPersist = async () => {
                await this.memoryRepo.save(newEntry);
                this.cache.unshift(newEntry);
            };
            const onCommit = () => {
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
            };
            if (tx) {
                const snapshot = tx.capture(this.cache.entries);
                tx.deferPersist(doPersist, async () => {
                    this.cache.setAll(snapshot as MemoryEntry[]);
                    await this.memoryRepo
                        .delete(newEntry.id)
                        .catch((err) =>
                            LOGGER.error(
                                'MemoryEngine',
                                'Rollback delete failed',
                                { id: '?' },
                                err,
                            ),
                        );
                });
                tx.onCommit(onCommit);
            } else {
                await this._withTransaction('store', async (itx) => {
                    const snapshot = structuredClone(this.cache.entries);
                    itx.deferPersist(doPersist, async () => {
                        this.cache.setAll(snapshot);
                        await this.memoryRepo
                            .delete(newEntry.id)
                            .catch((err) =>
                                LOGGER.error(
                                    'MemoryEngine',
                                    'Rollback delete failed',
                                    { id: '?' },
                                    err,
                                ),
                            );
                    });
                    itx.onCommit(onCommit);
                });
            }
            this.workerClient
                .ensure(this.cache.entries)
                .then(() => {
                    if (this.workerClient.ready) {
                        this.workerClient
                            .send('upsert', {
                                entry: newEntry,
                                generateEmbedding: this.semanticReady,
                            })
                            .catch((e) => {
                                LOGGER.warn('MemoryEngine', 'Worker insert failed', { error: e });
                                this.semanticReady = false;
                            });
                    }
                })
                .catch((e) => {
                    LOGGER.warn('MemoryEngine', 'init worker failed', {
                        error: e,
                    });
                    this.semanticReady = false;
                });
        });
    }

    async upsert(entry: Omit<MemoryEntry, 'id'>, tx?: ITransaction) {
        if (!CONFIG.featureFlags.memory.enabled) return;
        if (!passesMemoryQualityGate(entry)) return;
        const source = entry.metadata.source ?? 'unknown';
        const type = entry.metadata.type ?? 'generic';
        const deterministicId = await this.computeId(entry.content, source, type);
        const newEntry: MemoryEntry = { ...entry, id: deterministicId } as MemoryEntry;
        await this.cache.withLock(async () => {
            const doPersist = async () => {
                await this.memoryRepo.save(newEntry);
                this.cache.upsert(newEntry);
            };
            const onCommit = () => {
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
            };
            if (tx) {
                const snapshot = tx.capture(this.cache.entries);
                tx.deferPersist(doPersist, async () => {
                    this.cache.setAll(snapshot as MemoryEntry[]);
                    await this.memoryRepo
                        .delete(deterministicId)
                        .catch((err) =>
                            LOGGER.error(
                                'MemoryEngine',
                                'Rollback delete failed',
                                { id: '?' },
                                err,
                            ),
                        );
                });
                tx.onCommit(onCommit);
            } else {
                await this._withTransaction('upsert', async (itx) => {
                    const snapshot = structuredClone(this.cache.entries);
                    itx.deferPersist(doPersist, async () => {
                        this.cache.setAll(snapshot);
                        await this.memoryRepo
                            .delete(deterministicId)
                            .catch((err) =>
                                LOGGER.error(
                                    'MemoryEngine',
                                    'Rollback delete failed',
                                    { id: '?' },
                                    err,
                                ),
                            );
                    });
                    itx.onCommit(onCommit);
                });
            }
            this.workerClient
                .ensure(this.cache.entries)
                .then(() => {
                    if (this.workerClient.ready) {
                        this.workerClient
                            .send('upsert', {
                                entry: newEntry,
                                generateEmbedding: this.semanticReady,
                            })
                            .catch((e) => {
                                LOGGER.warn('MemoryEngine', 'Worker upsert failed', { error: e });
                                this.semanticReady = false;
                            });
                    }
                })
                .catch((e) => {
                    LOGGER.warn('MemoryEngine', 'init worker failed', {
                        error: e,
                    });
                    this.semanticReady = false;
                });
        });
    }

    private async computeId(content: string, source: string, type: string): Promise<string> {
        return computeMemoryId(content, source, type);
    }

    async storeBatch(entries: Omit<MemoryEntry, 'id'>[], tx?: ITransaction) {
        if (!CONFIG.featureFlags.memory.enabled) return;
        const filtered = entries.filter((e) => passesMemoryQualityGate(e));
        if (filtered.length === 0) return;
        const newEntries = await Promise.all(
            filtered.map(async (e) => {
                const src = e.metadata.source ?? 'unknown';
                const typ = e.metadata.type ?? 'generic';
                return { ...e, id: await this.computeId(e.content, src, typ) } as MemoryEntry;
            }),
        );
        const govOp = this.deps.executionGovernor?.start({
            type: 'memory-index',
            timeoutMs: 30_000,
            metadata: { operation: 'storeBatch', count: newEntries.length },
        });
        const idsToDelete = newEntries.map((e) => e.id);
        await this.cache.withLock(async () => {
            const doPersist = async () => {
                const persisted = await this.memoryRepo.storeBatch(
                    newEntries.map((e) => ({
                        content: e.content,
                        metadata: e.metadata,
                    })),
                );
                this.cache.prepend(persisted);
            };
            const onCommit = () => {
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
                govOp?.complete();
            };
            if (tx) {
                const snapshot = tx.capture(this.cache.entries);
                tx.deferPersist(doPersist, async () => {
                    this.cache.setAll(snapshot as MemoryEntry[]);
                    await Promise.allSettled(idsToDelete.map((id) => this.memoryRepo.delete(id)));
                });
                tx.onCommit(onCommit);
            } else {
                await this._withTransaction('storeBatch', async (itx) => {
                    const snapshot = structuredClone(this.cache.entries);
                    itx.deferPersist(doPersist, async () => {
                        this.cache.setAll(snapshot);
                        await Promise.allSettled(
                            idsToDelete.map((id) => this.memoryRepo.delete(id)),
                        );
                    });
                    itx.onCommit(onCommit);
                });
            }
            this.workerClient
                .ensure(this.cache.entries)
                .then(() => {
                    if (this.workerClient.ready) {
                        Promise.all(
                            newEntries.map((e) =>
                                this.workerClient.send('upsert', {
                                    entry: e,
                                    generateEmbedding: false,
                                }),
                            ),
                        ).catch((err) =>
                            LOGGER.warn('MemoryEngine', 'Batch insert to worker failed', {
                                error: err,
                            }),
                        );
                    }
                })
                .catch((e) => {
                    LOGGER.warn('MemoryEngine', 'init worker failed', {
                        error: e,
                    });
                    this.semanticReady = false;
                });
        });
    }

    getMemories(limit?: number): MemoryEntry[] {
        return this.cache.slice(limit);
    }

    getMemory(id: string): MemoryEntry | undefined {
        return this.cache.get(id);
    }

    async deleteMemory(id: string, tx?: ITransaction) {
        const idx = this.cache.findIndex(id);
        if (idx === -1) return;
        if (tx) {
            const snapshot = tx.capture(this.cache.entries);
            tx.deferPersist(
                async () => {
                    await this.memoryRepo.delete(id);
                    const newIdx = this.cache.findIndex(id);
                    if (newIdx !== -1) this.cache.spliceAt(newIdx);
                },
                async () => {
                    this.cache.setAll(snapshot as MemoryEntry[]);
                },
            );
            tx.onCommit(() => {
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
            });
        } else {
            try {
                await this.memoryRepo.delete(id);
            } catch (e) {
                LOGGER.error('MemoryEngine', 'Dexie delete failed — in-memory preserved', {
                    error: e,
                });
                return;
            }
            await this.cache.withLock(async () => {
                const newIdx = this.cache.findIndex(id);
                if (newIdx === -1) return;
                this.cache.spliceAt(newIdx);
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
            });
        }
        if (this.workerClient.ready) {
            await this.workerClient
                .send('remove', { id })
                .catch((e) => LOGGER.warn('MemoryEngine', 'Worker remove failed', { error: e }));
        } else {
            await this.workerClient
                .ensure(this.cache.entries)
                .catch((e) => LOGGER.warn('MemoryEngine', 'ensureWorker failed', { error: e }));
        }
    }

    async updateMemory(
        id: string,
        content: string,
        tx?: ITransaction,
    ): Promise<string | undefined> {
        const entry = this.cache.get(id);
        if (!entry) return undefined;
        const source = entry.metadata.source ?? 'unknown';
        const type = entry.metadata.type ?? 'generic';
        const newId = await this.computeId(content, source, type);
        let resultId: string | undefined;
        await this.cache.withLock(async () => {
            if (newId === id) {
                const updated = { ...entry, content };
                const doPersist = async () => {
                    await this.memoryRepo.save(updated);
                    Object.assign(entry, updated);
                };
                const onCommit = () => {
                    resultId = id;
                    this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
                };
                if (tx) {
                    const snapshot = tx.capture(this.cache.entries);
                    tx.deferPersist(doPersist, async () => {
                        this.cache.setAll(snapshot as MemoryEntry[]);
                    });
                    tx.onCommit(onCommit);
                } else {
                    await this._withTransaction('updateMemory', async (itx) => {
                        const snapshot = structuredClone(this.cache.entries);
                        itx.deferPersist(doPersist, async () => {
                            this.cache.setAll(snapshot);
                        });
                        itx.onCommit(onCommit);
                    });
                }
            } else {
                const newEntry: MemoryEntry = {
                    ...entry,
                    id: newId,
                    content,
                    metadata: { ...entry.metadata, originalId: id },
                } as MemoryEntry;
                const doPersist = async () => {
                    await this.memoryRepo.delete(id);
                    await this.memoryRepo.save(newEntry);
                    const idx = this.cache.findIndex(id);
                    if (idx !== -1) this.cache.replaceAt(idx, newEntry);
                };
                const onCommit = () => {
                    resultId = newId;
                    this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
                };
                if (tx) {
                    const snapshot = tx.capture(this.cache.entries);
                    tx.deferPersist(doPersist, async () => {
                        this.cache.setAll(snapshot as MemoryEntry[]);
                        await this.memoryRepo
                            .delete(newId)
                            .catch((err) =>
                                LOGGER.error(
                                    'MemoryEngine',
                                    'Rollback delete failed',
                                    { id: '?' },
                                    err,
                                ),
                            );
                    });
                    tx.onCommit(onCommit);
                } else {
                    await this._withTransaction('updateMemory', async (itx) => {
                        const snapshot = structuredClone(this.cache.entries);
                        itx.deferPersist(doPersist, async () => {
                            this.cache.setAll(snapshot);
                            await this.memoryRepo
                                .delete(newId)
                                .catch((err) =>
                                    LOGGER.error(
                                        'MemoryEngine',
                                        'Rollback delete failed',
                                        { id: '?' },
                                        err,
                                    ),
                                );
                        });
                        itx.onCommit(onCommit);
                    });
                }
            }
            if (this.workerClient.ready) {
                this.workerClient
                    .send('remove', { id })
                    .then(() => {
                        const workerEntry: MemoryEntry =
                            newId === id
                                ? (entry as MemoryEntry)
                                : ({ ...entry, id: newId, content } as MemoryEntry);
                        return this.workerClient.send('insert', {
                            entry: workerEntry,
                            generateEmbedding: false,
                        });
                    })
                    .catch((e) =>
                        LOGGER.warn('MemoryEngine', 'Worker update failed', { error: e }),
                    );
            } else {
                this.workerClient
                    .ensure(this.cache.entries)
                    .catch((e) => LOGGER.warn('MemoryEngine', 'ensureWorker failed', { error: e }));
            }
        });
        return resultId;
    }

    async search(
        query: string,
        limit: number = 5,
        mode: SearchMode = 'auto',
    ): Promise<MemorySearchResult[]> {
        if (!CONFIG.featureFlags.memory.enabled) return [];
        if (!query.trim())
            return this.cache
                .slice(limit)
                .map((e) => ({ entry: e, score: 0, matchedOn: 'keyword' }));

        if (!this.workerClient.ready) {
            await this.workerClient
                .ensure(this.cache.entries)
                .catch((e) => LOGGER.warn('MemoryEngine', 'ensureWorker failed', { error: e }));
        }

        if (this.workerClient.dbReady && this.workerClient.ready) {
            const useSemantic = mode === 'semantic' || (mode === 'auto' && this.semanticReady);
            if (useSemantic && this.semanticReady) {
                const govOp = this.deps.executionGovernor?.start({
                    type: 'memory-index',
                    timeoutMs: MEMORY_PENDING_TIMEOUT_MS + 5000,
                    metadata: { operation: 'search_semantic', query: query.slice(0, 60) },
                });
                try {
                    const result = await this.workerClient.send('search_semantic', {
                        query,
                        limit,
                    });
                    govOp?.complete();
                    return (
                        (result.payload as { hits: (MemoryEntry & { score: number })[] }).hits || []
                    ).map((h) => ({
                        entry: h,
                        score: h.score,
                        matchedOn: 'semantic' as const,
                    }));
                } catch (e) {
                    govOp?.fail(e instanceof Error ? e : new Error(String(e)));
                    LOGGER.warn('MemoryEngine', 'Semantic search failed, falling back', {
                        error: e,
                    });
                }
            }
            try {
                const result = await this.workerClient.send('search', { query, limit });
                return (
                    (result.payload as { hits: { document: MemoryEntry; score: number }[] }).hits ||
                    []
                ).map((h) => ({
                    entry: h.document,
                    score: h.score,
                    matchedOn: 'keyword' as const,
                }));
            } catch (e) {
                LOGGER.warn('MemoryEngine', 'Worker search failed, falling back to local filter', {
                    error: e,
                });
            }
        }

        return keywordFilterSearch(this.cache.entries, query, limit);
    }

    getStats(): MemoryStats {
        return computeEngineStats(this.cache.entries);
    }

    async prune(options: MemoryPruneOptions): Promise<MemoryPruneResult> {
        const before = this.cache.length;
        const details: { type: string; count: number }[] = [];

        if (options.olderThan) {
            const cutoff = Date.now() - options.olderThan;
            const old = this.cache.entries.filter((m) => (m.metadata.timestamp ?? 0) < cutoff);
            if (old.length > 0) {
                if (!options.dryRun) {
                    await this.memoryRepo.prune(cutoff);
                    await this.cache.withLock(async () => {
                        this.cache.setAll(
                            this.cache.entries.filter((m) => (m.metadata.timestamp ?? 0) >= cutoff),
                        );
                    });
                }
                details.push({ type: 'olderThan', count: old.length });
            }
        }

        const importanceBelow = options.importanceBelow;
        if (importanceBelow !== undefined) {
            const low = this.cache.entries.filter(
                (m) => (m.metadata.importance ?? 0) < importanceBelow,
            );
            if (low.length > 0) {
                details.push({ type: 'importanceBelow', count: low.length });
                if (!options.dryRun) {
                    for (const m of low) {
                        await this.memoryRepo
                            .delete(m.id)
                            .catch((e) =>
                                LOGGER.warn(
                                    'MemoryEngine',
                                    'Failed to delete low-importance memory',
                                    { error: e },
                                ),
                            );
                    }
                    await this.cache.withLock(async () => {
                        this.cache.setAll(
                            this.cache.entries.filter(
                                (m) => (m.metadata.importance ?? 0) >= importanceBelow,
                            ),
                        );
                    });
                }
            }
        }

        const removed = before - this.cache.length;
        return {
            removed: options.dryRun ? details.reduce((s, d) => s + d.count, 0) : removed,
            bytesFreed: 0,
            details,
        };
    }

    async clear(tx?: ITransaction) {
        await this.cache.withLock(async () => {
            const doPersist = async () => {
                this.semanticReady = false;
                await this.memoryRepo.clear();
                this.cache.clear();
            };
            const onCommit = () => {
                this.deps.eventBus.emit(EVENTS.MEMORY_UPDATED, this.cache.entries);
            };
            if (tx) {
                const snapshot = tx.capture(this.cache.entries);
                tx.deferPersist(doPersist, async () => {
                    this.cache.setAll(snapshot as MemoryEntry[]);
                });
                tx.onCommit(onCommit);
            } else {
                await this._withTransaction('clear', async (itx) => {
                    const snapshot = structuredClone(this.cache.entries);
                    itx.deferPersist(doPersist, async () => {
                        this.cache.setAll(snapshot);
                    });
                    itx.onCommit(onCommit);
                });
            }
            if (this.workerClient.ready)
                await this.workerClient.send('init', { memories: [] }).catch((e) =>
                    LOGGER.warn('MemoryEngine', 'Worker re-init after clear failed', {
                        error: e,
                    }),
                );
        });
    }

    get isSemanticReady() {
        return this.semanticReady;
    }

    getCapabilities(): MemoryCapability {
        return {
            maxEntries: getMaxMemoryEntries(),
            maxStorageBytes: 50 * 1024 * 1024,
            supportedSearchModes: ['auto', 'semantic', 'fulltext'],
            supportsBatchOperations: true,
            supportsPruning: true,
            ttlSeconds: getMemoryTtlMs() / 1000,
        };
    }

    recall(context: string, limit = 3): MemoryEntry[] {
        if (!CONFIG.featureFlags.memory.enabled) return [];
        return recallRank(this.cache.entries, context, limit);
    }
}
