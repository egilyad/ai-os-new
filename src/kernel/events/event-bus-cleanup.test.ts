import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './event-bus';

function makeBus(strictMode = false) {
    return new EventBus(strictMode);
}

function e(event: string) {
    return event as unknown as Parameters<EventBus['emit']>[0];
}

describe('EventBus listener lifecycle (P2-13 audit)', () => {
    it('stats track subscriptions per event and drop them on unsubscribe', () => {
        const bus = makeBus();
        const baseline = bus.getSubscriptionStats().totalCallbacks;
        const h1 = vi.fn();
        const h2 = vi.fn();

        const unsub1 = bus.on(e('audit:stats'), h1);
        bus.on(e('audit:stats'), h2);
        bus.on(e('audit:other'), h2);

        const before = bus.getSubscriptionStats();
        expect(before.perEvent['audit:stats']).toBe(2);
        expect(before.perEvent['audit:other']).toBe(1);

        unsub1();
        const after = bus.getSubscriptionStats();
        expect(after.perEvent['audit:stats']).toBe(1);
        expect(after.totalCallbacks).toBe(baseline + 2);

        bus.emit(e('audit:stats'), {});
        expect(h1).not.toHaveBeenCalled();
        expect(h2).toHaveBeenCalledTimes(1);
    });

    it('clearAllSubscriptions empties listeners and later emits are inert', () => {
        const bus = makeBus();
        const h = vi.fn();
        bus.on(e('audit:clear'), h);
        bus.subscribeAll(() => {});
        expect(bus.getSubscriptionStats().totalCallbacks).toBeGreaterThan(0);

        bus.clearAllSubscriptions();
        expect(bus.getSubscriptionStats().totalCallbacks).toBe(0);
        expect(Object.keys(bus.getSubscriptionStats().perEvent)).toHaveLength(0);

        bus.emit(e('audit:clear'), {});
        expect(h).not.toHaveBeenCalled();
    });

    it('service-style lifecycle leaves zero residual subscriptions', () => {
        const bus = makeBus();
        const baseline = bus.getSubscriptionStats().totalCallbacks;
        const unsubs: Array<() => void> = [];
        const handlers = Array.from({ length: 10 }, () => vi.fn());

        for (const h of handlers) {
            unsubs.push(bus.on(e('audit:lifecycle'), h));
        }
        expect(bus.getSubscriptionStats().perEvent['audit:lifecycle']).toBe(10);

        for (const u of unsubs) u();
        const stats = bus.getSubscriptionStats();
        expect(stats.totalCallbacks).toBe(baseline);
        expect(stats.perEvent['audit:lifecycle'] ?? 0).toBe(0);

        bus.emit(e('audit:lifecycle'), {});
        for (const h of handlers) expect(h).not.toHaveBeenCalled();
    });

    it('double-unsubscribe is a no-op and does not remove other handlers', () => {
        const bus = makeBus();
        const h1 = vi.fn();
        const h2 = vi.fn();

        const unsub = bus.on(e('audit:double'), h1);
        bus.on(e('audit:double'), h2);

        unsub();
        unsub();

        bus.emit(e('audit:double'), {});
        expect(h1).not.toHaveBeenCalled();
        expect(h2).toHaveBeenCalledTimes(1);
    });
});
