import type { ApiKey, RouterWeights, SystemState } from '../types/metrics-types';
import type { RouterConfig, ScoringConfig, WeightProfile } from '../types/routing-types';
import type { RequestClassification, RoutingStrategy } from './router-types';

export function normalizeWeights(w: RouterWeights): RouterWeights {
    const sum = Math.max(0.01, w.ttft + w.tps + w.reliability);
    return { ttft: w.ttft / sum, tps: w.tps / sum, reliability: w.reliability / sum };
}

export function getEffectiveWeights(
    strategy: RoutingStrategy,
    prompt: string,
    state: SystemState,
    profile: WeightProfile,
): RouterWeights {
    const isLong = prompt.length > 800;
    const isShort = prompt.length < 100;
    const adj = profile.autoDynamicAdjustment;

    if (strategy !== 'auto') {
        const sw = profile.strategyWeights[strategy as keyof typeof profile.strategyWeights];
        if (sw) return sw;
    }

    const w = { ...state.weights.effective };

    if (isShort) {
        w.ttft += adj.short.ttftDelta;
        w.tps += adj.short.tpsDelta;
        w.reliability += adj.short.reliabilityDelta;
    }
    if (isLong) {
        w.ttft += adj.long.ttftDelta;
        w.tps += adj.long.tpsDelta;
        w.reliability += adj.long.reliabilityDelta;
    }

    if (strategy === 'auto') {
        w.reliability += 0.1;
    }

    return normalizeWeights(w);
}

export function calculateProviderScore(
    providerId: string,
    state: SystemState,
    weights: RouterWeights,
    scoring: ScoringConfig,
): number {
    const m = state.providers[providerId];
    if (!m) return 0.2;
    if (m.reliability < scoring.reliability.floor || m.status === 'offline') return 0;

    const ttftScore = Math.max(0, 1 - m.avgTTFT / scoring.ttft.maxMs);
    const tpsScore = Math.min(1, m.avgTPS / scoring.tps.max);
    const stabilityBonus = (m.stabilityIndex || 1.0) * scoring.stabilityBonus;
    const reputationBonus = ((m.reputationScore || 100) / 100) * scoring.reputationBonus;

    return (
        m.reliability * weights.reliability +
        ttftScore * weights.ttft +
        tpsScore * weights.tps +
        stabilityBonus +
        reputationBonus
    );
}

export function getContentAffinity(
    affinity: RouterConfig['affinity'],
    providerId: string,
    cls: RequestClassification,
    prompt: string,
): number {
    const len = prompt.length;
    let bonus = 0;
    if (cls.isMultimodal) bonus += affinity.multimodal[providerId] || 0;
    if (cls.isCode) bonus += affinity.code[providerId] || 0;
    if (len > affinity.longPrompt.minLength) bonus += affinity.longPrompt.values[providerId] || 0;
    else if (len < affinity.shortPrompt.maxLength)
        bonus += affinity.shortPrompt.values[providerId] || 0;
    if (cls.complexity === 'complex') bonus += affinity.complexity.complex[providerId] || 0;
    else if (cls.complexity === 'simple') bonus += affinity.complexity.simple[providerId] || 0;
    return bonus;
}

export function estimateRequestCost(
    key: ApiKey,
    prompt: string,
    getPricingForModel: (model: string) => { input?: number; output?: number } | undefined,
    outputInputRatio = 2,
): number {
    const model = key.model || 'auto';
    const pricing = getPricingForModel(model);
    if (!pricing) return 0;
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(inputTokens * outputInputRatio);
    return (
        (inputTokens / 1_000_000) * (pricing.input || 0.0001) +
        (outputTokens / 1_000_000) * (pricing.output || 0.0001)
    );
}
