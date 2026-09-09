import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingService } from './pricing-service';
import type { PricingServiceDeps } from './pricing-service';

function makeDeps(overrides: Partial<PricingServiceDeps> = {}): PricingServiceDeps {
    return {
        eventBus: { emit: vi.fn() },
        database: {
            getKv: vi.fn().mockResolvedValue(null),
            setKv: vi.fn().mockResolvedValue(undefined),
            ...overrides.database,
        },
        ...overrides,
    } as PricingServiceDeps;
}

describe('PricingService', () => {
    let svc: PricingService;
    let deps: PricingServiceDeps;

    beforeEach(async () => {
        deps = makeDeps();
        svc = new PricingService(deps);
        await svc.init();
    });

    describe('lookup', () => {
        it('should return exact model pricing', () => {
            const p = (
                svc as unknown as { lookup: (m: string) => { input: number; output: number } }
            ).lookup('gpt-4o');
            expect(p.input).toBeGreaterThan(0);
            expect(p.output).toBeGreaterThan(0);
        });

        it('should strip provider prefix', () => {
            const p = (
                svc as unknown as { lookup: (m: string) => { input: number; output: number } }
            ).lookup('openai/gpt-4o');
            expect(p.input).toBe(2.5);
        });

        it('should strip colon-separated provider prefix', () => {
            const p = (
                svc as unknown as { lookup: (m: string) => { input: number; output: number } }
            ).lookup('groq:llama-3.1-8b-instant');
            expect(p.input).toBe(0.03);
        });

        it('should match by prefix', () => {
            const p = (
                svc as unknown as { lookup: (m: string) => { input: number; output: number } }
            ).lookup('gpt-4o-some-extension');
            expect(p.input).toBe(2.5);
        });

        it('should return fallback for unknown model', () => {
            const p = (
                svc as unknown as { lookup: (m: string) => { input: number; output: number } }
            ).lookup('completely-unknown-model-v99');
            expect(p.input).toBe(0.15);
            expect(p.output).toBe(0.6);
        });

        it('should return user override', async () => {
            svc.setOverride('gpt-4o', { input: 1.0, output: 5.0 });
            const p = (
                svc as unknown as { lookup: (m: string) => { input: number; output: number } }
            ).lookup('gpt-4o');
            expect(p.input).toBe(1.0);
            expect(p.output).toBe(5.0);
        });
    });

    describe('calculateCost', () => {
        it('should compute correct cost', () => {
            const cost = svc.calculateCost('gpt-4o', 1000, 500);
            expect(cost).toBe((1000 / 1_000_000) * 2.5 + (500 / 1_000_000) * 10.0);
        });

        it('should return 0 for free model', () => {
            const cost = svc.calculateCost('free', 1000, 500);
            expect(cost).toBe(0);
        });
    });

    describe('estimateCost', () => {
        it('should estimate cost from prompt length', () => {
            const cost = svc.estimateCost('gpt-4o', 4000, 256);
            expect(cost).toBeGreaterThan(0);
        });
    });

    describe('predictCost', () => {
        it('should predict cost from messages', () => {
            const result = svc.predictCost([{ role: 'user', content: 'hello world' }], 'gpt-4o');
            expect(result.estimatedTotalCost).toBeGreaterThan(0);
            expect(result.model).toBe('gpt-4o');
            expect(result.provider).toBe('openai');
        });

        it('should return zero cost for local models', () => {
            const result = svc.predictCost([{ role: 'user', content: 'hello' }], 'ollama/llama2');
            expect(result.estimatedTotalCost).toBe(0);
            expect(result.provider).toBe('local');
        });

        it('should return zero cost for localhost', () => {
            const result = svc.predictCost([{ role: 'user', content: 'test' }], '127.0.0.1/model');
            expect(result.estimatedTotalCost).toBe(0);
        });
    });

    describe('overrides', () => {
        it('should set and get overrides', () => {
            svc.setOverride('test-model', { input: 5.0, output: 15.0 });
            const overrides = svc.getUserOverrides();
            expect(overrides['test-model'].input).toBe(5.0);
        });

        it('should remove override', () => {
            svc.setOverride('test-model', { input: 5.0, output: 15.0 });
            svc.removeOverride('test-model');
            expect(svc.getUserOverrides()).toEqual({});
        });

        it('should clear prefix cache on override change', () => {
            (svc as unknown as { prefixCache: Map<string, unknown> }).prefixCache.set(
                'gpt-4o',
                {} as { input: number; output: number },
            );
            svc.setOverride('other-model', { input: 1, output: 1 });
            expect((svc as unknown as { prefixCache: Map<string, unknown> }).prefixCache.size).toBe(
                0,
            );
        });
    });

    describe('getPricingForModel', () => {
        it('should return input and output pricing', () => {
            const p = svc.getPricingForModel('gpt-4o');
            expect(p.input).toBe(2.5);
            expect(p.output).toBe(10.0);
        });
    });

    describe('init', () => {
        it('should be idempotent', async () => {
            await svc.init();
            expect(deps.database.getKv).toHaveBeenCalledTimes(2);
        });

        it('should load saved cache from DB', async () => {
            const deps2 = makeDeps({
                database: {
                    getKv: vi.fn().mockImplementation((key: string) => {
                        if (key === 'pricing_cache') {
                            return Promise.resolve({
                                data: { 'custom-model': { input: 1, output: 2 } },
                                timestamp: Date.now(),
                            });
                        }
                        return Promise.resolve(null);
                    }),
                    setKv: vi.fn().mockResolvedValue(undefined),
                },
            });
            const s = new PricingService(deps2);
            await s.init();
            const p = s.getPricingForModel('custom-model');
            expect(p.input).toBe(1);
        });
    });

    describe('getAllPrices and getLastSync', () => {
        it('should return all prices', () => {
            const all = svc.getAllPrices();
            expect(Object.keys(all).length).toBeGreaterThan(30);
            expect(all['gpt-4o']).toBeDefined();
        });

        it('should return last sync timestamp', () => {
            expect(svc.getLastSync()).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should clear cache', () => {
            (svc as unknown as { prefixCache: Map<string, unknown> }).prefixCache.set(
                'x',
                {} as { input: number; output: number },
            );
            svc.destroy();
            expect((svc as unknown as { prefixCache: Map<string, unknown> }).prefixCache.size).toBe(
                0,
            );
        });
    });
});
