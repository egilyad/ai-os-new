import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Container, type IContainer } from './container';

function makeContainer() {
    return new Container();
}

interface MockService {
    name: string;
    destroy?: () => void | Promise<void>;
}

function makeService(overrides?: Partial<MockService>): MockService {
    return { name: 'test', ...overrides };
}

describe('Container', () => {
    let container: Container;

    beforeEach(() => {
        container = makeContainer();
    });

    describe('register', () => {
        it('stores and returns a singleton instance', () => {
            const svc = makeService({ name: 'alpha' });
            container.register('svc', svc);
            expect(container.get('svc')).toBe(svc);
        });

        it('same instance on repeated get()', () => {
            container.register('svc', makeService());
            expect(container.get('svc')).toBe(container.get('svc'));
        });

        it('overwrites previous registration silently', () => {
            container.register('svc', makeService({ name: 'first' }));
            container.register('svc', makeService({ name: 'second' }));
            expect(container.get<MockService>('svc').name).toBe('second');
        });

        it('throws on get() of unregistered id', () => {
            expect(() => container.get('nonexistent')).toThrow('Service not found');
        });
    });

    describe('registerFactory', () => {
        it('calls factory lazily on first get()', () => {
            const factory = vi.fn(() => makeService({ name: 'from-factory' }));
            container.registerFactory('svc', factory);
            expect(factory).not.toHaveBeenCalled();
            const instance = container.get('svc');
            expect(factory).toHaveBeenCalledTimes(1);
            expect(instance).toEqual({ name: 'from-factory' });
        });

        it('returns the same singleton on subsequent get()', () => {
            const factory = vi.fn(() => makeService());
            container.registerFactory('svc', factory);
            const a = container.get('svc');
            const b = container.get('svc');
            expect(factory).toHaveBeenCalledTimes(1);
            expect(a).toBe(b);
        });

        it('passes the container to the factory', () => {
            const factory = vi.fn((c: IContainer) => {
                c.register('dep', makeService({ name: 'dep' }));
                return makeService({ name: 'parent' });
            });
            container.registerFactory('svc', factory);
            container.get('svc');
            expect(container.has('dep')).toBe(true);
        });
    });

    describe('registerTransient', () => {
        it('creates a new instance on every get()', () => {
            const factory = vi.fn(() => makeService());
            container.registerTransient('svc', factory);
            const a = container.get('svc');
            const b = container.get('svc');
            expect(factory).toHaveBeenCalledTimes(2);
            expect(a).not.toBe(b);
        });

        it('works alongside register and registerFactory', () => {
            container.register('perm', makeService({ name: 'perm' }));
            container.registerTransient('temp', () => makeService({ name: 'temp' }));
            expect(container.get<MockService>('perm').name).toBe('perm');
            expect(container.get<MockService>('temp').name).toBe('temp');
        });
    });

    describe('override', () => {
        it('replaces factory for registered singleton factories', () => {
            const orig = vi.fn(() => makeService({ name: 'original' }));
            container.registerFactory('svc', orig);
            container.get('svc');
            expect(orig).toHaveBeenCalledTimes(1);

            const replacement = vi.fn(() => makeService({ name: 'replaced' }));
            container.override('svc', replacement);
            const instance = container.get('svc');
            expect(instance).toEqual({ name: 'replaced' });
        });

        it('throws if id is not a factory', () => {
            container.register('svc', makeService());
            expect(() => container.override('svc', () => makeService())).toThrow(
                /not registered as a factory/,
            );
        });

        it('throws if id does not exist', () => {
            expect(() => container.override('nonexistent', () => ({}))).toThrow(
                /not registered as a factory/,
            );
        });

        it('works for transient factories', () => {
            container.registerTransient('svc', () => makeService({ name: 'original' }));
            container.override('svc', () => makeService({ name: 'overridden' }));
            expect(container.get<MockService>('svc').name).toBe('overridden');
        });

        it('clears failure cache so factory can retry', () => {
            let fail = true;
            container.registerFactory('svc', () => {
                if (fail) throw new Error('first attempt failed');
                return makeService({ name: 'retry' });
            });
            expect(() => container.get('svc')).toThrow('first attempt failed');
            fail = false;
            container.override('svc', () => makeService({ name: 'retry' }));
            expect(container.get<MockService>('svc').name).toBe('retry');
        });
    });

    describe('getOptional', () => {
        it('returns undefined when id does not exist', () => {
            expect(container.getOptional('nonexistent')).toBeUndefined();
        });

        it('returns instance when id exists', () => {
            container.register('svc', makeService());
            expect(container.getOptional('svc')).toBeDefined();
        });
    });

    describe('has', () => {
        it('returns false for unregistered id', () => {
            expect(container.has('nonexistent')).toBe(false);
        });

        it('returns true for registered instances', () => {
            container.register('svc', makeService());
            expect(container.has('svc')).toBe(true);
        });

        it('returns true for factory-registered ids before get()', () => {
            container.registerFactory('svc', () => makeService());
            expect(container.has('svc')).toBe(true);
        });

        it('returns true for transient ids', () => {
            container.registerTransient('svc', () => makeService());
            expect(container.has('svc')).toBe(true);
        });
    });

    describe('circular dependency detection', () => {
        it('throws when factory A tries to get A', () => {
            container.registerFactory('a', (c) => {
                c.get('a');
                return makeService();
            });
            expect(() => container.get('a')).toThrow('Circular dependency');
        });

        it('throws on A->B->A cycle', () => {
            container.registerFactory('a', (c) => {
                c.get('b');
                return makeService({ name: 'a' });
            });
            container.registerFactory('b', (c) => {
                c.get('a');
                return makeService({ name: 'b' });
            });
            expect(() => container.get('a')).toThrow('Circular dependency');
        });
    });

    describe('factory failure cache', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it('caches factory failure for 60s and re-throws', () => {
            const factory = vi.fn(() => {
                throw new Error('factory error');
            });
            container.registerFactory('svc', factory);
            expect(() => container.get('svc')).toThrow('factory error');
            expect(factory).toHaveBeenCalledTimes(1);
            expect(() => container.get('svc')).toThrow('factory error');
            expect(factory).toHaveBeenCalledTimes(1);
        });

        it('retries after 60s TTL expires', () => {
            let attempt = 0;
            container.registerFactory('svc', () => {
                attempt++;
                if (attempt < 2) throw new Error('fail');
                return makeService({ name: 'recovered' });
            });
            expect(() => container.get('svc')).toThrow('fail');
            vi.advanceTimersByTime(60_001);
            expect(container.get<MockService>('svc').name).toBe('recovered');
        });
    });

    describe('clear', () => {
        it('calls destroy in LIFO order', async () => {
            const order: string[] = [];
            const svc1 = {
                name: 'first',
                destroy: vi.fn(() => {
                    order.push('first');
                }),
            };
            const svc2 = {
                name: 'second',
                destroy: vi.fn(() => {
                    order.push('second');
                }),
            };
            container.register('svc1', svc1);
            container.register('svc2', svc2);
            // get to trigger factory resolution and register order
            container.get('svc1');
            container.get('svc2');
            await container.clear();
            expect(order).toEqual(['second', 'first']);
        });

        it('clears all maps after destroy', async () => {
            container.register('svc', makeService());
            container.registerFactory('factory', () => makeService());
            container.registerTransient('transient', () => makeService());
            await container.clear();
            expect(container.has('svc')).toBe(false);
            expect(container.has('factory')).toBe(false);
            expect(container.has('transient')).toBe(false);
            expect(container.getServices()).toEqual([]);
        });

        it('tolerates destroy timeout', async () => {
            const svc = {
                name: 'slow',
                destroy: vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 10_000))),
            };
            container.register('svc', svc);
            await container.clear();
            expect(svc.destroy).toHaveBeenCalled();
            expect(container.has('svc')).toBe(false);
        });

        it('collects and logs errors but does not throw', async () => {
            const svc = {
                name: 'broken',
                destroy: vi.fn(() => {
                    throw new Error('destroy failed');
                }),
            };
            container.register('svc', svc);
            await expect(container.clear()).resolves.toBeUndefined();
            expect(svc.destroy).toHaveBeenCalled();
        });

        it('is idempotent', async () => {
            container.register('svc', makeService());
            await container.clear();
            await container.clear();
            expect(container.getServices()).toEqual([]);
        });
    });

    describe('getDependencies', () => {
        it('returns empty object when no deps tracked', () => {
            expect(container.getDependencies()).toEqual({});
        });

        it('tracks dependencies between factories', () => {
            container.registerFactory('a', (c) => {
                c.get('b');
                return makeService();
            });
            container.registerFactory('b', () => makeService());
            container.get('a');
            const deps = container.getDependencies();
            expect(deps['a']).toContain('b');
        });
    });

    describe('getServices', () => {
        it('lists all registered services', () => {
            container.register('svc1', makeService());
            container.registerFactory('svc2', () => makeService());
            container.registerTransient('svc3', () => makeService());
            const services = container.getServices();
            expect(services).toContain('svc1');
            expect(services).toContain('svc2');
            expect(services).toContain('svc3');
        });
    });

    describe('edge cases', () => {
        it('supports symbol keys', () => {
            const sym = Symbol('svc');
            container.register(sym, makeService());
            expect(container.get(sym)).toBeDefined();
        });

        it('throws descriptive error for unknown id', () => {
            expect(() => container.get('unknown')).toThrow('Service not found: unknown');
        });

        it('factory can register additional services', () => {
            container.registerFactory('a', (c) => {
                c.register('b', makeService({ name: 'b' }));
                return makeService({ name: 'a' });
            });
            container.get('a');
            expect(container.has('b')).toBe(true);
        });

        it('multiple transient factories are independent', () => {
            container.registerTransient('a', () => makeService({ name: 'a' }));
            container.registerTransient('b', () => makeService({ name: 'b' }));
            expect(container.get<MockService>('a')).not.toBe(container.get<MockService>('a'));
            expect(container.get<MockService>('b')).not.toBe(container.get<MockService>('b'));
        });
    });

    describe('dependency edge recording (B-06)', () => {
        it('recordDependency adds an explicit edge visible in getDependencies', () => {
            container.recordDependency('a', 'b');
            expect(container.getDependencies()['a']).toContain('b');
        });

        it('recordDependencyFromActive attributes the edge to the resolving factory', () => {
            container.registerFactory('a', (c) => {
                c.recordDependencyFromActive('b');
                return makeService({ name: 'a' });
            });
            container.get('a');
            expect(container.getDependencies()['a']).toContain('b');
        });

        it('recordDependencyFromActive is a no-op when no factory is resolving', () => {
            container.recordDependencyFromActive('orphan');
            expect(container.getDependencies()).toEqual({});
        });

        it('a factory that reaches the locator via lazyService records the edge (graph not blind to lazy deps)', () => {
            // Mirrors the service-helper wiring: during 'a' resolution the active factory
            // id is set, so recordDependencyFromActive('b') attributes the locator edge.
            container.registerFactory('a', (c) => {
                c.recordDependencyFromActive('b');
                return makeService({ name: 'a' });
            });
            container.registerFactory('b', () => makeService({ name: 'b' }));
            container.get('a');
            const deps = container.getDependencies();
            expect(deps['a']).toContain('b');
        });
    });
});
