import { describe, expect, it } from 'vitest';
import { SeededRng } from './seedable-rng';

describe('SeededRng', () => {
    it('is deterministic for the same seed', () => {
        const a = new SeededRng(42);
        const b = new SeededRng(42);
        expect(a.next()).toBe(b.next());
        expect(a.next()).toBe(b.next());
    });

    it('next returns values in [0, 1)', () => {
        const rng = new SeededRng(1);
        for (let i = 0; i < 100; i++) {
            const v = rng.next();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('nextInt returns values in the inclusive range', () => {
        const rng = new SeededRng(7);
        for (let i = 0; i < 50; i++) {
            const v = rng.nextInt(5, 10);
            expect(v).toBeGreaterThanOrEqual(5);
            expect(v).toBeLessThanOrEqual(10);
        }
    });

    it('pick selects from the array', () => {
        const rng = new SeededRng(9);
        const arr = ['a', 'b', 'c'];
        for (let i = 0; i < 30; i++) {
            expect(arr).toContain(rng.pick(arr));
        }
    });

    it('fork produces a different, valid RNG', () => {
        const rng = new SeededRng(5);
        const fork = rng.fork();
        const v = fork.next();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
    });
});
