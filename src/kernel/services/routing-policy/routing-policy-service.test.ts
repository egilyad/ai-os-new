import { describe, it, expect } from 'vitest';
import { RoutingPolicyService, type RoutingPolicyDeps } from './routing-policy-service';
import { CONFIG } from '../config-registry';

const router = CONFIG.router;
const mon = CONFIG.monitoring;

function makeDeps(overrides?: Partial<RoutingPolicyDeps>): RoutingPolicyDeps {
    let settings: RoutingPolicyDeps['settingsService'] extends {
        getSettings: () => infer S;
        updateSettings: (partial: Record<string, unknown>) => void;
    }
        ? S
        : never = {
        fallbackChains: {},
        modelDowngradeChains: {},
        slaMode: 'BALANCED',
    };

    const base: RoutingPolicyDeps = {
        settingsService: {
            getSettings: () => settings,
            updateSettings: (partial) => {
                settings = { ...settings, ...partial };
            },
        },
        pricingService: {
            getPricingForModel: () => ({ input: 0.0001, output: 0.0001 }),
        },
    };

    return { ...base, ...overrides };
}

function makeService(overrides?: Partial<RoutingPolicyDeps>) {
    return new RoutingPolicyService(makeDeps(overrides));
}

describe('RoutingPolicyService fallback (contract)', () => {
    it('picks the first chain link different from the failed provider', () => {
        const svc = makeService();
        svc.setFallbackChain('test', [{ provider: 'A' }, { provider: 'B' }, { provider: 'C' }]);
        expect(svc.resolveFallback('test', 'A')).toEqual({ provider: 'B' });
    });

    it('skips the failed provider case-insensitively', () => {
        const svc = makeService();
        svc.setFallbackChain('test', [{ provider: 'a' }, { provider: 'b' }]);
        expect(svc.resolveFallback('test', 'A')).toEqual({ provider: 'b' });
    });

    it('returns null when the chain contains only the failed provider', () => {
        const svc = makeService();
        svc.setFallbackChain('test', [{ provider: 'A' }]);
        expect(svc.resolveFallback('test', 'A')).toBeNull();
    });

    it('returns null for an unknown strategy without a default chain', () => {
        const svc = makeService();
        expect(svc.resolveFallback('missing', 'A')).toBeNull();
    });

    it('sanitizes chains on set: trims providers/models and drops empties', () => {
        const svc = makeService();
        svc.setFallbackChain('t', [
            { provider: '  A  ' },
            { provider: '' },
            { provider: 'B', model: ' M ' },
        ]);
        expect(svc.getFallbackChain('t')).toEqual([
            { provider: 'A' },
            { provider: 'B', model: 'M' },
        ]);
    });

    it('getFallbackChain returns a defensive copy', () => {
        const svc = makeService();
        svc.setFallbackChain('t', [{ provider: 'A' }]);
        const chain = svc.getFallbackChain('t');
        chain[0]!.provider = 'Z';
        expect(svc.getFallbackChain('t')[0]!.provider).toBe('A');
    });
});

describe('RoutingPolicyService model downgrade (contract)', () => {
    it('returns the first downgrade step', () => {
        const svc = makeService();
        svc.setDowngradeChain('gpt-x', ['gpt-y', 'gpt-z']);
        expect(svc.getDowngradedModel('gpt-x')).toBe('gpt-y');
    });

    it('deep downgrade clamps the step index', () => {
        const svc = makeService();
        svc.setDowngradeChain('gpt-x', ['gpt-y', 'gpt-z']);
        expect(svc.getDeepDowngradedModel('gpt-x', 1)).toBe('gpt-y');
        expect(svc.getDeepDowngradedModel('gpt-x', 2)).toBe('gpt-z');
        expect(svc.getDeepDowngradedModel('gpt-x', 10)).toBe('gpt-z');
    });

    it('returns null for models without a chain', () => {
        const svc = makeService();
        expect(svc.getDowngradedModel('nope')).toBeNull();
        expect(svc.getDeepDowngradedModel('nope', 2)).toBeNull();
    });
});

