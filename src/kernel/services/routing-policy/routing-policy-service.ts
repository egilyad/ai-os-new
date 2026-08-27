import type { ILifecycle } from '../../contracts/lifecycle';
import type {
    IRoutingPolicy,
    FallbackLink,
    FallbackRecord,
    PenaltyRecord,
    HealthPenaltyInput,
    HealthPenaltyResult,
    RoutingPolicyPreview,
    RoutingPolicyPreviewInput,
    RoutingPolicySnapshot,
} from '../../contracts/routing-policy';
import { CONFIG } from '../config-registry';
import { getRouterConfig } from '../router-config-manager';
import { DowngradeStrategy, type ProviderMetrics } from '../downgrade-strategy';

const MAX_FALLBACK_HISTORY = 200;
const MAX_PENALTY_HISTORY = 200;

export interface RoutingPolicyDeps {
    settingsService: {
        getSettings: () => {
            fallbackChains: Record<string, FallbackLink[]>;
            modelDowngradeChains: Record<string, string[]>;
            slaMode: string;
        };
        updateSettings: (partial: Record<string, unknown>) => void;
    };
    pricingService: {
        getPricingForModel: (model: string) => { input?: number; output?: number } | undefined;
    };
}

export class RoutingPolicyService implements ILifecycle, IRoutingPolicy {
    private downgradeStrategy: DowngradeStrategy;
    private fallbackHistory: FallbackRecord[] = [];
    private penaltyHistory: PenaltyRecord[] = [];
    private deps: RoutingPolicyDeps;

    constructor(deps: RoutingPolicyDeps) {
        this.deps = deps;
        this.downgradeStrategy = new DowngradeStrategy(this);
    }

    async init() {}
    async destroy() {
        this.fallbackHistory = [];
        this.penaltyHistory = [];
    }

    getSnapshot(): RoutingPolicySnapshot {
        const settings = this.deps.settingsService.getSettings();
        const routerScoring = getRouterConfig().scoring;
        const monitoring = CONFIG.monitoring;
        return {
            fallbackChains: this.cloneFallbackChains(settings.fallbackChains || {}),
            modelDowngradeChains: this.cloneDowngradeChains(settings.modelDowngradeChains || {}),
            slaMode: settings.slaMode,
            fallbackHistory: this.getFallbackHistory(),
            penaltyHistory: this.getPenaltyHistory(),
            penaltySettings: {
                latency: { ...routerScoring.latencyPenalty },
                cost: { ...routerScoring.costPenalty },
                budget: {
                    thresholds: getRouterConfig().budgetPenalty.thresholds.map((t) => ({ ...t })),
                },
                health: {
                    latencyThresholdMs: monitoring.latencyPenalty.thresholdMs,
                    errorRateThreshold: monitoring.errorRatePenalty.threshold,
                    successRateFloor: monitoring.successRatePenalty.floor,
                    alertPenaltyPerAlert: monitoring.alertPenalty.perAlert,
                },
            },
        };
    }

    preview(input: RoutingPolicyPreviewInput): RoutingPolicyPreview {
        const penalties: RoutingPolicyPreview['penalties'] = {};
        const issues: string[] = [];
        const fallback = input.failedProvider
            ? this.resolveFallback(input.strategy, input.failedProvider)
            : null;
        const downgradedModel = input.model
            ? input.downgradeSteps && input.downgradeSteps > 1
                ? this.getDeepDowngradedModel(input.model, input.downgradeSteps)
                : this.getDowngradedModel(input.model)
            : null;

        if (input.provider && input.avgLatency !== undefined && input.medianLatency !== undefined) {
            penalties.latency = this.calculateLatencyPenalty(
                input.provider,
                input.avgLatency,
                input.medianLatency,
            );
            if (penalties.latency > 0)
                issues.push(`${input.provider} latency penalty: ${penalties.latency.toFixed(3)}`);
        }
        if (input.model && input.promptLength !== undefined) {
            penalties.cost = this.calculateCostPenalty(input.model, input.promptLength);
            if (penalties.cost > 0)
                issues.push(`${input.model} cost penalty: ${penalties.cost.toFixed(3)}`);
        }
        if (
            input.provider &&
            input.spentThisMonth !== undefined &&
            input.monthlyBudget !== undefined
        ) {
            penalties.budget = this.calculateBudgetPenalty(
                input.provider,
                input.spentThisMonth,
                input.monthlyBudget,
            );
            if (penalties.budget > 0)
                issues.push(`${input.provider} budget penalty: ${penalties.budget.toFixed(3)}`);
        }

        const health = input.health ? this.calculateHealthPenalties(input.health) : null;
        if (health) issues.push(...health.issues);

        return { fallback, downgradedModel, penalties, health, issues };
    }

