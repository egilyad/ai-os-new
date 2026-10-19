/**
 * Ebbinghaus retention + decay-aware recall ranking.
 */
import { describe, it, expect } from 'vitest';
import { computeRetention, computeHalfLife } from '../../contracts/memory-store';
import { recallRank } from './memory-search-utils';
import type { MemoryEntry } from '../../types/memory-types';

const DAY = 24 * 3_600_000;

function entry(
    id: string,
    content: string,
    opts: { importance?: number; timestamp?: number; lastAccessed?: number } = {},
): MemoryEntry {
    return {
        id,
        content,
        metadata: {
            source: 'user',
            type: 'episodic',
            timestamp: opts.timestamp ?? Date.now(),
            importance: opts.importance ?? 0.5,
            ...(opts.lastAccessed !== undefined ? { lastAccessed: opts.lastAccessed } : {}),
        },
    };
}

describe('computeRetention (Ebbinghaus)', () => {
    it('is 1 at zero age and ~0.5 at one half-life', () => {
        expect(computeRetention(1, 0)).toBe(1);
        expect(computeRetention(1, computeHalfLife(1))).toBeCloseTo(0.5, 5);
    });

    it('decays with age and is slower for more important memories', () => {
        expect(computeRetention(0.5, 100)).toBeLessThan(computeRetention(0.5, 10));
        expect(computeRetention(0.9, 100)).toBeGreaterThan(computeRetention(0.2, 100));
    });
});

describe('recallRank with decay', () => {
    it('prefers recently accessed memories among equal keyword matches', () => {
        const now = Date.now();
        const old = entry('old', 'alpha beta gamma delta', {
            importance: 0.5,
            lastAccessed: now - 400 * DAY,
        });
        const fresh = entry('fresh', 'alpha beta gamma delta', {
            importance: 0.5,
            lastAccessed: now,
        });
        const ranked = recallRank([old, fresh], 'alpha beta gamma delta', 5, now);
        expect(ranked.map((r) => r.id)).toEqual(['fresh', 'old']);
    });

    it('never drops an old match entirely (decay floor)', () => {
        const now = Date.now();
        const old = entry('old', 'alpha beta gamma delta', {
            importance: 0.05,
            lastAccessed: now - 1000 * DAY,
        });
        const ranked = recallRank([old], 'alpha beta gamma delta', 5, now);
        expect(ranked).toHaveLength(1);
        expect(ranked[0]!.score).toBeGreaterThan(0);
    });
});