describe('RoutingPolicyService latency penalty (contract)', () => {
    const { thresholdRatio, max, slope } = router.scoring.latencyPenalty;

    it('returns 0 when avg latency is within threshold ratio', () => {
        const svc = makeService();
        expect(svc.calculateLatencyPenalty('p', 100, 100)).toBe(0);
        expect(svc.calculateLatencyPenalty('p', 150, 100)).toBe(0);
    });

    it('returns 0 when median latency is not positive', () => {
        const svc = makeService();
        expect(svc.calculateLatencyPenalty('p', 500, 0)).toBe(0);
    });

    it('applies the slope formula and caps at max', () => {
        const svc = makeService();
        expect(svc.calculateLatencyPenalty('p', 170, 100)).toBeCloseTo(
            (1.7 - thresholdRatio) * slope,
            5,
        );
        expect(svc.calculateLatencyPenalty('p', 300, 100)).toBeCloseTo(0.3, 5);
        expect(svc.calculateLatencyPenalty('p', 100000, 100)).toBe(max);
    });
});

describe('RoutingPolicyService cost penalty (contract)', () => {
    it('returns 0 when no pricing entry exists', () => {
        const svc = makeService({ pricingService: { getPricingForModel: () => undefined } });
        expect(svc.calculateCostPenalty('m', 4000)).toBe(0);
    });

    it('computes penalty from estimated input tokens', () => {
        const svc = makeService();
        expect(svc.calculateCostPenalty('m', 4000)).toBeCloseTo(0.01, 8);
        expect(svc.calculateCostPenalty('m', 0)).toBe(0);
    });
});

describe('RoutingPolicyService budget penalty (contract)', () => {
    it('returns 0 when budget is not positive', () => {
        const svc = makeService();
        expect(svc.calculateBudgetPenalty('p', 100, 0)).toBe(0);
    });

    it('picks the highest threshold at or below the spend percentage', () => {
        const svc = makeService();
        expect(svc.calculateBudgetPenalty('p', 200, 100)).toBe(100);
        expect(svc.calculateBudgetPenalty('p', 90, 100)).toBe(50);
        expect(svc.calculateBudgetPenalty('p', 85, 100)).toBe(20);
        expect(svc.calculateBudgetPenalty('p', 50, 100)).toBe(0);
    });
});

describe('RoutingPolicyService health penalties (contract)', () => {
    it('healthy input yields score 1 and no issues', () => {
        const svc = makeService();
        const r = svc.calculateHealthPenalties({
            avgLatency: 100,
            errorRate: 0.01,
            successRate: 0.99,
            criticalAlerts: 0,
        });
        expect(r.score).toBe(1);
        expect(r.issues).toEqual([]);
    });

    it('penalizes high latency', () => {
        const svc = makeService();
        const r = svc.calculateHealthPenalties({
            avgLatency: 5000,
            errorRate: 0,
            successRate: 1,
            criticalAlerts: 0,
        });
        const expected =
            1 -
            Math.min(
                mon.latencyPenalty.cap,
                (5000 - mon.latencyPenalty.thresholdMs) / mon.latencyPenalty.divisor,
            );
        expect(r.score).toBeCloseTo(expected, 10);
        expect(r.issues).toContain('High latency: 5000ms');
    });

    it('penalizes error rate', () => {
        const svc = makeService();
        const r = svc.calculateHealthPenalties({
            avgLatency: 0,
            errorRate: 0.5,
            successRate: 1,
            criticalAlerts: 0,
        });
        const expected =
            1 - Math.min(mon.errorRatePenalty.cap, 0.5 * mon.errorRatePenalty.multiplier);
        expect(r.score).toBeCloseTo(expected, 10);
    });

    it('counts critical alerts', () => {
        const svc = makeService();
        const r = svc.calculateHealthPenalties({
            avgLatency: 0,
            errorRate: 0,
            successRate: 1,
            criticalAlerts: 2,
        });
        expect(r.score).toBeCloseTo(
            1 - Math.min(mon.alertPenalty.cap, 2 * mon.alertPenalty.perAlert),
            10,
        );
    });

    it('clamps score at 0', () => {
        const svc = makeService();
        const r = svc.calculateHealthPenalties({
            avgLatency: 100000,
            errorRate: 1,
            successRate: 0,
            criticalAlerts: 10,
        });
        expect(r.score).toBe(0);
    });
});

