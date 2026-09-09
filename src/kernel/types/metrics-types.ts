export type { KeyState } from '../contracts/key-state';

export type SLAMode = 'LOW_LATENCY' | 'HIGH_QUALITY' | 'BALANCED' | 'ECONOMY' | 'FREE_FIRST';

export interface LatencyBreakdown {
    dns?: number;
    tls?: number;
    connect?: number;
    ttfb?: number;
    ttft: number;
    total: number;
    tokensPerSec: number;
}

export interface BehavioralRules {
    maxConcurrentRequests: number;
    retryPolicy: {
        maxAttempts: number;
        backoffMs: number;
    };
    timeoutMs: number;
    quota: {
        tokensPerDay: number;
        requestsPerDay: number;
        tokensPerMonth?: number;
        monthlyBudget?: number;
    };
}

export interface ProviderAlert {
    id: string;
    keyId?: string;
    type:
        | 'quota_warning'
        | 'quota_exceeded'
        | 'latency_burst'
        | 'error_rate'
        | 'security'
        | 'compromise';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    resolved: boolean;
}

export interface LearningLayer {
    specialization: string[];
    performanceByTask: Record<string, number>;
    taskMatrix: Record<
        string,
        {
            winRate: number;
            avgLatency: number;
            qualityScore: number;
            requestCount: number;
            p95Latency?: number;
        }
    >;
    advisorInsights: {
        recommendedFor: string[];
        avoidFor: string[];
        confidence: number;
    };
    lastFiveResults: {
        task: string;
        score: number;
        timestamp: number;
        traceId: string;
        experimentId?: string;
    }[];
}

export interface TraceEntry {
    requestId: string;
    traceId: string;
    taskType: string;
    strategy: string;
    model: string;
    status: 'ok' | 'degraded' | 'fail';
    timestamp: number;
    region?: string;
    clientType?: string;
    experimentId?: string;
    cost?: number;
}

export interface ErrorBreakdown {
    soft?: number;
    hard?: number;
    model?: number;
    provider?: number;
    rateLimit?: number;
    timeout?: number;
    serverError?: number;
    validationError?: number;
    other?: number;
}

export interface QualityMetrics {
    score: number;
    hallucinationProbability?: number;
    semanticDrift: number;
    instructionFollowing: number;
    structureConsistency: number;
}

export interface StreamingMetrics {
    chunkStability?: number;
    streamGaps?: number;
    realtimeTokensPerSec?: number;
    avgChunkLatency?: number;
    maxChunkGap?: number;
    jitter?: number;
}

export interface KeyNote {
    id: string;
    keyId: string;
    text: string;
    timestamp: number;
    type: 'admin' | 'system' | 'ai';
    author?: string;
}

export interface KeyHistoryEntry {
    id: string;
    timestamp: number;
    action:
        | 'added'
        | 'probed'
        | 'quota_exceeded'
        | 'error'
        | 'rotated'
        | 'status_changed'
        | 'latency_burst'
        | 'reputation_changed'
        | 'note_added';
    detail: string;
}

export interface RotationConfig {
    ttlHours: number;
    autoRotate: boolean;
    notifyBefore: string;
    lastRotated?: string;
    expiresAt?: string;
}

export interface RotationEvent {
    id: string;
    keyId: string;
    timestamp: number;
    type: 'manual' | 'auto' | 'ttl_expired';
    fromStatus: string;
    toStatus: string;
    oldKeyRef?: string;
    newKeyRef?: string;
    result: 'success' | 'failed';
    error?: string;
}

export interface ApiKey {
    id: string;
    provider: string;
    key: string;
    group?: string;
    account?: string;
    accountId?: string;
    label: string;
    model?: string;
    tags?: string[];
    history?: KeyHistoryEntry[];
    status:
        | 'active'
        | 'inactive'
        | 'error'
        | 'checking'
        | 'pending'
        | 'quota_exhausted'
        | 'invalid'
        | 'duplicate'
        | 'quarantined'
        | 'probation'
        | 'compromised';
    /** Monotonically incremented on every user-initiated status toggle.
     *  Health checks capture the version at start and skip the status update
     *  if the version changed — prevents TOCTOU race between user toggle and
     *  concurrent health check completion. */
    statusVersion?: number;
    latency?: number;
    availableModels?: string[];
    notes?: KeyNote[];
    isEncrypted?: boolean;
    fingerprint?: string;
    secretRef?: string;
    rotationConfig?: RotationConfig;
    rotationHistory?: RotationEvent[];
    settings?: Record<string, unknown>;
    alerts?: string[];
    quota?: Record<string, unknown>;
    priority?: number;
    expiresAt?: number;
    createdAt?: number;
    lastUsed?: number | null;
    maxBudget?: number | null;
    monthlySpend?: number;
    stats: {
        successCount: number;
        errorCount: number;
        totalTokens: number;
        avgLatency: number;
        minLatency: number;
        maxLatency: number;
        lastModel?: string;
        lastError?: {
            message: string;
            timestamp: string;
        };
        extended?: KeyExtendedStats;
    };
}

