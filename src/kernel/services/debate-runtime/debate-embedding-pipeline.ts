import type { MemoryUnit } from './debate-memory-extractor';

// ── Embedding Chunk ────────────────────────────────────────────────

export interface EmbeddingChunk {
    readonly id: string;
    readonly sessionId: string;
    readonly unitId: string;
    readonly text: string;
    readonly embedding: Float32Array;
    readonly metadata: {
        readonly type: string;
        readonly agentId: string;
        readonly round: number;
        readonly confidence: number;
    };
    readonly createdAt: number;
}

export interface EmbeddingPipelineDeps {
    embedText: (text: string) => Promise<Float32Array>;
    store?: {
        config: {
            get<T>(key: string): Promise<T | null>;
            set<T>(key: string, value: T): Promise<void>;
        };
    };
}

// ── Pipeline ───────────────────────────────────────────────────────

const CHUNK_STORAGE_KEY = 'debate-embeddings';
const MAX_CHUNK_SIZE = 512;
const MAX_CHUNKS_PER_SESSION = 200;

export class DebateEmbeddingPipeline {
    private chunks = new Map<string, EmbeddingChunk[]>();
    private deps: EmbeddingPipelineDeps;
    private chunkIdCounter = 0;
    private _initialized = false;

    constructor(deps: EmbeddingPipelineDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        await this.loadChunks();
    }

    async processMemoryUnits(sessionId: string, units: MemoryUnit[]): Promise<EmbeddingChunk[]> {
        const newChunks: EmbeddingChunk[] = [];

        for (const unit of units) {
            const textChunks = this.chunkText(unit.content);
            for (const text of textChunks) {
                const embedding = await this.deps.embedText(text);
                this.chunkIdCounter++;
                const chunk: EmbeddingChunk = {
                    id: `chunk-${sessionId}-${this.chunkIdCounter}`,
                    sessionId,
                    unitId: unit.id,
                    text,
                    embedding,
                    metadata: {
                        type: unit.type,
                        agentId: unit.agentId,
                        round: unit.round,
                        confidence: unit.confidence,
                    },
                    createdAt: Date.now(),
                };
                newChunks.push(chunk);
            }
        }

        const existing = this.chunks.get(sessionId) || [];
        const merged = [...existing, ...newChunks];
        if (merged.length > MAX_CHUNKS_PER_SESSION) {
            merged.splice(0, merged.length - MAX_CHUNKS_PER_SESSION);
        }
        this.chunks.set(sessionId, merged);
        await this.saveChunks();
        return newChunks;
    }

    async searchSimilar(
        query: string,
        topK = 5,
        sessionId?: string,
    ): Promise<Array<{ chunk: EmbeddingChunk; score: number }>> {
        const queryEmbedding = await this.deps.embedText(query);
        const results: Array<{ chunk: EmbeddingChunk; score: number }> = [];

        const searchChunks = sessionId
            ? this.chunks.get(sessionId) || []
            : [...this.chunks.values()].flat();

        for (const chunk of searchChunks) {
            const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
            results.push({ chunk, score });
        }

        return results.sort((a, b) => b.score - a.score).slice(0, topK);
    }

    getSessionChunks(sessionId: string): EmbeddingChunk[] {
        return this.chunks.get(sessionId) || [];
    }

    removeSessionChunks(sessionId: string): void {
        this.chunks.delete(sessionId);
    }

    getStats(): { totalSessions: number; totalChunks: number } {
        let totalChunks = 0;
        for (const chunks of this.chunks.values()) {
            totalChunks += chunks.length;
        }
        return { totalSessions: this.chunks.size, totalChunks };
    }

    // ── Chunking ─────────────────────────────────────────────────

    private chunkText(text: string): string[] {
        if (text.length <= MAX_CHUNK_SIZE) return [text];

        const chunks: string[] = [];
        const sentences = text.split(/(?<=[.!?])\s+/);
        let current = '';

        for (const sentence of sentences) {
            if (current.length + sentence.length > MAX_CHUNK_SIZE && current.length > 0) {
                chunks.push(current.trim());
                current = '';
            }
            current += sentence + ' ';
            // DR-15: Force-split if single sentence exceeds MAX_CHUNK_SIZE
            while (current.length > MAX_CHUNK_SIZE) {
                chunks.push(current.slice(0, MAX_CHUNK_SIZE).trim());
                current = current.slice(MAX_CHUNK_SIZE);
            }
        }

        if (current.trim()) chunks.push(current.trim());
        return chunks.length > 0 ? chunks : [text.slice(0, MAX_CHUNK_SIZE)];
    }

    // ── Similarity ───────────────────────────────────────────────

    private cosineSimilarity(a: Float32Array, b: Float32Array): number {
        if (a.length !== b.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i]! * b[i]!;
            normA += a[i]! * a[i]!;
            normB += b[i]! * b[i]!;
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    // ── Persistence ──────────────────────────────────────────────

    private async loadChunks(): Promise<void> {
        if (!this.deps.store) return;
        try {
            const stored =
                await this.deps.store.config.get<Record<string, EmbeddingChunk[]>>(
                    CHUNK_STORAGE_KEY,
                );
            if (stored) {
                for (const [key, value] of Object.entries(stored)) {
                    // DR-16: Reconstruct Float32Array from stored regular array
                    const reconstructed = value.map((c) => ({
                        ...c,
                        embedding: new Float32Array(
                            Array.isArray(c.embedding) ? c.embedding : Object.values(c.embedding),
                        ),
                    }));
                    this.chunks.set(key, reconstructed);
                }
            }
        } catch {
            // Non-critical
        }
    }

    private async saveChunks(): Promise<void> {
        if (!this.deps.store) return;
        try {
            const data: Record<
                string,
                Array<Omit<EmbeddingChunk, 'embedding'> & { embedding: number[] }>
            > = {};
            for (const [key, value] of this.chunks) {
                // DR-16: Convert Float32Array to regular array for safe JSON serialization
                data[key] = value.map((c) => ({ ...c, embedding: Array.from(c.embedding) }));
            }
            await this.deps.store.config.set(CHUNK_STORAGE_KEY, data);
        } catch {
            // Non-critical
        }
    }

    destroy(): void {
        this._initialized = false;
        this.chunks.clear();
        this.chunkIdCounter = 0;
    }
}
