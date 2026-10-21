/**
 * Memory vector space — storage and matching for memory embeddings.
 *
 * Two vector spaces can coexist in the memory mesh:
 *   - 'hash'     — the offline fallback (word hashing, 384 dims, no network)
 *   - 'provider' — real vectors from a provider embeddings API
 *
 * Vectors from different spaces are never compared: a provider query only
 * matches entries that were embedded in the provider space (and have the same
 * dimensionality).
 */

/** Dimension of the offline hash embedding. */
export const HASH_DIMENSIONS = 384;

export type VectorSpaceName = 'hash' | 'provider' | string;

export function hashEmbedding(text: string, dimensions = HASH_DIMENSIONS): number[] {
    const vector = new Array<number>(dimensions).fill(0);
    const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (const token of tokens) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = (hash << 5) - hash + token.charCodeAt(i);
            hash |= 0;
        }
        const idx = Math.abs(hash) % dimensions;
        vector[idx] = (vector[idx] ?? 0) + 1;
    }

    let norm = 0;
    for (const value of vector) norm += value * value;
    norm = Math.sqrt(norm);
    if (norm > 0) {
        for (let i = 0; i < vector.length; i++) vector[i] = (vector[i] ?? 0) / norm;
    }
    return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0,
        normA = 0,
        normB = 0;
    for (let i = 0; i < len; i++) {
        dot += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorSpace {
    private readonly vectors = new Map<string, number[]>();
    private readonly spaces = new Map<string, VectorSpaceName>();

    get size(): number {
        return this.vectors.size;
    }

    set(id: string, vector: number[], space: VectorSpaceName = 'hash'): void {
        this.vectors.set(id, vector);
        this.spaces.set(id, space);
    }

    get(id: string): number[] | undefined {
        return this.vectors.get(id);
    }

    spaceOf(id: string): VectorSpaceName {
        return this.spaces.get(id) ?? 'hash';
    }

    delete(id: string): void {
        this.vectors.delete(id);
        this.spaces.delete(id);
    }

    clear(): void {
        this.vectors.clear();
        this.spaces.clear();
    }

    /** FIFO prune down to `max` vectors. */
    prune(max: number): void {
        if (this.vectors.size <= max) return;
        const toRemove = this.vectors.size - max;
        let count = 0;
        for (const [id] of this.vectors.entries()) {
            if (count >= toRemove) break;
            this.delete(id);
            count++;
        }
    }

    /**
     * Score every vector that lives in the same space as the query and has the
     * same dimensionality. Returns the best matches first.
     */
    match(
        queryVector: number[],
        querySpace: VectorSpaceName = 'hash',
    ): Array<{ id: string; score: number }> {
        const scored: Array<{ id: string; score: number }> = [];
        for (const [id, vector] of this.vectors.entries()) {
            if (this.spaceOf(id) !== querySpace) continue;
            if (vector.length !== queryVector.length) continue;
            scored.push({ id, score: cosineSimilarity(queryVector, vector) });
        }
        return scored.sort((a, b) => b.score - a.score);
    }

    /** Detect the space of a persisted vector (hash vectors have a fixed size). */
    static detectSpace(vector: number[]): VectorSpaceName {
        return vector.length === HASH_DIMENSIONS ? 'hash' : 'provider';
    }
}
