import { describe, it, expect } from 'vitest';
import { MnesticService } from './mnestic-service';

const now = 1_700_000_000_000;
const entries = [
    { id: 'fresh', text: 'fresh important', importance: 0.9, createdAt: now, relevance: 1 },
    {
        id: 'old',
        text: 'old important',
        importance: 0.9,
        createdAt: now - 72 * 3600_000,
        relevance: 1,
    },
    { id: 'low', text: 'fresh trivial', importance: 0.1, createdAt: now, relevance: 0.5 },
];

describe('MnesticService', () => {
    it('ranks by recency × importance × relevance', () => {
        const ranked = new MnesticService().rank(entries, now);
        expect(ranked[0]!.entry.id).toBe('fresh');
        expect(ranked[2]!.entry.id).toBe('low');
        expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
    });

    it('triggers reflection above salience threshold', () => {
        const svc = new MnesticService();
        const ranked = svc.rank(entries, now);
        const r = svc.maybeReflect(ranked, 0.5);
        expect(r.triggered).toBe(true);
        expect(r.themes.length).toBeGreaterThan(0);
        expect(r.themes[0]).toContain('fresh important');
    });

    it('does not reflect below threshold', () => {
        const svc = new MnesticService();
        const r = svc.maybeReflect(svc.rank(entries, now), 100);
        expect(r.triggered).toBe(false);
        expect(r.themes).toEqual([]);
    });
});
