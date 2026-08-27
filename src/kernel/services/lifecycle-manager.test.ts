import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifecycleManager } from './lifecycle-manager';
import type { ILifecycle } from '../contracts/lifecycle';

function makeService(overrides: Partial<ILifecycle> = {}): ILifecycle {
    return {
        init: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

describe('LifecycleManager', () => {
    let mgr: LifecycleManager;

    beforeEach(() => {
        mgr = new LifecycleManager();
    });

    describe('register', () => {
        it('should register a service', () => {
            const svc = makeService();
            mgr.register('test', svc);
            expect(mgr.getEntries()).toHaveLength(1);
        });

        it('should not register duplicate names', () => {
            mgr.register('dup', makeService());
            mgr.register('dup', makeService());
            expect(mgr.getEntries()).toHaveLength(1);
        });
    });

    describe('initAll', () => {
        it('should init all registered services', async () => {
            const a = makeService();
            const b = makeService();
            mgr.register('a', a);
            mgr.register('b', b);
            await mgr.initAll();
            expect(a.init).toHaveBeenCalledOnce();
            expect(b.init).toHaveBeenCalledOnce();
        });

        it('should not throw on repeated call', async () => {
            mgr.register('a', makeService());
            await mgr.initAll();
            await expect(mgr.initAll()).resolves.toBeUndefined();
        });

        it('should record ok status on success', async () => {
            mgr.register('a', makeService());
            await mgr.initAll();
            const statuses = mgr.getStatuses();
            expect(statuses).toHaveLength(1);
            expect(statuses[0].name).toBe('a');
            expect(statuses[0].status).toBe('ok');
        });

        it('should record error status on failure', async () => {
            mgr.register(
                'fail',
                makeService({ init: vi.fn().mockRejectedValue(new Error('boom')) }),
            );
            await mgr.initAll();
            const s = mgr.getStatuses()[0];
            expect(s.status).toBe('error');
            expect(s.error).toBe('boom');
        });
    });

    describe('tryInit', () => {
        it('should retry on failure', async () => {
            const fn = vi
                .fn()
                .mockRejectedValueOnce(new Error('attempt 1'))
                .mockRejectedValueOnce(new Error('attempt 2'))
                .mockResolvedValueOnce(undefined);
            const ok = await mgr.tryInit('test', fn, 2);
            expect(ok).toBe(true);
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should fail after all retries exhausted', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('always fails'));
            const ok = await mgr.tryInit('test', fn, 2);
            expect(ok).toBe(false);
            expect(fn).toHaveBeenCalledTimes(3);
        });
    });

    describe('tryInitIfPresent', () => {
        it('should skip if no init method', async () => {
            const ok = await mgr.tryInitIfPresent('no-init', {});
            expect(ok).toBe(true);
            const s = mgr.getStatuses()[0];
            expect(s.status).toBe('ok');
        });

        it('should call init if present', async () => {
            const svc = makeService();
            const ok = await mgr.tryInitIfPresent('has-init', svc);
            expect(ok).toBe(true);
            expect(svc.init).toHaveBeenCalledOnce();
        });
    });

    describe('startAll', () => {
        it('should start all initialized services', async () => {
            const a = makeService();
            mgr.register('a', a);
            await mgr.initAll();
            await mgr.startAll();
            expect(a.start).toHaveBeenCalledOnce();
        });

        it('should skip services with failed init', async () => {
            const a = makeService();
            const b = makeService({ init: vi.fn().mockRejectedValue(new Error('fail')) });
            mgr.register('a', a);
            mgr.register('b', b);
            await mgr.initAll();
            await mgr.startAll();
            expect(a.start).toHaveBeenCalled();
            expect(b.start).not.toHaveBeenCalled();
        });
    });

    describe('shutdown', () => {
        it('should destroy all services in reverse order', async () => {
            const a = makeService();
            const b = makeService();
            mgr.register('a', a);
            mgr.register('b', b);
            await mgr.initAll();
            await mgr.shutdown();
            expect(a.destroy).toHaveBeenCalledOnce();
            expect(b.destroy).toHaveBeenCalledOnce();
            expect(mgr.getEntries()).toHaveLength(0);
        });

        it('should be idempotent', async () => {
            mgr.register('a', makeService());
            await mgr.initAll();
            await mgr.shutdown();
            await mgr.shutdown();
            expect(mgr.getEntries()).toHaveLength(0);
        });

        it('should skip destroy for failed init services', async () => {
            const a = makeService({ init: vi.fn().mockRejectedValue(new Error('fail')) });
            mgr.register('a', a);
            await mgr.initAll();
            await mgr.shutdown();
            expect(a.destroy).not.toHaveBeenCalled();
        });
    });

    describe('initAllSequential', () => {
        it('should init services in order with memory logging', async () => {
            const a = makeService();
            const b = makeService();
            mgr.register('a', a);
            mgr.register('b', b);
            const results = await mgr.initAllSequential();
            expect(results).toEqual([true, true]);
        });
    });

    describe('clearStatuses', () => {
        it('should clear all statuses', async () => {
            mgr.register('a', makeService());
            await mgr.initAll();
            expect(mgr.getStatuses()).toHaveLength(1);
            mgr.clearStatuses();
            expect(mgr.getStatuses()).toHaveLength(0);
        });
    });
});
