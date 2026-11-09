import { describe, it, expect } from 'vitest';
import {
    HASH_DIMENSIONS,
    VectorSpace,
    cosineSimilarity,
    hashEmbedding,
} from './memory-vector-space';

describe('memory vector space', () => {
    it('produces a deterministic, normalized hash embedding', () => {
        const a = hashEmbedding('hello world');
        const b = hashEmbedding('hello world');
        expect(a).toHaveLength(HASH_DIMENSIONS);
        expect(a).toEqual(b);
        const norm = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
        expect(norm).toBeCloseTo(1, 5);
        expect(hashEmbedding('other text')).not.toEqual(a);
    });

    it('scores identical vectors as 1 and orthogonal vectors as 0', () => {
        expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 5);
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
    });

    it('stores vectors with their space', () => {
        const space = new VectorSpace();
        space.set('a', [1, 2, 3], 'provider');
        expect(space.get('a')).toEqual([1, 2, 3]);
        expect(space.spaceOf('a')).toBe('provider');
        space.delete('a');
        expect(space.get('a')).toBeUndefined();
        expect(space.size).toBe(0);
    });

    it('matches only vectors from the same space and dimensionality', () => {
        const space = new VectorSpace();
        space.set('hash', hashEmbedding('same text'), 'hash');
        space.set('provider', [0, 1], 'provider');
        space.set('provider-2', [1, 0], 'provider');

        const hashHits = space.match(hashEmbedding('same text'), 'hash');
        expect(hashHits.map((h) => h.id)).toEqual(['hash']);

        const providerHits = space.match([1, 0], 'provider');
        expect(providerHits.map((h) => h.id)).toEqual(['provider-2', 'provider']);
        expect(providerHits[0]!.score).toBeCloseTo(1, 5);
    });

    it('ignores vectors with a different dimensionality in the same space', () => {
        const space = new VectorSpace();
        space.set('wide', [1, 0, 0], 'provider');
        expect(space.match([1, 0], 'provider')).toEqual([]);
    });

    it('returns the top-k matches when a finite limit is given (P1-17)', () => {
        const space = new VectorSpace();
        space.set('b', [0, 1], 'provider');
        space.set('a', [1, 0], 'provider');
        space.set('c', [0.5, 0.5], 'provider');
        const top1 = space.match([1, 0], 'provider', 1);
        expect(top1).toHaveLength(1);
        expect(top1[0]!.id).toBe('a');
        const top2 = space.match([1, 0], 'provider', 2);
        expect(top2.map((h) => h.id)).toEqual(['a', 'c']);
        // Без лимита — все совпадения, как раньше.
        expect(space.match([1, 0], 'provider')).toHaveLength(3);
    });

    it('prunes the oldest vectors first', () => {
        const space = new VectorSpace();
        space.set('a', [1], 'provider');
        space.set('b', [2], 'provider');
        space.set('c', [3], 'provider');
        space.prune(2);
        expect(space.size).toBe(2);
        expect(space.get('a')).toBeUndefined();
        expect(space.get('c')).toBeDefined();
    });

    it('detects the space of a persisted vector', () => {
        expect(VectorSpace.detectSpace(hashEmbedding('x'))).toBe('hash');
        expect(VectorSpace.detectSpace([0, 1, 2])).toBe('provider');
    });
});
