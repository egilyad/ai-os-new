import { describe, expect, it } from 'vitest';
import { shouldStopByConvergence } from './debate-stop-conditions';
import type { DebateSession } from '../../contracts/debate-types';

function makeSession(score: number): DebateSession {
    return {
        id: 's1',
        topic: 't',
        status: 'active',
        strategy: 'round_robin',
        maxRounds: 5,
        currentRound: 2,
        participants: [],
        arguments: [],
        convergenceScore: score,
        createdAt: Date.now(),
    } as DebateSession;
}

describe('shouldStopByConvergence', () => {
    it('останавливает при непревышении порога', () => {
        expect(shouldStopByConvergence(makeSession(85), 0.8)).toBe(true);
        expect(shouldStopByConvergence(makeSession(100), 1)).toBe(true);
    });

    it('не останавливает при score ниже порога', () => {
        expect(shouldStopByConvergence(makeSession(70), 0.8)).toBe(false);
    });

    it('без порога не останавливает', () => {
        expect(shouldStopByConvergence(makeSession(99), undefined)).toBe(false);
    });

    it('клампит порог в 0–1', () => {
        expect(shouldStopByConvergence(makeSession(50), 1.5)).toBe(false);
        expect(shouldStopByConvergence(makeSession(0), -0.2)).toBe(true);
    });
});
