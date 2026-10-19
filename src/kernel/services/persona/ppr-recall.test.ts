/**
 * Personalized PageRank tests (HippoRAG-style associative recall core).
 */
import { describe, it, expect } from 'vitest';
import { personalizedPageRank } from './ppr-recall';

describe('personalizedPageRank', () => {
    it('ranks nearer nodes higher on a chain', () => {
        const scores = personalizedPageRank(['a'], [
            { fromId: 'a', toId: 'b' },
            { fromId: 'b', toId: 'c' },
            { fromId: 'c', toId: 'd' },
        ]);
        expect(scores.get('b')!).toBeGreaterThan(scores.get('c')!);
        expect(scores.get('c')!).toBeGreaterThan(scores.get('d')!);
    });

    it('distributes a probability mass of ~1', () => {
        const scores = personalizedPageRank(['a'], [
            { fromId: 'a', toId: 'b' },
            { fromId: 'b', toId: 'c' },
            { fromId: 'a', toId: 'd' },
        ]);
        const sum = [...scores.values()].reduce((acc, v) => acc + v, 0);
        expect(sum).toBeCloseTo(1, 5);
    });

    it('returns an empty map without seeds', () => {
        expect(personalizedPageRank([], [{ fromId: 'a', toId: 'b' }]).size).toBe(0);
    });

    it('keeps mass on an isolated seed', () => {
        const scores = personalizedPageRank(['z'], [{ fromId: 'a', toId: 'b' }]);
        expect(scores.get('z')).toBeCloseTo(1, 6);
        expect(scores.get('a')).toBe(0);
    });
});
