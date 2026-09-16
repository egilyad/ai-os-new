import { describe, it, expect, vi } from 'vitest';

describe('classifyRequest', () => {
    const BASE = {
        shortThreshold: 500,
        mediumThreshold: 2000,
        complexThreshold: 3000,
        longThreshold: 4000,
        codePatterns:
            '(function|class|const|import|export|def |```|SELECT|CREATE TABLE|async |await )',
        reasoningPatterns:
            '(because|therefore|reason|analyze|compare|contrast|evaluate|step.*by.*step|first.*second)',
        multimodalPatterns: '(image|picture|photo|drawing|diagram|chart|graph|figure|\\[image\\])',
    };

    async function load() {
        return import('./router-request-classifier');
    }

    it('classifies code intent', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'function hello() { return 1; }');
        expect(r.intent).toBe('code');
        expect(r.isCode).toBe(true);
    });

    it('classifies math intent', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'solve the equation x^2 = 4');
        expect(r.intent).toBe('math');
    });

    it('classifies factual intent', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'what is the meaning of life');
        expect(r.intent).toBe('factual');
    });

    it('classifies creative intent', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'write a poem about AI');
        expect(r.intent).toBe('creative');
    });

    it('classifies analysis intent', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'compare and contrast AI vs humans');
        expect(r.intent).toBe('analysis');
    });

    it('defaults to general', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'hello world');
        expect(r.intent).toBe('general');
    });

    it('classifies complexity: simple', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'hi');
        expect(r.complexity).toBe('simple');
    });

    it('classifies complexity: medium', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'x'.repeat(2500));
        expect(r.complexity).toBe('medium');
    });

    it('classifies complexity: complex with reasoning', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'explain step by step how this works');
        expect(r.complexity).toBe('complex');
    });

    it('classifies language: ru', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'Привет');
        expect(r.language).toBe('ru');
    });

    it('classifies isLong', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'x'.repeat(5000));
        expect(r.isLong).toBe(true);
    });

    it('classifies isMultimodal', async () => {
        const { classifyRequest } = await load();
        const r = classifyRequest(BASE as never, 'describe this diagram');
        expect(r.isMultimodal).toBe(true);
    });
});

