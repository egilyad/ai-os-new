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
import type { IMemoryEngine, MemoryCapability, MemoryQuery } from '../contracts/memory';
import type { IEmbeddingPort } from '../contracts/parity';
import type { ITransaction } from '../contracts/transaction';
import { TransactionContext } from './transaction';
import type { DatabaseService } from './database-service';
import { rootLogger } from './logger-service';
import { MemoryCache } from './memory/memory-cache';
import { MemoryWorkerClient, MEMORY_PENDING_TIMEOUT_MS } from './memory/memory-worker-client';
import { MemoryPruneScheduler } from './memory/memory-prune-scheduler';
import { MemoryAccessTracker } from './memory/memory-access-tracker';
import { passesMemoryQualityGate } from './memory/memory-quality-gate';
import {
    keywordFilterSearch,
    recallRank,
    computeEngineStats,
    matchesMemoryQuery,
} from './memory/memory-search-utils';
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
    /**
     * Optional real-embedding provider. Resolved lazily because the memory
     * service is created long before the LLM/key services exist.
     */
    getEmbedder?: () => IEmbeddingPort | undefined;
}

/** Label of the vector space used for provider embeddings. */
const PROVIDER_VECTOR_SPACE = 'provider';
/** Upper bound for the in-memory embedding cache (query + entry vectors). */
const EMBEDDING_CACHE_MAX = 500;

