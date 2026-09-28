import { describe, it, expect } from 'vitest';
import { calculateProviderScore, estimateRequestCost } from './router-scoring';
import type { SystemState, RouterWeights, ApiKey } from '../types/metrics-types';
import type { ScoringConfig } from '../types/routing-types';

const weights = { reliability: 1, ttft: 1, tps: 1 } as RouterWeights;

const scoring = {
    reliability: { floor: 0.4 },
    ttft: { maxMs: 2000 },
    tps: { max: 100 },
    stabilityBonus: 0.1,
    reputationBonus: 0.1,
} as unknown as ScoringConfig;

function stateWith(metrics: {
    reliability: number;
    avgTTFT: number;
    avgTPS: number;
    stabilityIndex: number;
    reputationScore: number;
}): SystemState {
    return {
        providers: {
            p: { status: 'online', ...metrics },
        },
    } as unknown as SystemState;
}

describe('router-scoring zero handling', () => {
    it('treats zero stability/reputation as worst, not best', () => {
        const base = { reliability: 0.9, avgTTFT: 500, avgTPS: 50 };
        const zero = calculateProviderScore(
            'p',
            stateWith({ ...base, stabilityIndex: 0, reputationScore: 0 }),
            weights,
            scoring,
        );
        const good = calculateProviderScore(
            'p',
            stateWith({ ...base, stabilityIndex: 0.9, reputationScore: 90 }),
            weights,
            scoring,
        );
        // With `||` fallbacks the zero-metrics provider scored HIGHER
        // (0 → 1.0 stability, 0 → 100 reputation). `??` keeps 0 the worst.
        expect(zero).toBeLessThan(good);
    });

    it('prices free models at zero instead of the fallback price', () => {
        const cost = estimateRequestCost({ model: 'm' } as unknown as ApiKey, 'Hello world', () => ({
            input: 0,
            output: 0,
        }));
        expect(cost).toBe(0);
    });
});