describe('router-scoring', () => {
    const PROFILE = {
        autoDynamicAdjustment: {
            short: { ttftDelta: 0.2, tpsDelta: -0.1, reliabilityDelta: 0 },
            long: { ttftDelta: -0.1, tpsDelta: 0.2, reliabilityDelta: 0 },
        },
        strategyWeights: {
            latency: { ttft: 0.7, tps: 0.2, reliability: 0.1 },
            performance: { ttft: 0.3, tps: 0.5, reliability: 0.2 },
        },
    };

    const STATE = {
        weights: {
            base: { ttft: 0.33, tps: 0.33, reliability: 0.34 },
            adaptiveDelta: { ttft: 0.07, tps: -0.03, reliability: -0.04 },
            effective: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
        },
        providers: {
            fast: {
                id: 'fast',
                avgTTFT: 200,
                avgTPS: 50,
                reliability: 0.95,
                status: 'healthy' as const,
                stabilityIndex: 1.0,
                reputationScore: 90,
                totalRequests: 1000,
                selectionRate: 0.5,
            },
            slow: {
                id: 'slow',
                avgTTFT: 5000,
                avgTPS: 5,
                reliability: 0.5,
                status: 'healthy' as const,
                stabilityIndex: 0.5,
                reputationScore: 50,
                totalRequests: 100,
                selectionRate: 0.1,
            },
            offline: {
                id: 'offline',
                avgTTFT: 1000,
                avgTPS: 20,
                reliability: 0.8,
                status: 'offline' as const,
                stabilityIndex: 0.8,
                reputationScore: 80,
                totalRequests: 500,
                selectionRate: 0.3,
            },
        },
        keys: [],
    };

    const SCORING = {
        ttft: { maxMs: 2000 },
        tps: { max: 100 },
        reliability: { floor: 0.3 },
        stabilityBonus: 0.1,
        reputationBonus: 0.1,
        keyReputationBonus: 0.15,
        latencyPenalty: { thresholdRatio: 1.5, max: 0.3, slope: 0.2 },
        costPenalty: { scalar: 100 },
    };

    async function load() {
        return import('./router-scoring');
    }

    it('normalizeWeights sums to 1', async () => {
        const { normalizeWeights } = await load();
        const n = normalizeWeights({ ttft: 5, tps: 3, reliability: 2 });
        expect(n.ttft + n.tps + n.reliability).toBeCloseTo(1);
    });

    it('getEffectiveWeights uses strategy for non-auto', async () => {
        const { getEffectiveWeights } = await load();
        const w = getEffectiveWeights('latency' as never, '', STATE as never, PROFILE as never);
        expect(w.ttft).toBeGreaterThan(w.tps);
    });

    it('calculateProviderScore returns 0 for offline', async () => {
        const { calculateProviderScore } = await load();
        const w = { ttft: 0.4, tps: 0.3, reliability: 0.3 };
        expect(calculateProviderScore('offline', STATE as never, w, SCORING as never)).toBe(0);
    });

    it('calculateProviderScore returns 0.2 for unknown', async () => {
        const { calculateProviderScore } = await load();
        const w = { ttft: 0.4, tps: 0.3, reliability: 0.3 };
        expect(calculateProviderScore('unknown', STATE as never, w, SCORING as never)).toBeCloseTo(
            0.2,
        );
    });

    it('calculateProviderScore returns positive for healthy', async () => {
        const { calculateProviderScore } = await load();
        const w = { ttft: 0.4, tps: 0.3, reliability: 0.3 };
        expect(calculateProviderScore('fast', STATE as never, w, SCORING as never)).toBeGreaterThan(
            0,
        );
    });

    it('estimateRequestCost uses pricing', async () => {
        const { estimateRequestCost } = await load();
        const key = {
            provider: 'openai',
            model: 'gpt-4',
            id: 'k1',
            key: 'sk-xxx',
            status: 'active' as const,
            label: 'test',
            stats: { successCount: 10, errorCount: 0, totalTokens: 1000, totalCost: 0.01 },
        };
        const cost = estimateRequestCost(key as never, 'hello', () => ({ input: 3, output: 15 }));
        expect(cost).toBeGreaterThan(0);
    });

    it('estimateRequestCost returns 0 when no pricing', async () => {
        const { estimateRequestCost } = await load();
        const key = {
            provider: 'openai',
            model: 'unknown',
            id: 'k1',
            key: 'sk-xxx',
            status: 'active' as const,
            label: 'test',
            stats: { successCount: 10, errorCount: 0, totalTokens: 1000, totalCost: 0.01 },
        };
        expect(estimateRequestCost(key as never, 'hello', () => undefined)).toBe(0);
    });
});

