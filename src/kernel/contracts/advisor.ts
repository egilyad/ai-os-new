// ── Pressure Engine ────────────────────────────────────────────────────

export type AdvisorPressureLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface ProviderPressure {
    readonly id: string;
    readonly label: string;
    readonly level: AdvisorPressureLevel;
    readonly score: number;
    readonly status: 'healthy' | 'degraded' | 'offline';
    readonly reliability: number;
    readonly quotaPct: number;
    readonly budgetPct: number;
    readonly keysActive: number;
    readonly keysTotal: number;
    readonly latencySignal: number;
    readonly errorRateSignal: number;
    readonly saturation: number;
    readonly avgLatency: number;
    readonly remainingQuota: number;
    readonly remainingBudget: number;
    readonly forecast: 'improving' | 'stable' | 'degrading';
    readonly alertCount: number;
}

export interface GlobalPressure {
    readonly level: AdvisorPressureLevel;
    readonly score: number;
    readonly totalKeys: number;
    readonly activeKeys: number;
    readonly degradedKeys: number;
    readonly totalAlerts: number;
    readonly criticalAlerts: number;
    readonly budgetUsagePct: number;
    readonly budgetRemaining: number;
    readonly totalRequests: number;
    readonly totalCost: number;
}

export interface PressureMapSnapshot {
    readonly timestamp: number;
    readonly global: GlobalPressure;
    readonly providers: ProviderPressure[];
}

export interface IPressureEngine {
    generateSnapshot(): PressureMapSnapshot;
    getLastSnapshot(): PressureMapSnapshot | null;
    getProviderPressure(providerId: string): ProviderPressure | undefined;
    startAutoRefresh(intervalMs?: number): void;
    stopAutoRefresh(): void;
    onUpdate(cb: (snapshot: PressureMapSnapshot) => void): () => void;
}

// ── Diagnostics Engine ─────────────────────────────────────────────────

export type DiagnosticCategory = 'auth' | 'quota' | 'latency' | 'reliability' | 'usage';
export type DiagnosticSeverity = 'info' | 'warning' | 'critical';

export interface DiagnosticFinding {
    readonly severity: DiagnosticSeverity;
    readonly category: DiagnosticCategory;
    readonly message: string;
    readonly explanation: string;
    readonly suggestion: string;
    readonly metric?: string;
    readonly timestamp: number;
}

export interface ProviderDiagnostic {
    readonly provider: string;
    readonly error: string;
    readonly title: string;
    readonly description: string;
    readonly impact: 'high' | 'medium' | 'low';
    readonly findings: DiagnosticFinding[];
    readonly healthScore: number;
}

export interface IDiagnosticsEngine {
    analyzeProviderError(provider: string, error: string): ProviderDiagnostic;
    analyzeKey(keyId: string): DiagnosticFinding[];
    generateSummary(findings: DiagnosticFinding[]): string;
    getHealthScore(findings: DiagnosticFinding[]): number;
}

// ── What-If Engine ─────────────────────────────────────────────────────

export interface WhatIfScenario {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly type:
        'add_key' | 'switch_provider' | 'change_strategy' | 'add_budget' | 'shift_workload';
    readonly impact: {
        readonly dailyLimitIncrease: number;
        readonly costChange: number;
        readonly probability429Reduction: number;
        readonly latencyImpact: string;
    };
}

export interface RuntimeScenario {
    readonly scenario: string;
    readonly improvement: string;
    readonly details: string;
    readonly impact: 'high' | 'medium' | 'low';
}

export interface IWhatIfEngine {
    analyzeAddKey(provider: string): WhatIfScenario;
    analyzeSwitchProvider(fromProvider: string, toProvider: string): WhatIfScenario;
    analyzeBudgetChange(currentBudget: number, newBudget: number): WhatIfScenario;
    getRuntimeScenarios(): RuntimeScenario[];
    getPromptCachingAdvice(): {
        cacheable: boolean;
        reuseCount: number;
        estimatedSavings: string;
        details: string;
    } | null;
}

// ── Insight Engine ─────────────────────────────────────────────────────

export interface LLMAnalysisResult {
    suggestions: Array<{
        type: 'latency' | 'cost' | 'accuracy' | 'security';
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
    }>;
    bottlenecks: string[];
    recommendations: string[];
}

export interface IInsightEngine {
    analyzeTraces(traces: unknown[]): void;
    analyzeKernelState(state: unknown): void;
    generateLLMAnalysis(): Promise<LLMAnalysisResult | null>;
    getMetrics(): AdvisorMetrics;
}

export interface AdvisorMetrics {
    avgLatency: number;
    errorRate: number;
    costPerRequest: number;
    providerReliability: Record<string, number>;
    bottleneckNodes: string[];
}

export interface AdvisorConfig {
    enableAutoFix: boolean;
    latencyThreshold: number;
    costThreshold: number;
    minConfidence: number;
    analysisIntervalMs: number;
}

// ── Optimization Engine (existing) ─────────────────────────────────────

export type SuggestionType = 'latency' | 'accuracy' | 'cost' | 'topology' | 'security';
export type SuggestionImpact = 'high' | 'medium' | 'low';

export interface ProposedChange {
    routing_update?: string;
    disable_providers?: string[];
    queue_delay?: number;
    add_guardrail?: string;
    switch_provider?: string;
    verify_keys?: string[];
    add_redundant_keys?: boolean;
    optimize_nodes?: string[];
    prefer_providers?: string[];
    topology_update?: string;
    add_node?: string;
    tier_switch?: string;
    switch_to?: string;
}

export interface OptimizationSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    impact: SuggestionImpact;
    targetNodeId?: string;
    proposedChange?: ProposedChange;
    autoExecutable?: boolean;
    estimatedSavings?: { latency?: number; cost?: number };
    bottleneckNodes?: string[];
    effectiveness?: {
        improved: boolean;
        measuredAt: number;
        metricBefore: number;
        metricAfter: number;
    };
}

export interface SREAlert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
}

export interface IOptimizationEngine {
    propose(suggestion: Omit<OptimizationSuggestion, 'id'>): void;
    executeFix(suggestionId: string): void;
    dismissSuggestion(suggestionId: string): void;
    getSuggestions(): OptimizationSuggestion[];
    getSREAlerts(): SREAlert[];
    triggerAnalysis(): void;
}
