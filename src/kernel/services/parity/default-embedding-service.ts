/**
 * DefaultEmbeddingService — hash-based deterministic embeddings (offline).
 *
 * 384-dim, L2-normalized, no network. Good enough for local RAG until a
 * real provider embedder is wired. Used as default IEmbeddingPort.
 */
import type { IEmbeddingPort } from '../../contracts/parity';

function hashStr(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
}

function embedOne(text: string, dim = 384): number[] {
    const vec = new Array<number>(dim).fill(0);
    const words = text.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter(Boolean);
    for (const w of words) {
        const h = hashStr(w);
        for (let i = 0; i < 3; i++) {
            const idx = (h + i * 1009) % dim;
            vec[idx] = (vec[idx] ?? 0) + 1;
        }
    }
    // L2 normalize
    let norm = 0; for (const v of vec) norm += v*v;
    norm = Math.sqrt(norm) || 1;
    return vec.map(v => v / norm);
}

export class DefaultEmbeddingService implements IEmbeddingPort {
    async embed(texts: string[]): Promise<number[][]> {
        return texts.map(t => embedOne(t));
    }
}
