import type { RouterWeights } from './metrics-types';
export type { RouterWeights } from './metrics-types';

export interface StrategyWeightConfig {
    broadcast: RouterWeights;
    performance: RouterWeights;
    reliability: RouterWeights;
    latency: RouterWeights;
    auto: RouterWeights;
    race: RouterWeights;
    cost: RouterWeights;
    content: RouterWeights;
    free_first: RouterWeights;
}

export interface AutoDynamicAdjustment {
    short: { ttftDelta: number; tpsDelta: number; reliabilityDelta: number };
    long: { ttftDelta: number; tpsDelta: number; reliabilityDelta: number };
}

export interface LatencyVarianceBand {
    minVariance: number;
    weights: RouterWeights;
}

export interface ScoringConfig {
    ttft: { maxMs: number };
    tps: { max: number };
    reliability: { floor: number };
    stabilityBonus: number;
    reputationBonus: number;
    keyReputationBonus: number;
    latencyPenalty: { thresholdRatio: number; max: number; slope: number };
    costPenalty: { scalar: number };
}

export interface ClassificationConfig {
    complexThreshold: number;
    mediumThreshold: number;
    longThreshold: number;
    codePatterns: string;
    reasoningPatterns: string;
    multimodalPatterns: string;
}

export interface AffinityConfig {
    multimodal: Record<string, number>;
    code: Record<string, number>;
    longPrompt: { minLength: number; values: Record<string, number> };
    shortPrompt: { maxLength: number; values: Record<string, number> };
    complexity: {
        complex: Record<string, number>;
        simple: Record<string, number>;
    };
}

export interface PriorityBonuses {
    high: Record<string, number>;
    low: Record<string, number>;
}

export interface ProviderComplexityMapping {
    multimodal: { provider: string; model: string };
    long: { provider: string; model: string };
    complexCode: { provider: string; model: string };
    complex: { provider: string; model: string };
    medium: { provider: string; model: string };
    default: { provider: string; model: string };
}

/**
 * A named collection of all tunable routing parameters — strategy weights,
 * scoring coefficients, dynamic adjustments, and latency variance bands.
 * Users can define multiple profiles for A/B testing or environment-specific tuning.
 */
export interface WeightProfile {
    name: string;
    description?: string;
    defaultWeights: RouterWeights;
    strategyWeights: StrategyWeightConfig;
    scoring: ScoringConfig;
    autoDynamicAdjustment: AutoDynamicAdjustment;
    latencyVarianceBands: LatencyVarianceBand[];
}

/**
 * A/B test configuration.
 * When enabled, `splitPercent` of routing requests use the experiment profile
 * while the rest use the control profile. Accumulated metrics allow comparison.
 */
export interface ABTestConfig {
    enabled: boolean;
    controlProfile: string;
    experimentProfile: string;
    splitPercent: number;
    startedAt: number;
    metrics: {
        control: {
            requests: number;
            totalLatency: number;
            successCount: number;
            totalScore: number;
        };
        experiment: {
            requests: number;
            totalLatency: number;
            successCount: number;
            totalScore: number;
        };
    };
    /** Computed averages from raw sums. Fields are read-only views into the raw counters. */
    getAvgLatency?: undefined;
    getSuccessRate?: undefined;
    getAvgScore?: undefined;
}

import type { RequestIntent, RequestLanguage } from '../contracts/provider';

export interface SemanticRouteRule {
    id: string;
    label?: string;
    condition: {
        intents?: RequestIntent[];
        languages?: RequestLanguage[];
        complexities?: Array<'simple' | 'medium' | 'complex'>;
        isCode?: boolean;
        isLong?: boolean;
        isMultimodal?: boolean;
    };
    target: {
        provider: string;
        model?: string;
    };
    priority: number;
}

export interface RouterConfig {
    history: { maxDecisions: number };
    latency: {
        slidingWindowSize: number;
        monitorIntervalMs: number;
        degradationRatio: number;
    };
    activeProfile: string;
    weightProfiles: Record<string, WeightProfile>;
    abTest: ABTestConfig | null;
    classification: ClassificationConfig;
    affinity: AffinityConfig;
    priority: PriorityBonuses;
    providerByComplexity: ProviderComplexityMapping;
    semanticRouteRules?: SemanticRouteRule[];
}
