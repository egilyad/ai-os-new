import { PROVIDER_DEFAULT_MODELS } from '../utils/provider-default-models';
import type {
    SmartRoutingConfig,
    RoutingRule,
    RoutingDecision,
    ISmartRoutingService,
} from '../contracts/smart-routing';
import type { IProviderTracker } from '../types/interfaces';
import type { ICostCalculator } from '../contracts/pricing';

const DEFAULT_CONFIG: SmartRoutingConfig = {
    defaultProvider: 'openrouter',
    defaultModel: PROVIDER_DEFAULT_MODELS.openai ?? 'gpt-4o',
    rules: [],
    enableAutoRouting: true,
    enableFallback: true,
    maxFallbackDepth: 3,
    latencyThreshold: 2000,
    costOptimization: 'balanced',
};

let nextId = 1;

export interface SmartRoutingServiceDeps {
    providerTracker: IProviderTracker;
    pricingService: ICostCalculator;
}

/**
 * SmartRoutingService — WHAT-IF ROUTING SIMULATOR (NOT authoritative for execution).
 *
 * B-21 design decision: this service is a self-contained, in-memory simulator used by
 * `SmartRoutingPanel` to preview the effect of routing rules. It is intentionally
 * DISCONNECTED from live routing — real execution (chat-executor, debate-query-engine,
 * cognitive, advisor, temporal-replay, counterfactual) resolves providers exclusively
 * through `RouterService.getRankedProviders(...)`. `RouterService` is the single source
 * of truth for routing; its authoritative rule surface is `config.semanticRouteRules`
 * (consulted via `trySelectProvider` → `matchSemanticRule`) plus `routingPolicyService`.
 *
 * Rules added here do NOT change live routing. Treat `simulateRouting`/`getRules` as a
 * planning tool only. Do not wire these rules into the execution path; if real rule
 * editing is ever required, edit `RouterService`/`routingPolicyService` instead.
 */
export class SmartRoutingService implements ISmartRoutingService {
    private config: SmartRoutingConfig = { ...DEFAULT_CONFIG };
    private rules: RoutingRule[] = [];
    private decisionHistory: RoutingDecision[] = [];
    private deps: SmartRoutingServiceDeps;

    constructor(deps: SmartRoutingServiceDeps) {
        this.deps = deps;
    }

    getConfig(): SmartRoutingConfig {
        return { ...this.config };
    }

    updateConfig(updates: Partial<SmartRoutingConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    getRules(): RoutingRule[] {
        return [...this.rules].sort((a, b) => a.priority - b.priority);
    }

    addRule(rule: Omit<RoutingRule, 'id' | 'createdAt' | 'updatedAt'>): RoutingRule {
        const now = Date.now();
        const newRule: RoutingRule = {
            ...rule,
            id: `rule-${nextId++}-${now}`,
            createdAt: now,
            updatedAt: now,
        };
        this.rules.push(newRule);
        return newRule;
    }

    updateRule(id: string, updates: Partial<RoutingRule>): RoutingRule | null {
        const idx = this.rules.findIndex((r) => r.id === id);
        if (idx === -1) return null;
        this.rules[idx] = { ...this.rules[idx]!, ...updates, updatedAt: Date.now() };
        return this.rules[idx]!;
    }

    deleteRule(id: string): boolean {
        const idx = this.rules.findIndex((r) => r.id === id);
        if (idx === -1) return false;
        this.rules.splice(idx, 1);
        return true;
    }

    reorderRules(fromIndex: number, toIndex: number): void {
        const sorted = this.getRules();
        const [moved] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, moved!);
        sorted.forEach((r, i) => {
            const found = this.rules.find((x) => x.id === r.id);
            if (found) found.priority = i;
        });
    }

    private getAvgLatency(prov: string): number {
        const keys = this.deps.providerTracker.getProviderRankings();
        const p = keys.find((k) => k.provider.toLowerCase() === prov.toLowerCase());
        return p?.avgLatency ?? 200;
    }

    private getEstimatedCost(_provider: string, model: string): number {
        try {
            return this.deps.pricingService.estimateCost(model, 500);
        } catch {
            return 0.001;
        }
    }

    simulateRouting(request: {
        model?: string;
        provider?: string;
        maxLatency?: number;
        maxCost?: number;
    }): RoutingDecision {
        const matchedConditions: string[] = [];

        for (const rule of this.getRules()) {
            if (!rule.enabled) continue;
            const allMatch = rule.conditions.every((c) => {
                const match = this.evaluateCondition(c, request);
                if (match) matchedConditions.push(`${c.type}:${c.value}`);
                return match;
            });
            if (allMatch) {
                return {
                    ruleId: rule.id,
                    selectedProvider: rule.targetProvider,
                    selectedModel: rule.targetModel ?? this.config.defaultModel,
                    fallbackUsed: false,
                    latency: this.getAvgLatency(rule.targetProvider),
                    estimatedCost: this.getEstimatedCost(
                        rule.targetProvider,
                        rule.targetModel ?? this.config.defaultModel,
                    ),
                    matchedConditions,
                    timestamp: Date.now(),
                };
            }
        }

        const prov = request.provider || this.config.defaultProvider;
        const model = request.model || this.config.defaultModel;
        const decision: RoutingDecision = {
            ruleId: null,
            selectedProvider: prov,
            selectedModel: model,
            fallbackUsed: false,
            latency: this.getAvgLatency(prov),
            estimatedCost: this.getEstimatedCost(prov, model),
            matchedConditions,
            timestamp: Date.now(),
        };

        this.decisionHistory.push(decision);
        if (this.decisionHistory.length > 100) this.decisionHistory.shift();
        return decision;
    }

    getDecisionHistory(): RoutingDecision[] {
        return [...this.decisionHistory];
    }

    clearHistory(): void {
        this.decisionHistory = [];
    }

    private evaluateCondition(
        c: { type: string; value: string | number },
        req: { model?: string; provider?: string; maxLatency?: number; maxCost?: number },
    ): boolean {
        switch (c.type) {
            case 'model_match':
                return req.model === c.value;
            case 'provider_match':
                return req.provider === c.value;
            case 'max_latency':
                if (req.maxLatency === undefined) return true;
                return req.maxLatency <= Number(c.value);
            case 'max_cost':
                if (req.maxCost === undefined) return true;
                return req.maxCost <= Number(c.value);
            default:
                return true;
        }
    }
}
