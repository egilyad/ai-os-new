import { describe, it, expect, vi } from 'vitest';
import { SystemKernel } from './kernel';

function makeDeps() {
    const eventBus = {
        emit: vi.fn(),
        emitOnce: vi.fn(),
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
    };
    const database = {
        getKv: vi.fn(async () => null),
        setKv: vi.fn(async () => {}),
    };
    const providerTracker = {
        start: vi.fn(),
        getHealthEvents: vi.fn(() => []),
        getMetrics: vi.fn(() => ({
            errors: 0,
            totalRequests: 0,
            totalTokens: 0,
            avgLatency: 0,
        })),
    };
    return { eventBus, database, providerTracker };
}

describe('SystemKernel', () => {
    it('constructs with initial state', () => {
        const { eventBus, database, providerTracker } = makeDeps();
        const kernel = new SystemKernel({
            eventBus: eventBus as never,
            database: database as never,
            providerTracker: providerTracker as never,
        });
        const state = kernel.getState();
        expect(state).toBeDefined();
        expect(Object.keys(state).length).toBeGreaterThan(0);
    });

    it('getHealthEvents delegates to the provider tracker', () => {
        const { eventBus, database, providerTracker } = makeDeps();
        const kernel = new SystemKernel({
            eventBus: eventBus as never,
            database: database as never,
            providerTracker: providerTracker as never,
        });
        expect(kernel.getHealthEvents('openrouter')).toEqual([]);
        expect(providerTracker.getHealthEvents).toHaveBeenCalledWith('openrouter', undefined);
    });

    it('transaction resolves and flushes deferred emits through the event bus', async () => {
        const { eventBus, database, providerTracker } = makeDeps();
        const kernel = new SystemKernel({
            eventBus: eventBus as never,
            database: database as never,
            providerTracker: providerTracker as never,
        });
        await expect(
            kernel.transaction(async (tx) => {
                tx.deferEmit('test:event', { ok: true });
                return 42;
            }),
        ).resolves.toBe(42);
        expect(eventBus.emit).toHaveBeenCalledWith('test:event', { ok: true });
    });
});
