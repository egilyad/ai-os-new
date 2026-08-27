import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from './event-bus';

function makeBus(strictMode = false) {
    return new EventBus(strictMode);
}

function e(event: string) {
    return event as unknown as Parameters<EventBus['emit']>[0];
}

describe('EventBus', () => {
    let bus: EventBus;

    beforeEach(() => {
        bus = makeBus();
    });

    describe('on / emit', () => {
        it('should call handler when event is emitted', () => {
            const handler = vi.fn();
            bus.on(e('test:basic'), handler);
            bus.emit(e('test:basic'), { value: 1 });
            expect(handler).toHaveBeenCalledWith({ value: 1 });
        });

        it('should call multiple handlers for the same event', () => {
            const h1 = vi.fn();
            const h2 = vi.fn();
            bus.on(e('test:multi'), h1);
            bus.on(e('test:multi'), h2);
            bus.emit(e('test:multi'), { n: 42 });
            expect(h1).toHaveBeenCalledWith({ n: 42 });
            expect(h2).toHaveBeenCalledWith({ n: 42 });
        });

        it('should call handlers in registration order', () => {
            const order: number[] = [];
            bus.on(e('test:order'), () => order.push(1));
            bus.on(e('test:order'), () => order.push(2));
            bus.emit(e('test:order'), {});
            expect(order).toEqual([1, 2]);
        });

        it('should not call handler for a different event', () => {
            const handler = vi.fn();
            bus.on(e('test:a'), handler);
            bus.emit(e('test:b'), {});
            expect(handler).not.toHaveBeenCalled();
        });

        it('should emit to zero subscribers without throwing', () => {
            expect(() => bus.emit(e('test:orphan'), {})).not.toThrow();
        });
    });

    describe('off', () => {
        it('should not call handler after off', () => {
            const handler = vi.fn();
            bus.on(e('test:off'), handler);
            bus.off(e('test:off'), handler);
            bus.emit(e('test:off'), {});
            expect(handler).not.toHaveBeenCalled();
        });

        it('should not throw when removing a handler that was never added', () => {
            expect(() => bus.off(e('test:none'), vi.fn())).not.toThrow();
        });

        it('should not throw when off called twice', () => {
            const handler = vi.fn();
            bus.on(e('test:double-off'), handler);
            bus.off(e('test:double-off'), handler);
            expect(() => bus.off(e('test:double-off'), handler)).not.toThrow();
        });

        it('should remove only the specified handler', () => {
            const h1 = vi.fn();
            const h2 = vi.fn();
            bus.on(e('test:selective'), h1);
            bus.on(e('test:selective'), h2);
            bus.off(e('test:selective'), h1);
            bus.emit(e('test:selective'), {});
            expect(h1).not.toHaveBeenCalled();
            expect(h2).toHaveBeenCalled();
        });
    });

    describe('unsubscribe function', () => {
        it('should stop handler when returned function is called', () => {
            const handler = vi.fn();
            const unsub = bus.on(e('test:unsub'), handler);
            bus.emit(e('test:unsub'), { call: 1 });
            expect(handler).toHaveBeenCalledTimes(1);
            unsub();
            bus.emit(e('test:unsub'), { call: 2 });
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should not throw when unsub is called multiple times', () => {
            const handler = vi.fn();
            const unsub = bus.on(e('test:double-unsub'), handler);
            unsub();
            expect(() => unsub()).not.toThrow();
        });

        it('should not affect other handlers when one unsubscribes', () => {
            const h1 = vi.fn();
            const h2 = vi.fn();
            const unsub = bus.on(e('test:one-unsub'), h1);
            bus.on(e('test:one-unsub'), h2);
            unsub();
            bus.emit(e('test:one-unsub'), {});
            expect(h1).not.toHaveBeenCalled();
            expect(h2).toHaveBeenCalled();
        });
    });

    describe('onSafe', () => {
        it('should call handler with validated data when payload passes', () => {
            bus.registerValidator(e('test:safe-ok'), {
                safeParse: (data: unknown) => {
                    if (typeof data === 'number') return { success: true, data };
                    return { success: false, error: { issues: [{ message: 'not a number' }] } };
                },
            });
            const handler = vi.fn();
            bus.onSafe<number>(e('test:safe-ok'), handler);
            bus.emit(e('test:safe-ok'), 42);
            expect(handler).toHaveBeenCalledWith(42);
        });

        it('should drop invalid payloads when validator rejects', () => {
            bus.registerValidator(e('test:safe-drop'), {
                safeParse: (data: unknown) => {
                    if (typeof data === 'number') return { success: true, data };
                    return { success: false, error: { issues: [{ message: 'expected number' }] } };
                },
            });
            const handler = vi.fn();
            bus.onSafe<number>(e('test:safe-drop'), handler);
            bus.emit(e('test:safe-drop'), 'invalid');
            expect(handler).not.toHaveBeenCalled();
        });

        it('should pass through data when no validator is registered', () => {
            const handler = vi.fn();
            bus.onSafe<string>(e('test:safe-novalidator'), handler);
            bus.emit(e('test:safe-novalidator'), 'hello');
            expect(handler).toHaveBeenCalledWith('hello');
        });

        it('should return a working unsubscribe function', () => {
            bus.registerValidator(e('test:safe-unsub'), {
                safeParse: (data: unknown) => ({ success: true, data }),
            });
            const handler = vi.fn();
            const unsub = bus.onSafe<unknown>(e('test:safe-unsub'), handler);
            unsub();
            bus.emit(e('test:safe-unsub'), {});
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('clearAllSubscriptions / reset', () => {
        it('should clear all listeners on reset', () => {
            const handler = vi.fn();
            bus.on(e('test:reset'), handler);
            bus.clearAllSubscriptions();
            bus.emit(e('test:reset'), {});
            expect(handler).not.toHaveBeenCalled();
        });

        it('should clear all listeners on clearAllSubscriptions', () => {
            const handler = vi.fn();
            bus.on(e('test:clear'), handler);
            bus.clearAllSubscriptions();
            bus.emit(e('test:clear'), {});
            expect(handler).not.toHaveBeenCalled();
        });

        it('should clear all listeners across multiple events', () => {
            const h1 = vi.fn();
            const h2 = vi.fn();
            bus.on(e('test:clear-a'), h1);
            bus.on(e('test:clear-b'), h2);
            bus.clearAllSubscriptions();
            bus.emit(e('test:clear-a'), {});
            bus.emit(e('test:clear-b'), {});
            expect(h1).not.toHaveBeenCalled();
            expect(h2).not.toHaveBeenCalled();
        });

        it('should reset emit count to zero', () => {
            bus.emit(e('test:pre'), {});
            bus.emit(e('test:pre'), {});
            bus.clearAllSubscriptions();
            const stats = bus.getSubscriptionStats();
            expect(stats.totalCallbacks).toBe(0);
        });
    });

    describe('subscribeAll', () => {
        it('should receive every event emitted', () => {
            const handler = vi.fn();
            bus.subscribeAll(handler);
            bus.emit(e('test:all-1'), { a: 1 });
            bus.emit(e('test:all-2'), { b: 2 });
            expect(handler).toHaveBeenCalledTimes(2);
            expect(handler).toHaveBeenCalledWith({ event: 'test:all-1', data: { a: 1 } });
            expect(handler).toHaveBeenCalledWith({ event: 'test:all-2', data: { b: 2 } });
        });

        it('should not receive events after unsubscribe', () => {
            const handler = vi.fn();
            const unsub = bus.subscribeAll(handler);
            unsub();
            bus.emit(e('test:unsub-all'), {});
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('getSubscriptionStats', () => {
        it('should return backpressure handler initially', () => {
            const stats = bus.getSubscriptionStats();
            expect(stats.totalCallbacks).toBe(1);
            expect(stats.perEvent['system:eventbus:backpressure']).toBe(1);
        });

        it('should report correct counts after subscriptions', () => {
            bus.on(e('test:stats-a'), vi.fn());
            bus.on(e('test:stats-a'), vi.fn());
            bus.on(e('test:stats-b'), vi.fn());
            const stats = bus.getSubscriptionStats();
            expect(stats.totalCallbacks).toBe(4);
            expect(stats.perEvent[e('test:stats-a')]).toBe(2);
            expect(stats.perEvent[e('test:stats-b')]).toBe(1);
        });

        it('should report zero after clearAllSubscriptions', () => {
            bus.on(e('test:stats-clear'), vi.fn());
            bus.clearAllSubscriptions();
            const stats = bus.getSubscriptionStats();
            expect(stats.totalCallbacks).toBe(0);
        });
    });

    describe('error handling', () => {
        it('should not throw when a handler throws', () => {
            const throwing = vi.fn(() => {
                throw new Error('handler error');
            });
            const normal = vi.fn();
            bus.on(e('test:throws'), throwing);
            bus.on(e('test:throws'), normal);
            expect(() => bus.emit(e('test:throws'), {})).not.toThrow();
            expect(normal).toHaveBeenCalled();
        });

        it('should not throw when multiple handlers throw', () => {
            const h1 = vi.fn(() => {
                throw new Error('first');
            });
            const h2 = vi.fn(() => {
                throw new Error('second');
            });
            bus.on(e('test:multi-throw'), h1);
            bus.on(e('test:multi-throw'), h2);
            expect(() => bus.emit(e('test:multi-throw'), {})).not.toThrow();
        });
    });

    describe('clearAllSubscriptions', () => {
        it('should clear all subscriptions', () => {
            const handler = vi.fn();
            bus.on(e('test:clear'), handler);
            bus.clearAllSubscriptions();
            bus.emit(e('test:clear'), {});
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('registerValidator', () => {
        it('should cause emit to block invalid data in strict mode', () => {
            const strictBus = makeBus(true);
            strictBus.registerValidator(e('test:strict'), {
                safeParse: (data: unknown) => {
                    if (
                        data &&
                        typeof data === 'object' &&
                        'valid' in (data as Record<string, unknown>) &&
                        (data as Record<string, unknown>).valid === true
                    ) {
                        return { success: true, data };
                    }
                    return { success: false, error: { issues: [{ message: 'invalid' }] } };
                },
            });
            const handler = vi.fn();
            strictBus.on(e('test:strict'), handler);
            strictBus.emit(e('test:strict'), { valid: false });
            expect(handler).not.toHaveBeenCalled();
        });

        it('should allow valid data through in strict mode', () => {
            const strictBus = makeBus(true);
            strictBus.registerValidator(e('test:strict-ok'), {
                safeParse: (data: unknown) => ({ success: true, data }),
            });
            const handler = vi.fn();
            strictBus.on(e('test:strict-ok'), handler);
            strictBus.emit(e('test:strict-ok'), { ok: true });
            expect(handler).toHaveBeenCalledWith({ ok: true });
        });
    });

    describe('setLogger', () => {
        it('should accept a logger without throwing', () => {
            const logger = {
                debug: vi.fn(),
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
                child: vi.fn(() => logger),
                getBuffer: vi.fn(() => []),
                query: vi.fn(() => []),
                clear: vi.fn(),
                setTraceContext: vi.fn(),
                exportLogs: vi.fn(() => ''),
            };
            expect(() => bus.setLogger(logger)).not.toThrow();
        });
    });

    describe('setStrictMode', () => {
        it('should toggle strict mode at runtime', () => {
            const strictBus = makeBus(true);
            strictBus.registerValidator(e('test:toggle'), {
                safeParse: (data: unknown) => {
                    if (typeof data === 'number') return { success: true, data };
                    return { success: false, error: { issues: [{ message: 'not number' }] } };
                },
            });
            const handler = vi.fn();
            strictBus.on(e('test:toggle'), handler);
            strictBus.emit(e('test:toggle'), 'bad');
            expect(handler).not.toHaveBeenCalled();
            strictBus.setStrictMode(false);
            strictBus.emit(e('test:toggle'), 'bad');
            expect(handler).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle emit with undefined data', () => {
            const handler = vi.fn();
            bus.on(e('test:undefined'), handler);
            bus.emit(e('test:undefined'), undefined);
            expect(handler).toHaveBeenCalledWith(undefined);
        });

        it('should handle emit with null data', () => {
            const handler = vi.fn();
            bus.on(e('test:null'), handler);
            bus.emit(e('test:null'), null);
            expect(handler).toHaveBeenCalledWith(null);
        });

        it('should handle emit with no data argument', () => {
            const handler = vi.fn();
            bus.on(e('test:nodata'), handler);
            bus.emit(e('test:nodata'), undefined);
            expect(handler).toHaveBeenCalledWith(undefined);
        });

        it('should not leak handlers after unsubscribe', () => {
            const handler = vi.fn();
            const unsub = bus.on(e('test:leak'), handler);
            unsub();
            const stats = bus.getSubscriptionStats();
            expect(stats.totalCallbacks).toBe(1);
        });
    });
});
