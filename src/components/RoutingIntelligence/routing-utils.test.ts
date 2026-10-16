import { describe, it, expect } from 'vitest';
import { providerColor, scoreBreakdown, getExplanation } from './routing-utils';

describe('routing-utils honesty guards', () => {
    it('providerColor falls back instead of crashing on undefined', () => {
        expect(providerColor(undefined as never)).toBe('#94a3b8');
        expect(providerColor('groq')).toBe('#10b981');
        expect(providerColor('nope')).toBe('#94a3b8');
    });

    it('scoreBreakdown defaults missing components to zeros', () => {
        expect(scoreBreakdown(undefined)).toEqual({ ttft: 1, tps: 0, reliability: 0, cost: 0 });
        expect(scoreBreakdown({} as never)).toEqual({
            ttft: 1,
            tps: 0,
            reliability: 0,
            cost: 0,
        });
    });

    it('getExplanation tolerates decisions without scores or weights', () => {
        expect(getExplanation({} as never)).toEqual([]);
        const lines = getExplanation({
            strategy: 'auto',
            scores: [{ provider: 'groq', score: 0.9 }],
        } as never);
        expect(lines.some((l) => l.includes('unknown length'))).toBe(true);
        expect(lines.some((l) => l.includes('Weights:'))).toBe(true);
    });
});
