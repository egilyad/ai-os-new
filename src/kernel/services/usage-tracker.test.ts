import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UsageTracker } from './usage-tracker';
import type { UsageTrackerDeps } from './usage-tracker';

function makeDeps(overrides: Partial<UsageTrackerDeps> = {}): UsageTrackerDeps {
    return {
        database: {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
            ...overrides.database,
        },
    };
}

describe('UsageTracker', () => {
    let tracker: UsageTracker;
    let deps: UsageTrackerDeps;

    beforeEach(() => {
        vi.useFakeTimers();
        deps = makeDeps();
        tracker = new UsageTracker(deps);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('init', () => {
        it('should construct and init', async () => {
            await tracker.init();
            expect(deps.database.getKv).toHaveBeenCalledWith('super_agents_usage_records');
        });

        it('should be idempotent', async () => {
            await tracker.init();
            await tracker.init();
            expect(deps.database.getKv).toHaveBeenCalledTimes(1);
        });

        it('should load saved records from DB', async () => {
            const saved = [
                { provider: 'openai', model: 'gpt-4', tokens: 100, cost: 0.02, timestamp: 1000 },
            ];
            deps = makeDeps({
                database: { getKv: vi.fn().mockResolvedValue(saved), setKv: vi.fn() },
            });
            tracker = new UsageTracker(deps);
            await tracker.init();
            const stats = tracker.getUsageStats();
            expect(stats.totalTokens).toBe(100);
            expect(stats.totalCost).toBe(0.02);
        });

        it('should handle DB load failure gracefully', async () => {
            deps = makeDeps({
                database: {
                    getKv: vi.fn().mockRejectedValue(new Error('DB fail')),
                    setKv: vi.fn(),
                },
            });
            tracker = new UsageTracker(deps);
            await expect(tracker.init()).resolves.toBeUndefined();
        });
    });

    describe('trackUsage', () => {
        it('should add a record', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 0.02);
            const stats = tracker.getUsageStats();
            expect(stats.totalTokens).toBe(100);
            expect(stats.totalCost).toBe(0.02);
            expect(stats.byProvider.openai.tokens).toBe(100);
        });

        it('should schedule a flush on track', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 0.02);
            expect(deps.database.setKv).not.toHaveBeenCalled();
            vi.advanceTimersByTime(2000);
            await vi.runAllTimersAsync();
            expect(deps.database.setKv).toHaveBeenCalled();
        });
    });

    describe('getUsageStats', () => {
        it('should return zeros for empty tracker', async () => {
            await tracker.init();
            const stats = tracker.getUsageStats();
            expect(stats).toEqual({ totalTokens: 0, totalCost: 0, byProvider: {} });
        });

        it('should aggregate multiple providers', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 0.02);
            tracker.trackUsage('openai', 'gpt-3.5', 50, 0.005);
            tracker.trackUsage('anthropic', 'claude-3', 200, 0.03);
            const stats = tracker.getUsageStats();
            expect(stats.totalTokens).toBe(350);
            expect(stats.totalCost).toBeCloseTo(0.055);
            expect(stats.byProvider.openai.tokens).toBe(150);
            expect(stats.byProvider.openai.cost).toBeCloseTo(0.025);
            expect(stats.byProvider.anthropic.tokens).toBe(200);
            expect(stats.byProvider.anthropic.cost).toBe(0.03);
        });
    });

    describe('getProviderUsage', () => {
        it('should return zeros for unknown provider', async () => {
            await tracker.init();
            const usage = tracker.getProviderUsage('nonexistent');
            expect(usage).toEqual({ tokens: 0, cost: 0, requestCount: 0 });
        });

        it('should aggregate by provider', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 0.02);
            tracker.trackUsage('openai', 'gpt-4', 200, 0.04);
            tracker.trackUsage('anthropic', 'claude-3', 50, 0.01);
            const usage = tracker.getProviderUsage('openai');
            expect(usage.tokens).toBe(300);
            expect(usage.cost).toBeCloseTo(0.06);
            expect(usage.requestCount).toBe(2);
        });
    });

    describe('checkQuota', () => {
        it('should return ok when under budget', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 1);
            const result = tracker.checkQuota('openai');
            expect(result.ok).toBe(true);
        });

        it('should fail when cost exceeds monthly budget', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 999999, 60);
            const result = tracker.checkQuota('openai');
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.type).toBe('quota');
                expect(result.error.limitType).toBe('cost');
            }
        });

        it('should fail when requests exceed max', async () => {
            await tracker.init();
            for (let i = 0; i < 10001; i++) {
                tracker.trackUsage('openai', 'gpt-4', 1, 0.001);
            }
            const result = tracker.checkQuota('openai');
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.limitType).toBe('requests');
            }
        });

        it('should only count recent records (30 days)', async () => {
            await tracker.init();
            const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
            vi.setSystemTime(oldTimestamp);
            tracker.trackUsage('openai', 'gpt-4', 100, 60);
            vi.setSystemTime(oldTimestamp + 31 * 24 * 60 * 60 * 1000 + 1000);
            const result = tracker.checkQuota('openai');
            expect(result.ok).toBe(true);
        });
    });

    describe('getRecords', () => {
        it('should return recent records in reverse order', async () => {
            await tracker.init();
            tracker.trackUsage('p', 'm', 10, 0.01);
            tracker.trackUsage('p', 'm', 20, 0.02);
            const records = tracker.getRecords(10);
            expect(records).toHaveLength(2);
            expect(records[0].tokens).toBe(20);
            expect(records[1].tokens).toBe(10);
        });

        it('should respect limit', async () => {
            await tracker.init();
            for (let i = 0; i < 10; i++) {
                tracker.trackUsage('p', 'm', 1, 0.01);
            }
            expect(tracker.getRecords(3)).toHaveLength(3);
        });
    });

    describe('clear', () => {
        it('should clear all records', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 0.02);
            tracker.clear();
            const stats = tracker.getUsageStats();
            expect(stats.totalTokens).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should flush pending writes and clear timers', async () => {
            await tracker.init();
            tracker.trackUsage('openai', 'gpt-4', 100, 0.02);
            await tracker.destroy();
            expect(deps.database.setKv).toHaveBeenCalled();
        });

        it('should be safe to call destroy multiple times', async () => {
            await tracker.init();
            await tracker.destroy();
            await expect(tracker.destroy()).resolves.toBeUndefined();
        });
    });
});
