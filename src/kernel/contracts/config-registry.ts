export interface RouterWeightTriple {
    ttft: number;
    tps: number;
    reliability: number;
}

export interface RouterConfigSection {
    history: { maxDecisions: number };
    latency: { slidingWindowSize: number; monitorIntervalMs: number; degradationRatio: number };
    scoring: {
        ttftMaxMs: number;
        tpsMax: number;
        reliabilityFloor: number;
        stabilityBonus: number;
        reputationBonus: number;
        keyReputationBonus: number;
        latencyPenalty: { thresholdRatio: number; max: number; slope: number };
        costPenalty: { scalar: number };
    };
    classification: {
        shortThreshold: number;
        mediumThreshold: number;
        complexThreshold: number;
        longThreshold: number;
        codePatterns: string;
        reasoningPatterns: string;
        multimodalPatterns: string;
    };
    defaultWeights: RouterWeightTriple;
    strategyWeights: {
        broadcast: RouterWeightTriple;
        performance: RouterWeightTriple;
        reliability: RouterWeightTriple;
        latency: RouterWeightTriple;
        auto: RouterWeightTriple;
        race: RouterWeightTriple;
        cost: RouterWeightTriple;
        content: RouterWeightTriple;
        freeFirst: RouterWeightTriple;
    };
    autoDynamicAdjustment: {
        short: { ttftDelta: number; tpsDelta: number; reliabilityDelta: number };
        long: { ttftDelta: number; tpsDelta: number; reliabilityDelta: number };
    };
    latencyVarianceBands: { minVariance: number; weights: RouterWeightTriple }[];
    weights: Record<string, RouterWeightTriple>;
    decisionHistoryDefaultLimit: number;
    raceCandidateCount: number;
    budgetPenalty: { thresholds: { pct: number; penalty: number }[] };
    costEstimate: { tokenDivisor: number; outputMultiplier: number; per1kDivisor: number };
    activeProfile?: string;
    weightProfiles?: Record<
        string,
        {
            description?: string;
            defaultWeights: RouterWeightTriple;
            strategyWeights: {
                broadcast: RouterWeightTriple;
                performance: RouterWeightTriple;
                reliability: RouterWeightTriple;
                latency: RouterWeightTriple;
                auto: RouterWeightTriple;
                race: RouterWeightTriple;
                cost: RouterWeightTriple;
                content: RouterWeightTriple;
                freeFirst: RouterWeightTriple;
            };
            scoring: {
                ttftMaxMs: number;
                tpsMax: number;
                reliabilityFloor: number;
                stabilityBonus: number;
                reputationBonus: number;
                keyReputationBonus: number;
                latencyPenalty: { thresholdRatio: number; max: number; slope: number };
                costPenalty: { scalar: number };
            };
            autoDynamicAdjustment: {
                short: { ttftDelta: number; tpsDelta: number; reliabilityDelta: number };
                long: { ttftDelta: number; tpsDelta: number; reliabilityDelta: number };
            };
            latencyVarianceBands: { minVariance: number; weights: RouterWeightTriple }[];
        }
    >;
    abTest?: {
        enabled: boolean;
        controlProfile: string;
        experimentProfile: string;
        splitPercent: number;
        startedAt: number;
        metrics: {
            control: {
                requests: number;
                avgLatency: number;
                successRate: number;
                avgScore: number;
            };
            experiment: {
                requests: number;
                avgLatency: number;
                successRate: number;
                avgScore: number;
            };
        };
    } | null;
    affinity: {
        multimodal: Record<string, number>;
        code: Record<string, number>;
        longPrompt: { minLength: number; values: Record<string, number> };
        shortPrompt: { maxLength: number; values: Record<string, number> };
        complexity: { complex: Record<string, number>; simple: Record<string, number> };
    };
    priority: { high: Record<string, number>; low: Record<string, number> };
    providerByComplexity: {
        multimodal: { provider: string; model: string };
        long: { provider: string; model: string };
        complexCode: { provider: string; model: string };
        complex: { provider: string; model: string };
        medium: { provider: string; model: string };
        default: { provider: string; model: string };
    };
}

export interface MonitoringConfigSection {
    healthCheckStaleIntervalMs: number;
    healthThresholds: { healthy: number; degraded: number };
    latencyPenalty: { thresholdMs: number; cap: number; divisor: number };
    errorRatePenalty: { threshold: number; cap: number; multiplier: number };
    successRatePenalty: { floor: number; multiplier: number };
    alertPenalty: { perAlert: number; cap: number };
}

export interface MetricsConfigSection {
    maxHistoryPoints: number;
    autoCaptureIntervalMs: number;
    defaultReportLimit: number;
    defaultThresholds: {
        avgLatency: { warning: number; critical: number };
        errorRate: { warning: number; critical: number };
        successRate: { warning: number; critical: number };
        totalTokens: { warning: number; critical: number };
    };
}

export interface TracesConfigSection {
    maxEntries: number;
    dbLoadLimit: number;
    tokenEstimateDivisor: number;
}

export interface WebhooksConfigSection {
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
    discordContentMaxLength: number;
    discordEmbedDescMaxLength: number;
    providers: string[];
    eventOptions: string[];
}

