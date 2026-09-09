export interface DowngradeThresholds {
    latencyMs: number;
    costPer1kTokens: number;
    quotaPct: number;
}

export interface ProviderMetrics {
    avgLatency: number;
    p95Latency: number;
    costPerRequest: number;
    avgTokensPerRequest: number;
    quotaUsed: number;
    quotaLimit: number;
}

export interface DowngradeCandidate {
    currentModel: string;
    targetModel: string;
    reason: string;
    trigger: 'latency' | 'cost' | 'quota' | 'composite';
    severity: 'soft' | 'hard';
}

const DEFAULT_THRESHOLDS: DowngradeThresholds = {
    latencyMs: 5000,
    costPer1kTokens: 0.01,
    quotaPct: 80,
};

export class DowngradeStrategy {
    private thresholds: DowngradeThresholds;

    constructor(
        private routingPolicy: {
            getDowngradedModel: (model: string) => string | null;
            getDeepDowngradedModel: (model: string, steps: number) => string | null;
        },
        thresholds?: Partial<DowngradeThresholds>,
    ) {
        this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    }

    setThresholds(t: Partial<DowngradeThresholds>) {
        this.thresholds = { ...this.thresholds, ...t };
    }

    evaluate(model: string, metrics: ProviderMetrics): DowngradeCandidate | null {
        const triggers: Array<{
            type: DowngradeCandidate['trigger'];
            severity: DowngradeCandidate['severity'];
            reason: string;
        }> = [];

        const quotaPct =
            metrics.quotaLimit > 0 ? (metrics.quotaUsed / metrics.quotaLimit) * 100 : 0;

        if (metrics.avgLatency > this.thresholds.latencyMs * 1.5) {
            triggers.push({
                type: 'latency',
                severity: 'hard',
                reason: `Latency ${metrics.avgLatency}ms exceeds hard threshold ${this.thresholds.latencyMs * 1.5}ms`,
            });
        } else if (metrics.avgLatency > this.thresholds.latencyMs) {
            triggers.push({
                type: 'latency',
                severity: 'soft',
                reason: `Latency ${metrics.avgLatency}ms exceeds threshold ${this.thresholds.latencyMs}ms`,
            });
        }

        const per1kCost =
            (metrics.costPerRequest / Math.max(1, metrics.avgTokensPerRequest)) * 1000;
        if (per1kCost > this.thresholds.costPer1kTokens * 2) {
            triggers.push({
                type: 'cost',
                severity: 'hard',
                reason: `Cost $${metrics.costPerRequest.toFixed(4)}/req exceeds hard threshold`,
            });
        } else if (per1kCost > this.thresholds.costPer1kTokens) {
            triggers.push({
                type: 'cost',
                severity: 'soft',
                reason: `Cost $${metrics.costPerRequest.toFixed(4)}/req exceeds threshold`,
            });
        }

        if (quotaPct > 95) {
            triggers.push({
                type: 'quota',
                severity: 'hard',
                reason: `Quota ${quotaPct.toFixed(0)}% > 95%`,
            });
        } else if (quotaPct > this.thresholds.quotaPct) {
            triggers.push({
                type: 'quota',
                severity: 'soft',
                reason: `Quota ${quotaPct.toFixed(0)}% > ${this.thresholds.quotaPct}%`,
            });
        }

        if (triggers.length === 0) return null;

        const worst = triggers.reduce((a, b) => {
            const w = (s: string) => (s === 'hard' ? 2 : 1);
            return w(a.severity) > w(b.severity) ? a : b;
        });

        const downgraded = this.routingPolicy.getDowngradedModel(model);
        if (!downgraded) return null;

        const hardTriggers = triggers.filter((t) => t.severity === 'hard');
        return {
            currentModel: model,
            targetModel: downgraded,
            reason:
                hardTriggers.length > 0
                    ? hardTriggers.map((t) => t.reason).join('; ')
                    : worst.reason,
            trigger: worst.type,
            severity: worst.severity,
        };
    }

    evaluateWithDeep(
        model: string,
        metrics: ProviderMetrics,
        maxSteps = 3,
    ): DowngradeCandidate | null {
        const candidate = this.evaluate(model, metrics);
        if (candidate && candidate.severity === 'hard') {
            const deeper = this.routingPolicy.getDeepDowngradedModel(model, Math.min(maxSteps, 3));
            if (deeper && deeper !== candidate.targetModel) {
                return { ...candidate, targetModel: deeper, reason: `[deep] ${candidate.reason}` };
            }
        }
        return candidate;
    }
}