export interface KeyExtendedStats {
    latencyBreakdown?: LatencyBreakdown;
    coldStartLatency: number;
    warmStartLatency: number;
    throughputHistory: {
        timestamp: number;
        latency: number;
        tokens: number;
        tps?: number;
    }[];
    errorBreakdown: ErrorBreakdown;
    stabilityIndex: number;
    retryImpactScore: number;
    rateLimitPressure: number;
    keyAgeScore: number;
    estimatedCost: number;
    tokenEfficiency: number;
    quality: QualityMetrics;
    contextUtilization: number;
    retentionCurve: number[];
    streaming: StreamingMetrics;
    userPreferenceScore: number;
    manualSwitches: number;
    cancellations: number;
    reputationScore: number;
    stabilityForecast: 'improving' | 'stable' | 'degrading';
    fingerprint: string;
    state: string;
    activeSLA: SLAMode;
    traces: TraceEntry[];
    fourSignals: {
        latency: number;
        throughput: number;
        errorRate: number;
        saturation: number;
    };
    rules: BehavioralRules & {
        slaThresholds: {
            latencyP95: number;
            errorFloor: number;
        };
    };
    learning: LearningLayer;
    currentConcurrentRequests: number;
    usageToday: {
        tokens: number;
        weightedTokens: number;
        requests: number;
        estimatedCost: number;
    };
    usageMonthly: {
        tokens: number;
        requests: number;
        estimatedCost: number;
    };
    alerts: ProviderAlert[];
    lastUsageDate?: string;
    hourlyUsage: number[];
}

export type StabilityForecast = 'improving' | 'stable' | 'degrading';

export interface RouterWeights {
    ttft: number;
    tps: number;
    reliability: number;
}

export interface ProviderState {
    id: string;
    avgTTFT: number;
    avgTPS: number;
    reliability: number;
    stabilityIndex: number;
    reputationScore: number;
    totalRequests: number;
    estimatedCost?: number;
    selectionRate: number;
    errorCount?: number;
    totalTokens?: number;
    currentConcurrent?: number;
    status: 'healthy' | 'degraded' | 'offline' | 'unknown';
}

export type ProviderMetrics = ProviderState;

export interface RuntimeAggregate {
    totalActive: number;
    totalDead: number;
    totalBackoff: number;
    totalIdle: number;
    globalErrorRate: number;
    globalLoadFactor: number;
    lastUpdated: number;
}

export interface BudgetAggregate {
    totalCost: number;
    totalTokens: number;
    totalSessions: number;
    activeSessions: number;
    exhausted: boolean;
    lastUpdated: number;
}

export interface SystemState {
    providers: Record<string, ProviderState>;
    weights: {
        base: RouterWeights;
        adaptiveDelta: RouterWeights;
        effective: RouterWeights;
    };
    decisions: DecisionTrace[];
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
    explorationFactor: number;
    violations: string[];
    activeSLA: SLAMode;
    history: { timestamp: number; ttft: number; tps: number; reliability: number }[];
    runtime?: RuntimeAggregate;
    budget?: BudgetAggregate;
}

export interface DecisionTrace {
    requestId: string;
    strategy: string;
    classification?: {
        complexity: 'simple' | 'medium' | 'complex';
        isCode: boolean;
        isLong: boolean;
        isMultimodal: boolean;
        intent?: string;
        language?: string;
    };
    weights: RouterWeights;
    selected: string;
    secondBest: string | null;
    scores: Array<{ p: string; s: string; c?: ScoringComponents }>;
    skipped?: SkippedEntryFull[];
    timestamp: number;
    profile?: string;
    isExperiment?: boolean;
}

export interface ScoringComponents {
    raw: number;
    stabilityBonus: number;
    reputationBonus: number;
    explorationBonus: number;
    keyReputationBonus: number;
    affinityBonus: number;
    priorityBonus: number;
    costPenalty: number;
    latencyPenalty: number;
    budgetPenalty: number;
}

export interface SkippedEntryFull {
    provider: string;
    keyLabel: string;
    keyId?: string;
    reason: string;
    stage: string;
}