export interface KeysConfigSection {
    freeTierLimits: Record<string, { requestsPerDay: number; tokensPerDay: number }>;
    defaultRules: {
        maxConcurrentRequests: number;
        retryPolicy: { maxAttempts: number; backoffMs: number };
        timeoutMs: number;
        quota: { tokensPerDay: number; requestsPerDay: number };
        slaThresholds: { latencyP95: number; errorFloor: number };
    };
    healthCheckTimeoutMs: number;
    rateLimitSpikeWindowMs: number;
    rateLimitSpikeThreshold: number;
    initialBackoffMs: number;
    maxBackoffMs: number;
    slaProfiles: Record<string, { timeoutMs: number; latencyP95: number }>;
}

export interface LlmConfigSection {
    retry: { maxRetries: number; baseDelayMs: number };
    circuitBreaker: {
        failureThreshold: number;
        successThreshold: number;
        openTimeoutMs: number;
        halfOpenMaxRequests: number;
    };
    rateLimiter: { maxTokens: number; refillRate: number; refillIntervalMs: number };
    cache: { defaultTTLMs: number; maxEntries: number };
    priorityQueue: { maxConcurrency: number; lowPriorityDelayMs: number; maxQueueSize: number };
    tokenEstimateDivisor: number;
    pricing: Record<string, { inputPer1K: number; outputPer1K: number }>;
    pricingFallback: { inputPer1K: number; outputPer1K: number };
    costRecordMax: number;
    costRecordTrimTo: number;
}

export interface PressureConfigSection {
    levelThresholds: { critical: number; high: number; medium: number; low: number };
    formulaWeights: {
        status: number;
        reliability: number;
        quotaPct: number;
        budgetPct: number;
        errorRate: number;
        saturation: number;
        latencySignal: number;
    };
    autoRefreshIntervalMs: number;
}

export interface PricingConfigSection {
    defaultMonthlyBudget: number;
    cacheTTLMs: number;
    prefixCacheMaxSize: number;
    perTokenDivisor: number;
    costHistoryMax: number;
    defaultEstimatedOutputTokens: number;
}

export interface ServicesConfigSection {
    advisor: {
        latencyThreshold: number;
        costThreshold: number;
        minConfidence: number;
        analysisIntervalMs: number;
    };
    diagnostics: {
        providerErrorHistoryLimit: number;
        recentErrorWindowMs: number;
        escalationRecentCount: number;
        activeKeyScaleTarget: number;
        quotaCriticalPct: number;
        quotaWarningPct: number;
        latencyCriticalMs: number;
        latencyWarningMs: number;
        rateLimitWarningCount: number;
        timeoutCriticalCount: number;
        successRateMinRequests: number;
        successRateCritical: number;
        successRateWarning: number;
    };
    debate: {
        maxRetries: number;
        baseBackoffMs: number;
        maxBackoffMs: number;
        debateTimeoutMs: number;
        largeModelTimeoutMs: number;
        maxDurationMs: number;
        roundDelayMs: number;
        maxTokens: number;
        temperature: number;
        timeoutMs: number;
        timelineMaxEntries: number;
    };
    cache: {
        defaultTTLMs: number;
        maxEntries: number;
    };
    toolExecutor: {
        maxHistory: number;
        defaultTimeoutMs: number;
    };
    sandbox: {
        fetchTimeoutMs: number;
        codeExecutionTimeoutMs: number;
    };
    mcp: {
        safeFetchTimeoutMs: number;
    };
    logger: {
        maxBuffer: number;
        level?: string;
    };
    admin: {
        maxAuditEntries: number;
    };
    timeline: {
        maxEvents: number;
    };
    usageTracker: {
        maxRecords: number;
        debounceMs: number;
    };
    eventRecorder: {
        maxEvents: number;
    };
    policy: {
        maxViolations: number;
    };
    pressureMap: {
        maxTrendHistory: number;
        alertCooldownMs: number;
        alertsBufferSize: number;
    };
    whatif: {
        maxHistory: number;
    };
    keyService: {
        introspectionTimeoutMs: number;
    };
    providerInstance: {
        healthCheckIntervalMs: number;
    };
    memory: {
        semanticEnabled: boolean;
        autoEmbedOnStore: boolean;
        maxEntries: number;
    };
}

export interface FeatureFlagsConfigSection {
    memory: {
        enabled: boolean;
        semantic: boolean;
        ragOnChat: boolean;
        autoStore: boolean;
    };
    debate: {
        runtimeEngine: boolean;
        engineOnly: boolean;
    };
    ui: {
        experimentalVisuals: boolean;
    };
    mockServices: {
        /** Master switch for @deprecated MOCK backends (deploy, fine-tuning, distillation, health-sla).
         *  When disabled, their UI panels render a placeholder instead of simulated data. */
        enabled: boolean;
    };
}

export interface ConfigRegistry {
    version: string;
    buildId: string;
    router: RouterConfigSection;
    monitoring: MonitoringConfigSection;
    metrics: MetricsConfigSection;
    traces: TracesConfigSection;
    webhooks: WebhooksConfigSection;
    keys: KeysConfigSection;
    llm: LlmConfigSection;
    pressure: PressureConfigSection;
    pricing: PricingConfigSection;
    services: ServicesConfigSection;
    storage: StorageConfigSection;
    security: {
        adminToken?: string;
        webhookSecret?: string;
    };
    featureFlags: FeatureFlagsConfigSection;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StorageConfigSection {
    // SQL storage has been removed — Dexie is the only backend
}
