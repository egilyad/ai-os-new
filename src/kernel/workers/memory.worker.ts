import {
    create,
    insert,
    remove as oramaRemove,
    search as oramaSearch,
    type AnyOrama,
} from '@orama/orama';
import type { MemoryEntry } from '../../types/memory';
import { rootLogger } from '../services/logger-service';
const LOGGER = rootLogger.child('MemoryWorker');

let db: unknown = null;
let entries: MemoryEntry[] = [];
let semanticReady = true;
const vectors = new Map<string, number[]>();
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

/** Compute a fixed-size embedding using word-level hashing (no external deps). */
function getEmbedding(text: string, dimensions = 384): number[] {
    const vector = new Array(dimensions).fill(0);
    const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (const token of tokens) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = (hash << 5) - hash + token.charCodeAt(i);
            hash |= 0;
        }
        vector[Math.abs(hash) % dimensions] += 1;
    }

    let norm = 0;
    for (let i = 0; i < dimensions; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
        for (let i = 0; i < dimensions; i++) vector[i] /= norm;
    }
    return vector;
}

async function loadEmbeddingModel() {
    // Lightweight in-process embedding — no external model needed
    semanticReady = true;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0,
        normA = 0,
        normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
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
    if (vectors.size > MAX_VECTORS) {
        // Remove oldest vectors (FIFO based on insertion order approximation)
        const toRemove = vectors.size - MAX_VECTORS;
        let count = 0;
        for (const [id] of vectors.entries()) {
            if (count >= toRemove) break;
            vectors.delete(id);
            count++;
        }
    }
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
                    if (m.vector) vectors.set(m.id, m.vector);
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
                if (payload.generateEmbedding && semanticReady) {
                    embedding = await getEmbedding(entry.content);
                    vectors.set(entry.id, embedding);
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
                if (payload.generateEmbedding && semanticReady) {
                    embedding = await getEmbedding(entry.content);
                    vectors.set(entry.id, embedding);
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
                    if (db) await oramaRemove(db as AnyOrama, id);
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

                const queryVec = await getEmbedding(payload.query);
                const scored = entries
                    .filter((e) => vectors.has(e.id))
                    .map((e) => ({
                        ...e,
                        score: cosineSimilarity(queryVec, vectors.get(e.id)!),
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, payload.limit ?? 5);

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
