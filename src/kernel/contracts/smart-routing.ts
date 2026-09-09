export type RoutingConditionType =
    | 'model_match'
    | 'provider_match'
    | 'max_latency'
    | 'max_cost'
    | 'priority_min'
    | 'has_capability';

export interface RoutingCondition {
    type: RoutingConditionType;
    value: string | number;
}

export type FallbackAction = 'skip' | 'retry_other' | 'downgrade' | 'upgrade';

export interface FallbackStep {
    provider: string;
    model?: string;
    action: FallbackAction;
    condition?: RoutingCondition;
}

export interface RoutingRule {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    conditions: RoutingCondition[];
    targetProvider: string;
    targetModel?: string;
    fallbackChain: FallbackStep[];
    createdAt: number;
    updatedAt: number;
}

export interface SmartRoutingConfig {
    defaultProvider: string;
    defaultModel: string;
    rules: RoutingRule[];
    enableAutoRouting: boolean;
    enableFallback: boolean;
    maxFallbackDepth: number;
    latencyThreshold: number;
    costOptimization: 'speed' | 'balanced' | 'cost';
}

export interface RoutingDecision {
    ruleId: string | null;
    selectedProvider: string;
    selectedModel: string;
    fallbackUsed: boolean;
    latency: number;
    estimatedCost: number;
    matchedConditions: string[];
    timestamp: number;
}

/**
 * B-21: `ISmartRoutingService` is a WHAT-IF routing simulator, NOT the authoritative
 * routing store. Live provider selection is owned by `RouterService` (`getRankedProviders`).
 * Rules managed here are simulation-only and are never consulted during execution.
 */
export interface ISmartRoutingService {
    getConfig(): SmartRoutingConfig;
    updateConfig(config: Partial<SmartRoutingConfig>): void;
    getRules(): RoutingRule[];
    addRule(rule: Omit<RoutingRule, 'id' | 'createdAt' | 'updatedAt'>): RoutingRule;
    updateRule(id: string, updates: Partial<RoutingRule>): RoutingRule | null;
    deleteRule(id: string): boolean;
    reorderRules(fromIndex: number, toIndex: number): void;
    simulateRouting(request: {
        model?: string;
        provider?: string;
        maxLatency?: number;
        maxCost?: number;
    }): RoutingDecision;
    getDecisionHistory(): RoutingDecision[];
    clearHistory(): void;
}