    getFallbackChain(strategy: string): FallbackLink[] {
        const settings = this.deps.settingsService.getSettings();
        const chains = settings.fallbackChains || {};
        return this.cloneFallbackChain(chains[strategy] || chains.default || []);
    }

    setFallbackChain(strategy: string, chain: FallbackLink[]): void {
        const settings = this.deps.settingsService.getSettings();
        const chains = this.cloneFallbackChains(settings.fallbackChains || {});
        chains[strategy] = this.sanitizeFallbackChain(chain);
        this.deps.settingsService.updateSettings({ fallbackChains: chains });
    }

    resolveFallback(
        strategy: string,
        failedProvider: string,
        _agentId?: string,
    ): FallbackLink | null {
        const chain = this.getFallbackChain(strategy);
        for (const link of chain) {
            if (link.provider.toLowerCase() === failedProvider.toLowerCase()) continue;
            return link;
        }
        return null;
    }

    recordFallbackFailure(provider: string, strategy: string): void {
        this.fallbackHistory.unshift({
            provider,
            strategy,
            timestamp: Date.now(),
            resolved: false,
        });
        if (this.fallbackHistory.length > MAX_FALLBACK_HISTORY) this.fallbackHistory.pop();
    }

    getFallbackHistory(): FallbackRecord[] {
        return [...this.fallbackHistory];
    }

    getDowngradeChain(model: string): string[] {
        const settings = this.deps.settingsService.getSettings();
        const chains = settings.modelDowngradeChains || {};
        return chains[model] || [];
    }

    setDowngradeChain(model: string, chain: string[]): void {
        const settings = this.deps.settingsService.getSettings();
        const chains = this.cloneDowngradeChains(settings.modelDowngradeChains || {});
        chains[model] = chain.map((item) => item.trim()).filter(Boolean);
        this.deps.settingsService.updateSettings({ modelDowngradeChains: chains });
    }

    getDowngradedModel(model: string): string | null {
        const chain = this.getDowngradeChain(model);
        return chain.length > 0 ? chain[0]! : null;
    }

    getDeepDowngradedModel(model: string, steps: number): string | null {
        const chain = this.getDowngradeChain(model);
        if (chain.length === 0) return null;
        const idx = Math.min(steps - 1, chain.length - 1);
        return chain[idx]!;
    }

    calculateLatencyPenalty(
        _providerId: string,
        avgLatency: number,
        medianLatency: number,
    ): number {
        const cfg = getRouterConfig().scoring.latencyPenalty;
        if (medianLatency <= 0 || avgLatency <= medianLatency * cfg.thresholdRatio) return 0;
        return Math.min(cfg.max, (avgLatency / medianLatency - cfg.thresholdRatio) * cfg.slope);
    }

    calculateCostPenalty(model: string, promptLength: number): number {
        const pricing = this.deps.pricingService.getPricingForModel(model);
        if (!pricing) return 0;
        const routerCfg = getRouterConfig();
        const inputTokens = promptLength / (routerCfg.costEstimate?.tokenDivisor || 4);
        const estimatedCost =
            (inputTokens / (routerCfg.costEstimate?.per1kDivisor || 1000)) *
            (pricing.input || 0.0001);
        return estimatedCost * (routerCfg.scoring.costPenalty?.scalar || 100);
    }