describe('DowngradeStrategy', () => {
    function makePolicy(
        overrides?: Partial<{
            getDowngradedModel: (model: string) => string | null;
            getDeepDowngradedModel: (model: string, steps: number) => string | null;
        }>,
    ) {
        return {
            getDowngradedModel:
                overrides?.getDowngradedModel ??
                vi.fn((m: string) => (m === 'gpt-4' ? 'gpt-3.5-turbo' : null)),
            getDeepDowngradedModel:
                overrides?.getDeepDowngradedModel ?? vi.fn(() => 'gpt-3.5-turbo'),
        };
    }

    async function load() {
        return import('./downgrade-strategy');
    }

    it('returns null when no thresholds exceeded', async () => {
        const { DowngradeStrategy } = await load();
        const ds = new DowngradeStrategy(makePolicy() as never);
        const r = ds.evaluate('gpt-4', {
            avgLatency: 100,
            p95Latency: 200,
            costPerRequest: 0.001,
            avgTokensPerRequest: 500,
            quotaUsed: 10,
            quotaLimit: 1000,
        });
        expect(r).toBeNull();
    });

    it('returns hard downgrade when latency > 1.5x threshold', async () => {
        const { DowngradeStrategy } = await load();
        const ds = new DowngradeStrategy(makePolicy() as never);
        const r = ds.evaluate('gpt-4', {
            avgLatency: 10000,
            p95Latency: 15000,
            costPerRequest: 0.001,
            avgTokensPerRequest: 500,
            quotaUsed: 10,
            quotaLimit: 1000,
        });
        expect(r).not.toBeNull();
        expect(r!.severity).toBe('hard');
        expect(r!.trigger).toBe('latency');
        expect(r!.targetModel).toBe('gpt-3.5-turbo');
    });

    it('returns soft downgrade when latency above threshold', async () => {
        const { DowngradeStrategy } = await load();
        const ds = new DowngradeStrategy(makePolicy() as never);
        const r = ds.evaluate('gpt-4', {
            avgLatency: 6000,
            p95Latency: 8000,
            costPerRequest: 0.001,
            avgTokensPerRequest: 500,
            quotaUsed: 10,
            quotaLimit: 1000,
        });
        expect(r).not.toBeNull();
        expect(r!.severity).toBe('soft');
    });

    it('returns hard downgrade when quota > 95%', async () => {
        const { DowngradeStrategy } = await load();
        const ds = new DowngradeStrategy(makePolicy() as never);
        const r = ds.evaluate('gpt-4', {
            avgLatency: 100,
            p95Latency: 200,
            costPerRequest: 0.001,
            avgTokensPerRequest: 500,
            quotaUsed: 960,
            quotaLimit: 1000,
        });
        expect(r).not.toBeNull();
        expect(r!.severity).toBe('hard');
        expect(r!.trigger).toBe('quota');
    });

    it('returns null when no downgrade model', async () => {
        const { DowngradeStrategy } = await load();
        const ds = new DowngradeStrategy(makePolicy({ getDowngradedModel: () => null }) as never);
        const r = ds.evaluate('gpt-4', {
            avgLatency: 10000,
            p95Latency: 15000,
            costPerRequest: 0.001,
            avgTokensPerRequest: 500,
            quotaUsed: 10,
            quotaLimit: 1000,
        });
        expect(r).toBeNull();
    });

    it('setThresholds updates thresholds', async () => {
        const { DowngradeStrategy } = await load();
        const ds = new DowngradeStrategy(makePolicy() as never, { latencyMs: 10000 });
        expect(
            ds.evaluate('gpt-4', {
                avgLatency: 8000,
                p95Latency: 10000,
                costPerRequest: 0.001,
                avgTokensPerRequest: 500,
                quotaUsed: 10,
                quotaLimit: 1000,
            }),
        ).toBeNull();
        ds.setThresholds({ latencyMs: 5000 });
        expect(
            ds.evaluate('gpt-4', {
                avgLatency: 8000,
                p95Latency: 10000,
                costPerRequest: 0.001,
                avgTokensPerRequest: 500,
                quotaUsed: 10,
                quotaLimit: 1000,
            }),
        ).not.toBeNull();
    });

    it('evaluateWithDeep returns deeper model for hard', async () => {
        const { DowngradeStrategy } = await load();
        const policy = makePolicy({ getDeepDowngradedModel: vi.fn(() => 'gpt-4o-mini') });
        const ds = new DowngradeStrategy(policy as never);
        const r = ds.evaluateWithDeep(
            'gpt-4',
            {
                avgLatency: 10000,
                p95Latency: 15000,
                costPerRequest: 0.001,
                avgTokensPerRequest: 500,
                quotaUsed: 10,
                quotaLimit: 1000,
            },
            3,
        );
        expect(r).not.toBeNull();
        expect(r!.targetModel).toBe('gpt-4o-mini');
        expect(r!.reason).toContain('[deep]');
    });
});
