import { describe, it, expect, vi } from 'vitest';
import { DebateBudget } from './debate-budget';
import type { DebateBudgetLimits } from '../../contracts/debate-runtime';

describe('DebateBudget', () => {
    const SESSION_ID = 'test-session-1';
    const SMALL_LIMITS: Partial<DebateBudgetLimits> = {
        maxTokensPerDebate: 1000,
        maxCostPerDebate: 1.0,
        maxRounds: 3,
        maxDurationMs: 60_000,
    };

    it('allows reservation within limits', async () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        const result = await budget.reserveAndRecord(SESSION_ID, 100, 0.1);
        expect(result).toBe(true);
    });

    it('rejects when token limit exceeded', async () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        await budget.reserveAndRecord(SESSION_ID, 900, 0.1);
        const result = await budget.reserveAndRecord(SESSION_ID, 200, 0.1);
        expect(result).toBe(false);
    });

    it('rejects when cost limit exceeded', async () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        await budget.reserveAndRecord(SESSION_ID, 100, 0.9);
        const result = await budget.reserveAndRecord(SESSION_ID, 100, 0.2);
        expect(result).toBe(false);
    });

    it('incrementRound stops at maxRounds', () => {
        const budget = new DebateBudget(SESSION_ID, { ...SMALL_LIMITS, maxRounds: 2 });
        budget.incrementRound(SESSION_ID);
        budget.incrementRound(SESSION_ID);
        budget.incrementRound(SESSION_ID);
        const snap = budget.snapshot();
        expect(snap.roundsUsed).toBe(2);
    });

    it('rejects when sessionId does not match', async () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        const result = await budget.reserveAndRecord('wrong-session', 100, 0.1);
        expect(result).toBe(false);
    });

    it('incrementRound increases round count', () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        budget.incrementRound(SESSION_ID);
        const snap = budget.snapshot();
        expect(snap.roundsUsed).toBe(1);
    });

    it('incrementRound does not exceed maxRounds', () => {
        const budget = new DebateBudget(SESSION_ID, { ...SMALL_LIMITS, maxRounds: 1 });
        budget.incrementRound(SESSION_ID);
        budget.incrementRound(SESSION_ID);
        const snap = budget.snapshot();
        expect(snap.roundsUsed).toBe(1);
    });

    it('incrementRound ignores mismatched sessionId', () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        budget.incrementRound('wrong-session');
        const snap = budget.snapshot();
        expect(snap.roundsUsed).toBe(0);
    });

    it('getPressure returns low when usage is minimal', () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        expect(budget.getPressure()).toBe('low');
    });

    it('getPressure returns critical near limits', async () => {
        const tight: Partial<DebateBudgetLimits> = {
            maxTokensPerDebate: 100,
            maxCostPerDebate: 1.0,
            maxRounds: 20,
            maxDurationMs: 3_600_000,
        };
        const budget = new DebateBudget(SESSION_ID, tight);
        await budget.reserveAndRecord(SESSION_ID, 96, 0.01);
        expect(budget.getPressure()).toBe('critical');
    });

    it('getPressureAction returns matching level', () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        const action = budget.getPressureAction();
        expect(action.level).toBe('low');
        expect(action.reduceRounds).toBe(0);
        expect(action.downgradeModels).toBe(false);
    });

    it('getPressureAction returns high pressure actions', async () => {
        const tight: Partial<DebateBudgetLimits> = {
            maxTokensPerDebate: 100,
            maxCostPerDebate: 1.0,
            maxRounds: 20,
            maxDurationMs: 3_600_000,
        };
        const budget = new DebateBudget(SESSION_ID, tight);
        await budget.reserveAndRecord(SESSION_ID, 85, 0.01);
        expect(budget.getPressureAction().level).toBe('high');
        expect(budget.getPressureAction().reduceRounds).toBe(2);
        expect(budget.getPressureAction().downgradeModels).toBe(true);
    });

    it('snapshot returns current usage', async () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        await budget.reserveAndRecord(SESSION_ID, 200, 0.2);
        const snap = budget.snapshot();
        expect(snap.sessionId).toBe(SESSION_ID);
        expect(snap.tokensUsed).toBe(200);
        expect(snap.costUsed).toBe(0.2);
        expect(snap.estimatedRemainingTokens).toBe(800);
        expect(snap.estimatedRemainingCost).toBe(0.8);
    });

    it('destroy clears lock queue', () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        budget.destroy();
        expect(budget.getPressure()).toBe('low');
    });

    it('supports concurrent reservations via lock queue', async () => {
        const budget = new DebateBudget(SESSION_ID, SMALL_LIMITS);
        const results = await Promise.all([
            budget.reserveAndRecord(SESSION_ID, 300, 0.3),
            budget.reserveAndRecord(SESSION_ID, 300, 0.3),
            budget.reserveAndRecord(SESSION_ID, 300, 0.3),
        ]);
        expect(results.filter(Boolean)).toHaveLength(3);
        const snap = budget.snapshot();
        expect(snap.tokensUsed).toBe(900);
    });

    it('emits budget exceeded event on rejection', async () => {
        const emit = vi.fn();
        const eventBus = { emit };
        const budget = new DebateBudget(SESSION_ID, { maxTokensPerDebate: 100 }, eventBus);
        await budget.reserveAndRecord(SESSION_ID, 200, 0.1);
        expect(emit).toHaveBeenCalledWith(
            expect.stringContaining('budget'),
            expect.objectContaining({ reason: 'tokens' }),
        );
    });

    it('uses default limits when not provided', () => {
        const budget = new DebateBudget(SESSION_ID);
        const snap = budget.snapshot();
        expect(snap.estimatedRemainingTokens).toBe(500_000);
        expect(snap.estimatedRemainingCost).toBe(10.0);
    });
});