    calculateBudgetPenalty(
        _provider: string,
        spentThisMonth: number,
        monthlyBudget: number,
    ): number {
        if (monthlyBudget <= 0) return 0;
        const pct = spentThisMonth / monthlyBudget;
        const thresholds = [...getRouterConfig().budgetPenalty.thresholds].sort(
            (a, b) => b.pct - a.pct,
        );
        for (const t of thresholds) {
            if (pct >= t.pct) return t.penalty;
        }
        return 0;
    }

    calculateHealthPenalties(input: HealthPenaltyInput): HealthPenaltyResult {
        const mCfg = CONFIG.monitoring;
        let score = 1.0;
        const issues: string[] = [];

        if (input.avgLatency > mCfg.latencyPenalty.thresholdMs) {
            const penalty = Math.min(
                mCfg.latencyPenalty.cap,
                (input.avgLatency - mCfg.latencyPenalty.thresholdMs) / mCfg.latencyPenalty.divisor,
            );
            score -= penalty;
            issues.push(`High latency: ${Math.round(input.avgLatency)}ms`);
        }

        if (input.errorRate > mCfg.errorRatePenalty.threshold) {
            const penalty = Math.min(
                mCfg.errorRatePenalty.cap,
                input.errorRate * mCfg.errorRatePenalty.multiplier,
            );
            score -= penalty;
            issues.push(`High error rate: ${(input.errorRate * 100).toFixed(1)}%`);
        }

        if (input.successRate < mCfg.successRatePenalty.floor) {
            score -=
                (mCfg.successRatePenalty.floor - input.successRate) *
                mCfg.successRatePenalty.multiplier;
            issues.push(`Low success rate: ${(input.successRate * 100).toFixed(1)}%`);
        }

        if (input.criticalAlerts > 0) {
            const penalty = Math.min(
                mCfg.alertPenalty.cap,
                input.criticalAlerts * mCfg.alertPenalty.perAlert,
            );
            score -= penalty;
            issues.push(`${input.criticalAlerts} unresolved critical alerts`);
        }

        return { score: Math.max(0, Math.min(1, score)), issues };
    }

    recordPenalty(provider: string, type: PenaltyRecord['type'], amount: number): void {
        this.penaltyHistory.unshift({ provider, type, amount, timestamp: Date.now() });
        if (this.penaltyHistory.length > MAX_PENALTY_HISTORY) this.penaltyHistory.pop();
    }

    getPenaltyHistory(): PenaltyRecord[] {
        return [...this.penaltyHistory];
    }

    getSLAWeights(slaMode: string): { ttft: number; tps: number; reliability: number } {
        const w = getRouterConfig().weights;
        const mapping: Record<string, keyof typeof w> = {
            LOW_LATENCY: 'latency',
            HIGH_QUALITY: 'reliability',
            BALANCED: 'default',
            ECONOMY: 'cost',
            FREE_FIRST: 'freeFirst',
            PERFORMANCE: 'performance',
        };
        const key = mapping[slaMode] || 'default';
        return (w[key] ?? w.default)!;
    }

    smartDowngrade(model: string, metrics: ProviderMetrics) {
        return this.downgradeStrategy.evaluate(model, metrics);
    }

    smartDowngradeDeep(model: string, metrics: ProviderMetrics, maxSteps = 3) {
        return this.downgradeStrategy.evaluateWithDeep(model, metrics, maxSteps);
    }

    private sanitizeFallbackChain(chain: FallbackLink[]): FallbackLink[] {
        return chain
            .map((link) => ({
                provider: link.provider.trim(),
                ...(link.model?.trim() ? { model: link.model.trim() } : {}),
            }))
            .filter((link) => link.provider.length > 0);
    }

    private cloneFallbackChain(chain: FallbackLink[]): FallbackLink[] {
        return chain.map((link) => ({ ...link }));
    }

    private cloneFallbackChains(
        chains: Record<string, FallbackLink[]>,
    ): Record<string, FallbackLink[]> {
        return Object.fromEntries(
            Object.entries(chains).map(([strategy, chain]) => [
                strategy,
                this.cloneFallbackChain(chain),
            ]),
        );
    }

    private cloneDowngradeChains(chains: Record<string, string[]>): Record<string, string[]> {
        return Object.fromEntries(
            Object.entries(chains).map(([model, chain]) => [model, [...chain]]),
        );
    }
}
