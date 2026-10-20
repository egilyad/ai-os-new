import {
    create,
    insert,
    remove as oramaRemove,
    search as oramaSearch,
    type AnyOrama,
} from '@orama/orama';
import type { MemoryEntry } from '../../types/memory';
import { rootLogger } from '../services/logger-service';
import { VectorSpace, hashEmbedding } from './memory-vector-space';
const LOGGER = rootLogger.child('MemoryWorker');

let db: unknown = null;
let entries: MemoryEntry[] = [];
let semanticReady = true;
/**
 * Embedding storage. Two spaces can coexist: 'hash' (offline fallback) and
 * 'provider' (real provider vectors) — vectors from different spaces are never
 * compared, so a provider query only sees provider-embedded entries.
 */
const vectors = new VectorSpace();
const MAX_ENTRIES = 10000;
const MAX_VECTORS = 10000;

const SCHEMA = {
    id: 'string',
    content: 'string',
    metadata: {
        source: 'string',
        type: 'string',
        timestamp: 'number',
        importance: 'number',
    },
} as const;

async function loadEmbeddingModel() {
    // Lightweight in-process embedding — no external model needed
    semanticReady = true;
}

/**
 * Resolve the vector for an entry: an externally supplied one wins, otherwise
 * the offline hash embedding is used as a fallback.
 */
function resolveEntryVector(
    id: string,
    content: string,
    supplied?: number[],
    space?: string,
): number[] | undefined {
    if (Array.isArray(supplied) && supplied.length > 0) {
        vectors.set(id, supplied, space || 'provider');
        return supplied;
    }
    if (!semanticReady) return undefined;
    const hashed = hashEmbedding(content);
    vectors.set(id, hashed, 'hash');
    return hashed;
}

function pruneEntries(): void {
    if (entries.length > MAX_ENTRIES) {
        const toRemove = entries.length - MAX_ENTRIES;
        const removed = entries.splice(0, toRemove);
        for (const entry of removed) {
            vectors.delete(entry.id);
            try {
                if (db) void oramaRemove(db as AnyOrama, entry.id);
            } catch (e) {
                LOGGER.warn('MemoryWorker', 'prune remove error', { error: e });
            }
        }
    }
}

function pruneVectors(): void {
    vectors.prune(MAX_VECTORS);
}

self.onmessage = async (event: MessageEvent) => {
    const { requestId, type, payload } = event.data;

    try {
        switch (type) {
            case 'init': {
                db = await create({ schema: SCHEMA });
                entries = payload?.memories || [];
                for (const m of entries) {
                    await insert(db as AnyOrama, m);
                    if (m.vector) {
                        const space =
                            m.metadata?.vectorData?.space ?? VectorSpace.detectSpace(m.vector);
                        vectors.set(m.id, m.vector, space);
                    }
                }
                self.postMessage({ requestId, type: 'init' });
                break;
            }

            case 'enable_semantic': {
                await loadEmbeddingModel();
                self.postMessage({ requestId, type: 'semantic_ready' });
                break;
            }

            case 'insert': {
                const entry: MemoryEntry = payload.entry;
                if (db) await insert(db as AnyOrama, entry);
                entries.push(entry);

                let embedding: number[] | undefined;
                if (payload.vector) {
                    embedding = resolveEntryVector(
                        entry.id,
                        entry.content,
                        payload.vector,
                        payload.vectorSpace,
                    );
                } else if (payload.generateEmbedding && semanticReady) {
                    embedding = resolveEntryVector(entry.id, entry.content);
                }

                pruneEntries();
                pruneVectors();

                self.postMessage({
                    requestId,
                    type: 'insert',
                    payload: { id: entry.id, embedding },
                });
                break;
            }

            case 'upsert': {
                const entry: MemoryEntry = payload.entry;
                const existingIdx = entries.findIndex((e) => e.id === entry.id);
                if (existingIdx >= 0) {
                    entries[existingIdx] = entry;
                    try {
                        if (db) await oramaRemove(db as AnyOrama, entry.id);
                    } catch (e) {
                        LOGGER.warn('MemoryWorker', 'upsert remove error', { error: e });
                    }
                } else {
                    entries.push(entry);
                }
                if (db) await insert(db as AnyOrama, entry);

                let embedding: number[] | undefined;
                if (payload.vector) {
                    embedding = resolveEntryVector(
                        entry.id,
                        entry.content,
                        payload.vector,
                        payload.vectorSpace,
                    );
                } else if (payload.generateEmbedding && semanticReady) {
                    embedding = resolveEntryVector(entry.id, entry.content);
                }

                pruneEntries();
                pruneVectors();

                self.postMessage({
                    requestId,
                    type: 'upsert',
                    payload: { id: entry.id, embedding },
                });
                break;
            }

            case 'remove': {
                const id = payload.id;
                entries = entries.filter((e) => e.id !== id);
                vectors.delete(id);
                try {
                    if (db) void oramaRemove(db as AnyOrama, id);
                } catch (e) {
                    LOGGER.warn('MemoryWorker', 'remove error', { error: e });
                }
                self.postMessage({ requestId, type: 'remove', payload: { id } });
                break;
            }

            case 'search': {
                if (!db) {
                    self.postMessage({ requestId, type: 'search', payload: { hits: [] } });
                    break;
                }
                const results = await oramaSearch(db as AnyOrama, {
                    term: payload.query,
                    limit: payload.limit ?? 5,
                    boost: { content: 2 },
                });
                self.postMessage({ requestId, type: 'search', payload: { hits: results.hits } });
                break;
            }

            case 'search_semantic': {
                if (!semanticReady || !db) {
                    self.postMessage({ requestId, type: 'search_semantic', payload: { hits: [] } });
                    break;
                }

                const querySpace = payload.querySpace || 'hash';
                const queryVec: number[] =
                    Array.isArray(payload.queryVector) && payload.queryVector.length > 0
                        ? payload.queryVector
                        : hashEmbedding(payload.query);
                const scored = vectors
                    .match(queryVec, querySpace)
                    .slice(0, payload.limit ?? 5)
                    .map(({ id, score }) => {
                        const entry = entries.find((e) => e.id === id);
                        return entry ? { ...entry, score } : null;
                    })
                    .filter((entry): entry is MemoryEntry & { score: number } => entry !== null);

                self.postMessage({ requestId, type: 'search_semantic', payload: { hits: scored } });
                break;
            }

            default:
                self.postMessage({
                    requestId,
                    type: 'error',
                    payload: { message: `Unknown message type: ${type}` },
                });
        }
    } catch (error) {
        self.postMessage({
            requestId,
            type: 'error',
            payload: { message: (error as Error)?.message ?? String(error) },
        });
    }
};

self.onmessageerror = (event) => {
    console.error('[MemoryWorker] Failed to deserialize message:', event);
};
