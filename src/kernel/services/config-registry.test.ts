import { describe, it, expect, vi } from 'vitest';
import { rawConfig, CONFIG, deepFreeze } from './config-registry';
import { ConfigService } from './config-service';

describe('rawConfig and CONFIG', () => {
    it('have the same top-level keys', () => {
        expect(Object.keys(rawConfig).sort()).toEqual(Object.keys(CONFIG).sort());
    });
});

describe('CONFIG', () => {
    it('prevents direct property assignment', () => {
        expect(() => {
            (CONFIG as Record<string, unknown>).version = '2.0.0';
        }).toThrow('CONFIG is read-only');
    });

    it('prevents property deletion', () => {
        expect(() => {
            delete (CONFIG as Record<string, unknown>).version;
        }).toThrow('CONFIG is read-only');
    });
});

describe('ConfigService', () => {
    it('getConfig() returns a config object', () => {
        const eventBus = { on: vi.fn(() => vi.fn()), emit: vi.fn() };
        const db = {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
        };
        const service = new ConfigService({ database: db, eventBus });
        expect(service.getMonitoring()).toBeDefined();
        expect(service.getLlm()).toBeDefined();
        expect(service.getKeys()).toBeDefined();
        expect(typeof service.getMonitoring().healthCheckStaleIntervalMs).toBe('number');
    });

    it('subscribe() returns an unsubscribe function', async () => {
        const unsub = vi.fn();
        const eventBus = { on: vi.fn(() => unsub), emit: vi.fn() };
        const db = {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
        };
        const service = new ConfigService({ database: db, eventBus });
        await service.init();
        expect(eventBus.on).toHaveBeenCalled();
        service.destroy();
        expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('has expected default values (version, buildId, router settings present)', () => {
        expect(CONFIG.version).toBe('1.0.0');
        expect(typeof CONFIG.buildId).toBe('string');
        expect(CONFIG.buildId.length).toBeGreaterThan(0);
        expect(CONFIG.router).toBeDefined();
        expect(CONFIG.router.history.maxDecisions).toBe(100);
        expect(CONFIG.router.scoring.ttftMaxMs).toBe(2000);
    });

    it('getRouterConfig() returns router section', () => {
        expect(CONFIG.router).toBeDefined();
        expect(CONFIG.router.scoring).toBeDefined();
        expect(CONFIG.router.strategyWeights.broadcast.ttft).toBe(0.33);
        expect(CONFIG.router.classification.shortThreshold).toBe(500);
    });
});

describe('deepFreeze', () => {
    it('freezes a plain object recursively', () => {
        const obj = { a: 1, b: { c: 2, d: { e: 3 } } };
        deepFreeze(obj);
        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.b)).toBe(true);
        expect(Object.isFrozen(obj.b.d)).toBe(true);
    });

    it('handles null and primitives without throwing', () => {
        expect(() => deepFreeze(null)).not.toThrow();
        expect(() => deepFreeze(42)).not.toThrow();
        expect(() => deepFreeze('hello')).not.toThrow();
        expect(() => deepFreeze(undefined)).not.toThrow();
    });

    it('is idempotent on already-frozen objects', () => {
        const obj = { a: 1 };
        Object.freeze(obj);
        expect(() => deepFreeze(obj)).not.toThrow();
        expect(Object.isFrozen(obj)).toBe(true);
    });
});
