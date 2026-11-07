import { describe, it, expect } from 'vitest';
import { stableHash, hashHue, hashRange } from './hash';

describe('hash utils', () => {
    it('stableHash is deterministic and normalized to [0, 1)', () => {
        expect(stableHash('abc')).toBe(stableHash('abc'));
        const h = stableHash('anything');
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThan(1);
    });

    it('hashHue maps to 0..359', () => {
        expect(hashHue('node-a')).toBeGreaterThanOrEqual(0);
        expect(hashHue('node-a')).toBeLessThan(360);
    });

    it('hashRange stays within [min, max)', () => {
        const v = hashRange('seed', 10, 20);
        expect(v).toBeGreaterThanOrEqual(10);
        expect(v).toBeLessThan(20);
    });
});
