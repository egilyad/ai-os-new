import { describe, it, expect } from 'vitest';
import { percentile } from './percentile';

describe('percentile (W6-034)', () => {
    it('returns 0 for empty input', () => {
        expect(percentile([], 0.5)).toBe(0);
    });

    it('median of 2 samples is the midpoint (not the max)', () => {
        expect(percentile([100, 200], 0.5)).toBe(150);
    });

    it('p90 of [100,200,300] interpolates to 280', () => {
        expect(percentile([100, 200, 300], 0.9)).toBe(280);
    });

    it('p0 and p100 hit the exact min/max', () => {
        const sorted = [10, 20, 30, 40];
        expect(percentile(sorted, 0)).toBe(10);
        expect(percentile(sorted, 1)).toBe(40);
    });

    it('clamps p outside [0,1]', () => {
        const sorted = [5, 15];
        expect(percentile(sorted, -1)).toBe(5);
        expect(percentile(sorted, 2)).toBe(15);
    });
});
