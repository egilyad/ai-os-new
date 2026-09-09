import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigService, deepMerge } from './config-service';
import type { ConfigServiceDeps } from './config-service';

function createDeps(overrides?: Record<string, unknown>): ConfigServiceDeps {
    const db = new Map<string, unknown>();
    return {
        database: {
            getKv: vi.fn(async <T>(id: string) => (db.get(id) ?? null) as T | null) as <T>(
                id: string,
            ) => Promise<T | null>,
            setKv: vi.fn(async <T>(id: string, value: T) => {
                db.set(id, value);
            }) as <T>(id: string, value: T) => Promise<void>,
        },
        eventBus: {
            on: vi.fn(() => vi.fn()) as (
                event: string,
                cb: (...args: unknown[]) => void,
            ) => () => void,
            emit: vi.fn() as (event: string, data?: unknown) => void,
        },
        ...overrides,
    } as ConfigServiceDeps;
}

describe('deepMerge', () => {
    it('returns target when source is empty', () => {
        const result = deepMerge({ a: 1 }, undefined);
        expect(result).toEqual({ a: 1 });
    });

    it('shallow merges non-object values', () => {
        const result = deepMerge({ a: 1, b: 2 }, { b: 3 });
        expect(result).toEqual({ a: 1, b: 3 });
    });

    it('deeply merges nested objects', () => {
        const result = deepMerge({ outer: { inner: 1, other: 2 } }, {
            outer: { inner: 10 },
        } as never) as Record<string, unknown>;
        expect(result).toEqual({ outer: { inner: 10, other: 2 } });
    });

    it('replaces arrays (not deep merges)', () => {
        const result = deepMerge({ items: [1, 2, 3] }, { items: [4, 5] });
        expect(result).toEqual({ items: [4, 5] });
    });

    it('shallow copies at depth > 10 instead of deep merging', () => {
        const deep12: Record<string, unknown> = {
            a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: { l: 1 } } } } } } } } } } },
        };
        const src12: Record<string, unknown> = {
            a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: { l: 2 } } } } } } } } } } },
        };
        const result = deepMerge(deep12, src12 as typeof deep12);
        expect((result as Record<string, unknown>).a).toBeDefined();
    });
});

