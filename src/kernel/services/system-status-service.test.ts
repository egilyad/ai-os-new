import { describe, it, expect, vi } from 'vitest';
import { SystemStatusService } from './system-status-service';
import type { SystemStatusServiceDeps } from './system-status-service';
import type { IGroupManager } from '../contracts/group-manager';
import type { IKeyStateStore } from '../contracts/key-state';

function makeDeps(overrides: Partial<SystemStatusServiceDeps> = {}): SystemStatusServiceDeps {
    return {
        groupManager: {
            ready: true,
            getPassport: vi.fn(),
            getGroups: vi.fn(),
        } as unknown as IGroupManager,
        keyService: {
            getKeys: vi.fn().mockReturnValue([]),
        } as unknown as SystemStatusServiceDeps['keyService'],
        keyStateStore: { getAll: vi.fn().mockReturnValue([]) } as unknown as IKeyStateStore,
        ...overrides,
    };
}

function makeKey(overrides: { id?: string; status?: string } = {}) {
    return { id: overrides.id ?? 'k1', status: overrides.status ?? 'active' };
}

describe('SystemStatusService', () => {
    describe('getStatus', () => {
        it('should return LOADING when GroupManager not ready', () => {
            const svc = new SystemStatusService(
                makeDeps({ groupManager: { ready: false } as unknown as IGroupManager }),
            );
            const report = svc.getStatus();
            expect(report.status).toBe('LOADING');
            expect(report.summary).toContain('GroupManager not ready');
        });

        it('should return EMPTY when no keys configured', () => {
            const deps = makeDeps();
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.status).toBe('EMPTY');
            expect(report.summary).toContain('No API keys');
        });

        it('should return READY with active keys and full passports', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi
                        .fn()
                        .mockReturnValue([makeKey({ id: 'k1' }), makeKey({ id: 'k2' })]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue({}),
                } as unknown as IGroupManager,
                keyStateStore: {
                    getAll: vi.fn().mockReturnValue([{}, {}]),
                } as unknown as IKeyStateStore,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.status).toBe('READY');
            expect(report.areas.keys).toBe('populated');
            expect(report.areas.passports).toBe('full');
            expect(report.areas.projections).toBe('synced');
        });

        it('should return DEGRADED when all keys are broken', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi
                        .fn()
                        .mockReturnValue([
                            makeKey({ status: 'error' }),
                            makeKey({ status: 'error' }),
                        ]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue({}),
                } as unknown as IGroupManager,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.status).toBe('DEGRADED');
            expect(report.areas.keys).toBe('degraded');
        });

        it('should return PARTIAL when some keys are inactive', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi
                        .fn()
                        .mockReturnValue([
                            makeKey({ status: 'active' }),
                            makeKey({ status: 'error' }),
                        ]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue({}),
                } as unknown as IGroupManager,
                keyStateStore: {
                    getAll: vi.fn().mockReturnValue([{}, {}]),
                } as unknown as IKeyStateStore,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.areas.keys).toBe('partial');
        });

        it('should detect missing passports', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi
                        .fn()
                        .mockReturnValue([makeKey({ id: 'k1' }), makeKey({ id: 'k2' })]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi
                        .fn()
                        .mockImplementation((id: string) => (id === 'k1' ? {} : null)),
                } as unknown as IGroupManager,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.areas.passports).toBe('partial');
            expect(report.warnings).toContain('1 key(s) without passport');
        });

        it('should detect zero passports as missing', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi.fn().mockReturnValue([makeKey({ id: 'k1' })]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue(null),
                } as unknown as IGroupManager,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.areas.passports).toBe('missing');
        });

        it('should report stale projections', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi
                        .fn()
                        .mockReturnValue([makeKey({ id: 'k1' }), makeKey({ id: 'k2' })]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue({}),
                } as unknown as IGroupManager,
                keyStateStore: {
                    getAll: vi.fn().mockReturnValue([{}]),
                } as unknown as IKeyStateStore,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.areas.projections).toBe('stale');
        });

        it('should report unavailable projections when no keyStateStore', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi.fn().mockReturnValue([makeKey({ id: 'k1' })]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue({}),
                } as unknown as IGroupManager,
                keyStateStore: undefined,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.areas.projections).toBe('unavailable');
        });

        it('should include warnings for partial consistency', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi.fn().mockReturnValue([makeKey({ id: 'k1' })]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue(null),
                } as unknown as IGroupManager,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.warnings.length).toBeGreaterThan(0);
        });

        it('should set a timestamp', () => {
            const deps = makeDeps({
                keyService: {
                    getKeys: vi.fn().mockReturnValue([makeKey()]),
                } as unknown as SystemStatusServiceDeps['keyService'],
                groupManager: {
                    ready: true,
                    getPassport: vi.fn().mockReturnValue({}),
                } as unknown as IGroupManager,
            });
            const svc = new SystemStatusService(deps);
            const report = svc.getStatus();
            expect(report.timestamp).toBeGreaterThan(0);
        });
    });
});