export class MemoryService implements IMemoryEngine {
    private cache: MemoryCache;
    private semanticReady = false;
    private workerClient: MemoryWorkerClient;
    private pruneScheduler: MemoryPruneScheduler;
    private accessTracker: MemoryAccessTracker;
    private unsubs: Array<() => void> = [];
    private deps: MemoryServiceDeps;
    private memoryRepo: MemoryRepository;
    private _listenersSetup = false;
    private _initPromise: Promise<void> | null = null;
    /** Cached provider embeddings (text -> vector), bounded by EMBEDDING_CACHE_MAX. */
    private embeddingCache = new Map<string, number[]>();
    /** Set once a provider embedding call fails, to avoid hammering a broken provider. */
    private providerEmbeddingsDisabled = false;

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
        this.accessTracker = new MemoryAccessTracker({
            get: (id) => this.cache.get(id),
            save: (entry) => this.memoryRepo.save(entry),
            onFlush: (entries) => {
                if (!this.workerClient.ready) return;
                for (const entry of entries) {
                    this.workerClient
                        .send('upsert', { entry, generateEmbedding: false })
                        .catch((e) =>
                            LOGGER.warn('MemoryEngine', 'Worker touch sync failed', { error: e }),
                        );
                }
            },
        });
    }

    async init() {
        // 4.4: promise-cached init (see CacheService) — concurrent callers
        // share one listener-setup + load instead of doubling both.
        if (this._listenersSetup) return;
        if (!this._initPromise) {
            this._initPromise = this._doInit();
            try {
                await this._initPromise;
            } finally {
                this._initPromise = null;
            }
        } else {
            await this._initPromise;
        }
    }

    private async _doInit() {
        if (this._listenersSetup) return;
        this.setupListeners();
        this._listenersSetup = true;
        await this.load();
        this.pruneScheduler.start();
        // Enable semantic search lazily (best-effort; no-op if disabled or worker unavailable).
        void this.ensureSemantic();
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.pruneScheduler.stop();
        this.accessTracker.destroy();
        this.workerClient.destroy();
        this.cache.clear();
        this.embeddingCache.clear();
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

    /**
     * Resolve a provider embedding for the given texts (best-effort).
     * Returns undefined when no provider is configured, the provider fails, or
     * embeddings are disabled — the caller then keeps the offline hash vectors.
     */
    private async providerEmbed(texts: string[]): Promise<number[][] | undefined> {
        if (!texts.length) return undefined;
        if (this.providerEmbeddingsDisabled) return undefined;
        const embedder = this.deps.getEmbedder?.();
        if (!embedder) return undefined;

        const pending: string[] = [];
        const cached: Array<number[] | undefined> = texts.map((text) => {
            const hit = this.embeddingCache.get(text);
            if (hit) return hit;
            pending.push(text);
            return undefined;
        });
        if (!pending.length) return cached as number[][];

        try {
            const vectors = await embedder.embed(pending);
            pending.forEach((text, idx) => {
                const vector = vectors[idx];
                if (!vector) return;
                this.embeddingCache.set(text, vector);
                if (this.embeddingCache.size > EMBEDDING_CACHE_MAX) {
                    const oldest = this.embeddingCache.keys().next().value;
                    if (oldest !== undefined) this.embeddingCache.delete(oldest);
                }
            });
            let cursor = 0;
            return cached.map((hit) => {
                if (hit) return hit;
                const vector = vectors[cursor++];
                return vector;
            }) as number[][];
        } catch (e) {
            this.providerEmbeddingsDisabled = true;
            LOGGER.warn('MemoryEngine', 'Provider embeddings unavailable, using hash vectors', {
                error: e,
            });
            return undefined;
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
                .then(async () => {
                    if (this.workerClient.ready) {
                        const vectors = await this.providerEmbed([newEntry.content]);
                        const vector = vectors?.[0];
                        await this.workerClient.send('upsert', {
                            entry: newEntry,
                            generateEmbedding: this.semanticReady,
                            vector,
                            vectorSpace: vector ? PROVIDER_VECTOR_SPACE : undefined,
                        });
                    }
                })
                .catch((e) => {
                    LOGGER.warn('MemoryEngine', 'Worker insert failed', { error: e });
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
                .then(async () => {
                    if (this.workerClient.ready) {
                        const vectors = await this.providerEmbed([newEntry.content]);
                        const vector = vectors?.[0];
                        await this.workerClient.send('upsert', {
                            entry: newEntry,
                            generateEmbedding: this.semanticReady,
                            vector,
                            vectorSpace: vector ? PROVIDER_VECTOR_SPACE : undefined,
                        });
                    }
                })
                .catch((e) => {
                    LOGGER.warn('MemoryEngine', 'Worker upsert failed', { error: e });
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
                .then(async () => {
                    if (this.workerClient.ready) {
                        const vectors = await this.providerEmbed(
                            newEntries.map((e) => e.content),
                        );
                        Promise.all(
                            newEntries.map((e, idx) =>
                                this.workerClient.send('upsert', {
                                    entry: e,
                                    generateEmbedding: false,
                                    vector: vectors?.[idx],
                                    vectorSpace: vectors?.[idx]
                                        ? PROVIDER_VECTOR_SPACE
                                        : undefined,
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
        if (!query.trim()) {
            const recent = this.cache
                .slice(limit)
                .map((e) => ({ entry: e, score: 0, matchedOn: 'keyword' as const }));
            this.accessTracker.touch(recent.map((r) => r.entry.id));
            return recent;
        }

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
                    const queryVectors = await this.providerEmbed([query]);
                    const queryVector = queryVectors?.[0];
                    const result = await this.workerClient.send('search_semantic', {
                        query,
                        limit,
                        queryVector,
                        querySpace: queryVector ? PROVIDER_VECTOR_SPACE : 'hash',
                    });
                    govOp?.complete();
                    const hits = (
                        (result.payload as { hits: (MemoryEntry & { score: number })[] }).hits || []
                    ).map((h) => ({
                        entry: h,
                        score: h.score,
                        matchedOn: 'semantic' as const,
                    }));
                    // Entries embedded in another space (e.g. legacy hash vectors)
                    // are invisible to a provider-space query — fall through to the
                    // keyword index instead of returning nothing.
                    if (!hits.length && queryVector) {
                        govOp?.complete();
                        const fallback = await this.workerClient.send('search', { query, limit });
                        const fallbackHits = (
                            (fallback.payload as { hits: { document: MemoryEntry; score: number }[] })
                                .hits || []
                        ).map((h) => ({
                            entry: h.document,
                            score: h.score,
                            matchedOn: 'keyword' as const,
                        }));
                        this.accessTracker.touch(fallbackHits.map((r) => r.entry.id));
                        return fallbackHits;
                    }
                    this.accessTracker.touch(hits.map((r) => r.entry.id));
                    return hits;
                } catch (e) {
                    govOp?.fail(e instanceof Error ? e : new Error(String(e)));
                    LOGGER.warn('MemoryEngine', 'Semantic search failed, falling back', {
                        error: e,
                    });
                }
            }
            try {
                const result = await this.workerClient.send('search', { query, limit });
                const hits = (
                    (result.payload as { hits: { document: MemoryEntry; score: number }[] }).hits ||
                    []
                ).map((h) => ({
                    entry: h.document,
                    score: h.score,
                    matchedOn: 'keyword' as const,
                }));
                this.accessTracker.touch(hits.map((r) => r.entry.id));
                return hits;
            } catch (e) {
                LOGGER.warn('MemoryEngine', 'Worker search failed, falling back to local filter', {
                    error: e,
                });
            }
        }

        const local = keywordFilterSearch(this.cache.entries, query, limit);
        this.accessTracker.touch(local.map((r) => r.entry.id));
        return local;
    }

    /**
     * Filtered search (namespaces/ACL): `filter` is matched on entry metadata
     * (agentId/roleId/sessionId/chatId/source/type/collection/parentId plus
     * importanceMin, timeRange and tags). Empty query returns cache entries
     * ranked by filter only, so callers can list a scope.
     */
    async searchAdvanced(query: MemoryQuery): Promise<MemorySearchResult[]> {
        const limit = query.limit ?? 5;
        const filter = query.filter;
        let results: MemorySearchResult[];

        if (query.query.trim()) {
            const fetched = await this.search(
                query.query,
                Math.max(limit * 10, 100),
                (query.mode as SearchMode) || 'auto',
            );
            results = fetched.filter((r) => matchesMemoryQuery(r.entry, filter));
        } else {
            results = this.cache.entries
                .filter((e) => matchesMemoryQuery(e, filter))
                .map((entry) => ({ entry, score: 0, matchedOn: 'keyword' as const }));
        }

        if (typeof query.minScore === 'number') {
            const minScore = query.minScore;
            results = results.filter((r) => (r.score ?? 0) >= minScore);
        }
        const final = results.slice(0, limit);
        this.accessTracker.touch(final.map((r) => r.entry.id));
        return final;
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

    recall(context: string, limit = 3, filter?: Record<string, unknown>): MemoryEntry[] {
        if (!CONFIG.featureFlags.memory.enabled) return [];
        const entries = filter
            ? this.cache.entries.filter((e) => matchesMemoryQuery(e, filter))
            : this.cache.entries;
        const ranked = recallRank(entries, context, limit);
        this.accessTracker.touch(ranked.map((e) => e.id));
        return ranked;
    }
}