describe('ConfigService', () => {
    let deps: ReturnType<typeof createDeps>;
    let service: ConfigService;

    beforeEach(async () => {
        vi.clearAllMocks();
        deps = createDeps();
        service = new ConfigService(deps);
        await service.init();
    });

    afterEach(() => {
        service.destroy();
    });

    describe('init', () => {
        it('loads overlays from database', async () => {
            const saved = { monitoring: { healthCheckStaleIntervalMs: 5000 } };
            deps.database.getKv = vi.fn().mockResolvedValue(saved);
            service = new ConfigService(deps);
            await service.init();
            expect(service.getMonitoring().healthCheckStaleIntervalMs).toBe(5000);
        });

        it('is idempotent', async () => {
            const spy = vi.spyOn(deps.database, 'getKv');
            await service.init();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('subscribes to SETTINGS_UPDATED', () => {
            expect(deps.eventBus!.on).toHaveBeenCalledWith(
                'settings:updated',
                expect.any(Function),
            );
        });

        it('handles database error gracefully', async () => {
            deps.database.getKv = vi.fn().mockRejectedValue(new Error('db error'));
            service = new ConfigService(deps);
            await expect(service.init()).resolves.toBeUndefined();
        });
    });

    describe('getters return defaults when no overlays', () => {
        it('getMonitoring', () => {
            const cfg = service.getMonitoring();
            expect(cfg.healthCheckStaleIntervalMs).toBe(10000);
        });

        it('getMetrics', () => {
            const cfg = service.getMetrics();
            expect(cfg.maxHistoryPoints).toBe(1000);
        });

        it('getTraces', () => {
            const cfg = service.getTraces();
            expect(cfg.maxEntries).toBe(200);
        });

        it('getWebhooks', () => {
            const cfg = service.getWebhooks();
            expect(cfg.maxRetries).toBe(3);
        });

        it('getKeys', () => {
            const cfg = service.getKeys();
            expect(cfg.healthCheckTimeoutMs).toBe(5000);
        });

        it('getLlm', () => {
            const cfg = service.getLlm();
            expect(cfg.tokenEstimateDivisor).toBe(4);
        });

        it('getPressure', () => {
            const cfg = service.getPressure();
            expect(cfg.autoRefreshIntervalMs).toBe(10000);
        });

        it('getPricing', () => {
            const cfg = service.getPricing();
            expect(cfg.defaultMonthlyBudget).toBe(50);
        });

        it('getServices', () => {
            const cfg = service.getServices();
            expect(cfg.advisor.latencyThreshold).toBe(4000);
        });
    });

    describe('update methods merge with defaults', () => {
        it('updateMonitoring overlays and persists', async () => {
            await service.updateMonitoring({ healthCheckStaleIntervalMs: 5000 });
            expect(service.getMonitoring().healthCheckStaleIntervalMs).toBe(5000);
        });

        it('updateMetrics', async () => {
            await service.updateMetrics({ maxHistoryPoints: 500 });
            expect(service.getMetrics().maxHistoryPoints).toBe(500);
        });

        it('updateTraces', async () => {
            await service.updateTraces({ maxEntries: 100 });
            expect(service.getTraces().maxEntries).toBe(100);
        });

        it('updateWebhooks', async () => {
            await service.updateWebhooks({ maxRetries: 5 });
            expect(service.getWebhooks().maxRetries).toBe(5);
        });

        it('updateKeys', async () => {
            await service.updateKeys({ healthCheckTimeoutMs: 10000 });
            expect(service.getKeys().healthCheckTimeoutMs).toBe(10000);
        });

        it('updateLlm', async () => {
            await service.updateLlm({ tokenEstimateDivisor: 8 });
            expect(service.getLlm().tokenEstimateDivisor).toBe(8);
        });

        it('updatePressure', async () => {
            await service.updatePressure({ autoRefreshIntervalMs: 20000 });
            expect(service.getPressure().autoRefreshIntervalMs).toBe(20000);
        });

        it('updatePricing', async () => {
            await service.updatePricing({ defaultMonthlyBudget: 100 });
            expect(service.getPricing().defaultMonthlyBudget).toBe(100);
        });

        it('updateServices', async () => {
            await service.updateServices({
                advisor: {
                    latencyThreshold: 5000,
                    costThreshold: 20,
                    minConfidence: 0.8,
                    analysisIntervalMs: 120000,
                },
            });
            expect(service.getServices().advisor.latencyThreshold).toBe(5000);
        });

        it('persists overlays to database after update', async () => {
            await service.updateMonitoring({ healthCheckStaleIntervalMs: 5000 });
            expect(deps.database.setKv).toHaveBeenCalledWith(
                'config_overlays',
                expect.objectContaining({
                    monitoring: expect.objectContaining({ healthCheckStaleIntervalMs: 5000 }),
                }),
            );
        });

        it('emits SETTINGS_UPDATED event', async () => {
            await service.updateMonitoring({ healthCheckStaleIntervalMs: 1000 });
            expect(deps.eventBus!.emit).toHaveBeenCalledWith(
                'settings:updated',
                expect.objectContaining({
                    settings: expect.objectContaining({ healthCheckStaleIntervalMs: 1000 }),
                }),
            );
        });
    });

    describe('clearOverlays', () => {
        it('resets all overlays to default values', async () => {
            await service.updateMonitoring({ healthCheckStaleIntervalMs: 5000 });
            service.clearOverlays();
            const cfg = service.getMonitoring();
            expect(cfg.healthCheckStaleIntervalMs).toBe(10000);
        });
    });

    describe('nested overlays deep merge', () => {
        it('partial update preserves other fields', async () => {
            await service.updateMonitoring({ healthCheckStaleIntervalMs: 5000 });
            await service.updateMonitoring({ alertPenalty: { perAlert: 0.2, cap: 0.5 } });
            expect(service.getMonitoring().healthCheckStaleIntervalMs).toBe(5000);
            expect(service.getMonitoring().alertPenalty.perAlert).toBe(0.2);
        });
    });

    describe('destroy', () => {
        it('unsubscribes from settings:updated', async () => {
            const unsub = vi.fn();
            deps = createDeps({ eventBus: { on: vi.fn(() => unsub), emit: vi.fn() } });
            service = new ConfigService(deps);
            await service.init();
            service.destroy();
            expect(unsub).toHaveBeenCalled();
        });
    });
});
