import { describe, it, expect } from 'vitest';
import { getFNVEmbedding, cosineSimilarity } from './embedding';

describe('getFNVEmbedding', () => {
    it('returns a deterministic normalized vector of requested length', () => {
        const a = getFNVEmbedding('hello world', 128);
        const b = getFNVEmbedding('hello world', 128);
        expect(a).toHaveLength(128);
        expect(a).toEqual(b);
        const magnitude = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
        expect(magnitude).toBeCloseTo(1, 5);
    });

    it('empty text yields a zero vector', () => {
        const v = getFNVEmbedding('', 64);
        expect(v.every((x) => x === 0)).toBe(true);
    });
});

describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
        const a = getFNVEmbedding('same', 32);
        expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5);
    });

    it('returns 0 on dimension mismatch and zero vectors', () => {
        expect(cosineSimilarity([1], [1, 2])).toBe(0);
        expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    });
});