describe('RoutingPolicyService preview (contract)', () => {
    it('combines fallback, downgrade, penalties and health', () => {
        const svc = makeService();
        svc.setFallbackChain('s', [{ provider: 'A' }, { provider: 'B' }]);
        svc.setDowngradeChain('gpt-x', ['gpt-y', 'gpt-z']);

        const p = svc.preview({
            strategy: 's',
            failedProvider: 'A',
            model: 'gpt-x',
            downgradeSteps: 2,
            provider: 'P',
            avgLatency: 300,
            medianLatency: 100,
            promptLength: 4000,
            spentThisMonth: 900,
            monthlyBudget: 1000,
            health: { avgLatency: 5000, errorRate: 0, successRate: 1, criticalAlerts: 0 },
        });

        expect(p.fallback).toEqual({ provider: 'B' });
        expect(p.downgradedModel).toBe('gpt-z');
        expect(p.penalties.latency).toBeCloseTo(0.3, 5);
        expect(p.penalties.cost).toBeCloseTo(0.01, 8);
        expect(p.penalties.budget).toBe(50);
        expect(p.health?.score).toBeCloseTo(0.9, 10);
        expect(p.issues.length).toBeGreaterThan(0);
    });
});

describe('RoutingPolicyService history (contract)', () => {
    it('keeps the latest 200 fallback failures, newest first', () => {
        const svc = makeService();
        for (let i = 0; i < 205; i++) {
            svc.recordFallbackFailure(`p${i}`, 's');
        }
        const h = svc.getFallbackHistory();
        expect(h).toHaveLength(200);
        expect(h[0]!.provider).toBe('p204');
        expect(h[199]!.provider).toBe('p5');
    });

    it('records penalties newest first', () => {
        const svc = makeService();
        svc.recordPenalty('p', 'latency', 0.1);
        svc.recordPenalty('p', 'cost', 0.2);
        expect(svc.getPenaltyHistory().map((x) => x.type)).toEqual(['cost', 'latency']);
    });

    it('history getters return copies', () => {
        const svc = makeService();
        svc.recordPenalty('p', 'alert', 1);
        const h = svc.getPenaltyHistory();
        h[0]!.amount = 999;
        expect(svc.getPenaltyHistory()[0]!.amount).toBe(1);
    });

    it('destroy clears history', async () => {
        const svc = makeService();
        svc.recordFallbackFailure('p', 's');
        await svc.destroy();
        expect(svc.getFallbackHistory()).toEqual([]);
        expect(svc.getPenaltyHistory()).toEqual([]);
    });
});

describe('RoutingPolicyService SLA weights (contract)', () => {
    it('maps SLA modes to the configured weight profiles', () => {
        const svc = makeService();
        const w = router.weights;
        expect(svc.getSLAWeights('LOW_LATENCY')).toEqual(w.latency);
        expect(svc.getSLAWeights('HIGH_QUALITY')).toEqual(w.reliability);
        expect(svc.getSLAWeights('BALANCED')).toEqual(w.default);
        expect(svc.getSLAWeights('ECONOMY')).toEqual(w.cost);
        expect(svc.getSLAWeights('FREE_FIRST')).toEqual(w.freeFirst);
        expect(svc.getSLAWeights('PERFORMANCE')).toEqual(w.performance);
        expect(svc.getSLAWeights('UNKNOWN')).toEqual(w.default);
    });
});

describe('RoutingPolicyService snapshot (contract)', () => {
    it('exposes cloned chains and config-derived penalty settings', () => {
        const svc = makeService();
        svc.setFallbackChain('s', [{ provider: 'A' }]);
        const snap = svc.getSnapshot();

        expect(snap.fallbackChains.s).toEqual([{ provider: 'A' }]);
        snap.fallbackChains.s[0]!.provider = 'Z';
        expect(svc.getSnapshot().fallbackChains.s[0]!.provider).toBe('A');

        expect(snap.penaltySettings.latency).toEqual(router.scoring.latencyPenalty);
        expect(snap.penaltySettings.budget.thresholds).toEqual(router.budgetPenalty.thresholds);
        expect(snap.penaltySettings.health).toEqual({
            latencyThresholdMs: mon.latencyPenalty.thresholdMs,
            errorRateThreshold: mon.errorRatePenalty.threshold,
            successRateFloor: mon.successRatePenalty.floor,
            alertPenaltyPerAlert: mon.alertPenalty.perAlert,
        });
    });
});
