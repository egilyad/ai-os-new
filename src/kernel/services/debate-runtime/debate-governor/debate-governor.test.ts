import { describe, it, expect } from 'vitest';
import { DebateGovernor } from './debate-governor';

function feedRepetitive(g: DebateGovernor, rounds: number[]): void {
    for (const r of rounds) {
        g.ingestArgument('identical repetitive claim text here', `a${r}`, 's1', 'pro', r);
        g.computeNovelty();
    }
}

describe('DebateGovernor soft-stop floor (long debates)', () => {
    it('holds soft stops until the second half of requested maxRounds', () => {
        const g = new DebateGovernor();
        g.setMaxRounds(10);
        feedRepetitive(g, [1, 2, 3]);
        // The soft condition itself fires (stale repetition)...
        expect(g.hasNoNovelClaims()).toBe(true);
        // ...but the floor (max(2, 10/2) = 5) keeps a requested long debate alive.
        expect(g.shouldStop()).toBe(false);
    });

    it('keeps the old floor of 2 when maxRounds is unset (default debates)', () => {
        const g = new DebateGovernor();
        feedRepetitive(g, [1, 2, 3]);
        expect(g.shouldStop()).toBe(true);
    });

    it('still hard-stops at maxRounds', () => {
        const g = new DebateGovernor();
        g.setMaxRounds(3);
        feedRepetitive(g, [1, 2, 3]);
        expect(g.shouldStop()).toBe(true);
    });
});
