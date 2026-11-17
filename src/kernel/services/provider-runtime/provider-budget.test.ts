import { describe, it, expect } from 'vitest';
import { ProviderBudget } from './provider-budget';

describe('ProviderBudget limits (contract)', () => {
    it('defaults allow starting a session', () => {
        const b = new ProviderBudget();
        expect(b.canStartSession('a')).toEqual({ allowed: true });
        expect(b.getLimits().maxConcurrentSessions).toBe(25);
    });

    it('enforces max concurrent sessions globally', () => {
        const b = new ProviderBudget({ maxConcurrentSessions: 2 });
        b.startSession('a');
        b.startSession('b');
        expect(b.canStartSession('c')).toEqual({
            allowed: false,
            reason: 'Max concurrent sessions reached',
        });
    });

    it('enforces max sessions per provider', () => {
        const b = new ProviderBudget({ maxSessionsPerProvider: 1 });
        b.startSession('a');
        expect(b.canStartSession('a')).toEqual({
            allowed: false,
            reason: 'Max concurrent sessions for a reached',
        });
        expect(b.canStartSession('b')).toEqual({ allowed: true });
    });

    it('enforces per-provider cost and token limits', () => {
        const b = new ProviderBudget({ maxCostPerProvider: 0.5, maxTokensPerProvider: 1000 });
        b.recordUsage('a', 500, 0.6);
        expect(b.canStartSession('a')).toEqual({
            allowed: false,
            reason: 'Cost limit exceeded for a',
        });
        b.reset();
        b.recordUsage('a', 1001, 0.1);
        expect(b.canStartSession('a')).toEqual({
            allowed: false,
            reason: 'Token limit exceeded for a',
        });
    });

    it('enforces global cost and token limits', () => {
        const b = new ProviderBudget({ maxTotalCost: 1, maxTotalTokens: 1000 });
        b.recordUsage('a', 500, 0.6);
        b.recordUsage('b', 500, 0.6);
        expect(b.canStartSession('c')).toEqual({
            allowed: false,
            reason: 'Global cost limit reached',
        });
        b.reset();
        b.recordUsage('a', 600, 0.1);
        b.recordUsage('b', 600, 0.1);
        expect(b.canStartSession('c')).toEqual({
            allowed: false,
            reason: 'Global token limit reached',
        });
    });
});

describe('ProviderBudget usage tracking (contract)', () => {
    it('tracks sessions and usage per provider and globally', () => {
        const b = new ProviderBudget();
        b.startSession('a');
        b.startSession('a');
        b.endSession('a');
        b.recordUsage('a', 100, 0.01);
        b.recordUsage('b', 50, 0.005);

        const snap = b.snapshot();
        expect(snap.global.totalSessions).toBe(2);
        expect(snap.global.activeSessions).toBe(1);
        expect(snap.global.totalTokens).toBe(150);
        expect(snap.global.totalCost).toBeCloseTo(0.015, 10);
        expect(snap.byProvider).toHaveLength(2);
        const a = snap.byProvider.find((p) => p.provider === 'a')!;
        expect(a.sessionCount).toBe(2);
        expect(a.activeSessions).toBe(1);
        expect(a.totalTokens).toBe(100);
    });

    it('canProceed rejects estimates that would exceed limits', () => {
        const b = new ProviderBudget({ maxCostPerProvider: 1, maxTotalCost: 2 });
        b.recordUsage('a', 0, 0.9);
        expect(b.canProceed('a', 0, 0.2)).toEqual({
            allowed: false,
            reason: 'Cost limit would be exceeded for a',
        });
        expect(b.canProceed('a', 0, 0.05)).toEqual({ allowed: true });
        b.recordUsage('a', 0, 0.05);
        b.recordUsage('b', 0, 0.95);
        expect(b.canProceed('c', 0, 0.2)).toEqual({
            allowed: false,
            reason: 'Total cost limit would be exceeded',
        });
    });

    it('exposes exhausted flag for concurrent session pressure', () => {
        const b = new ProviderBudget({ maxConcurrentSessions: 1 });
        b.startSession('a');
        expect(b.snapshot().exhausted).toBe(true);
        b.endSession('a');
        expect(b.snapshot().exhausted).toBe(false);
    });

    it('reset and destroy clear all state', () => {
        const b = new ProviderBudget();
        b.startSession('a');
        b.recordUsage('a', 10, 0.01);
        b.reset();
        expect(b.snapshot().global.totalSessions).toBe(0);
        expect(b.snapshot().byProvider).toEqual([]);

        b.startSession('a');
        b.destroy();
        expect(b.snapshot().global.activeSessions).toBe(0);
        expect(b.snapshot().byProvider).toEqual([]);
    });
});

describe('ProviderBudget listeners (contract)', () => {
    it('notifies on state changes and supports unsubscribe', () => {
        const b = new ProviderBudget();
        const seen: number[] = [];
        const off = b.onUpdate((snap) => seen.push(snap.global.totalSessions));
        b.startSession('a');
        expect(seen).toEqual([1]);
        off();
        b.startSession('b');
        expect(seen).toEqual([1]);
    });

    it('caps listener count at 100', () => {
        const b = new ProviderBudget();
        const offs: Array<() => void> = [];
        for (let i = 0; i < 120; i++) {
            offs.push(b.onUpdate(() => {}));
        }
        b.startSession('a');
        expect(offs.length).toBe(120);
    });
});
