import type {
    CostSummary,
    CostRecommendation,
    ProviderCost,
    ModelCost,
} from '../contracts/cost-optimization-types';
import type { IProviderTracker } from './provider-tracker';
import type { PricingService } from './pricing-service';

const CHEAPER_MAP: Record<string, Array<{ model: string; provider: string; savings: string }>> = {
    'llama-3.3-70b-versatile': [
        { model: 'llama-3.1-8b-instant', provider: 'groq', savings: '~85%' },
    ],
    'llama-3-70b': [{ model: 'llama-3.1-8b-instant', provider: 'groq', savings: '~85%' }],
    'llama-3.1-405b': [{ model: 'llama-3.3-70b', provider: 'meta', savings: '~90%' }],
    'mixtral-8x7b': [{ model: 'llama-3.1-8b-instant', provider: 'groq', savings: '~80%' }],
    'gpt-4o': [{ model: 'gpt-4o-mini', provider: 'openai', savings: '~94%' }],
    'claude-3-opus': [{ model: 'claude-3-5-sonnet', provider: 'anthropic', savings: '~80%' }],
    'claude-3-5-sonnet': [{ model: 'claude-3-haiku', provider: 'anthropic', savings: '~92%' }],
    'gemini-3.1-pro': [{ model: 'gemini-3.1-flash-lite', provider: 'google', savings: '~97%' }],
};

let _tracker: IProviderTracker | null = null;
let _pricing: PricingService | null = null;
const _dismissed = new Set<string>();

export function initCostOptimization(tracker: IProviderTracker, pricing: PricingService): void {
    _tracker = tracker;
    _pricing = pricing;
}

export async function getSummary(period: '7d' | '30d' | 'all' = '30d'): Promise<CostSummary> {
    if (!_tracker || !_pricing)
        return { totalSpend: 0, totalRequests: 0, providerCosts: [], modelCosts: [], period };

    const rankings = _tracker.getProviderRankings();

    const providerCosts: ProviderCost[] = rankings
        .filter((r) => r.requests > 0)
        .map((r) => ({
            provider: r.provider,
            requests: r.requests,
            totalCost: r.costPerRequest * r.requests,
            avgCostPerRequest: r.costPerRequest,
            avgLatency: r.avgLatency,
            reliability: r.reliability,
            recommendation: r.recommendation,
        }));

    const totalSpend = providerCosts.reduce((s, p) => s + p.totalCost, 0);
    const totalRequests = providerCosts.reduce((s, p) => s + p.requests, 0);

    const modelCosts: ModelCost[] = [];
    const allPrices = _pricing.getAllPrices();
    const modelSeen = new Set<string>();
    for (const ranking of rankings) {
        for (const [model, price] of Object.entries(allPrices)) {
            const key = `${ranking.provider}:${model}`;
            if (modelSeen.has(key)) continue;
            if ((price.provider || '').toLowerCase() === ranking.provider) {
                modelSeen.add(key);
                modelCosts.push({
                    model,
                    provider: ranking.provider,
                    requests: ranking.requests,
                    totalCost: ranking.costPerRequest * ranking.requests,
                    avgCostPerRequest: ranking.costPerRequest,
                    inputPrice: price.input,
                    outputPrice: price.output,
                });
            }
        }
    }
    modelCosts.sort((a, b) => b.totalCost - a.totalCost);

    return { totalSpend, totalRequests, providerCosts, modelCosts, period };
}

export async function getRecommendations(): Promise<CostRecommendation[]> {
    if (!_tracker || !_pricing) return [];

    const rankings = _tracker.getProviderRankings();
    const recs: CostRecommendation[] = [];
    let id = 0;

    // Cheaper alternatives — iterate over PRICING models, not provider rankings
    // CHEAPER_MAP is keyed by model name; find providers that use each model
    const seenProvider = new Set<string>();
    const allPrices = _pricing.getAllPrices();
    for (const [model, price] of Object.entries(allPrices)) {
        const cheaper = CHEAPER_MAP[model];
        if (!cheaper || cheaper.length === 0) continue;
        const alt = cheaper[0]!;
        const provider = (price.provider || '').toLowerCase();
        if (!provider || seenProvider.has(provider) || _dismissed.has(`alt-${provider}`)) continue;
        const ranking = rankings.find((r) => r.provider.toLowerCase() === provider);
        if (!ranking || ranking.requests === 0) continue;
        seenProvider.add(provider);
        recs.push({
            id: `cost-opt-${++id}`,
            type: 'cheaper_alternative',
            title: `Switch from ${model} to ${alt.model}`,
            description: `${provider} costs $${ranking.costPerRequest.toFixed(4)}/req via ${model}. ${alt.model} on ${alt.provider} costs significantly less (${alt.savings}).`,
            potentialSavings: ranking.costPerRequest * ranking.requests * 0.8,
            provider,
            suggestedModel: alt.model,
            suggestedProvider: alt.provider,
            severity: ranking.costPerRequest > 0.01 ? 'high' : 'medium',
            action: `Consider switching from ${model} to ${alt.model} on ${alt.provider}.`,
        });
    }

    // Overpriced
    const sorted = [...rankings]
        .filter((r) => r.requests > 5)
        .sort((a, b) => b.costPerRequest - a.costPerRequest);
    if (sorted.length >= 2) {
        const expensive = sorted[0]!;
        const cheap = sorted[sorted.length - 1]!;
        if (
            expensive.costPerRequest > cheap.costPerRequest * 3 &&
            !_dismissed.has(`over-${expensive.provider}`)
        ) {
            recs.push({
                id: `cost-opt-${++id}`,
                type: 'overpriced',
                title: `${expensive.provider} is ${(expensive.costPerRequest / cheap.costPerRequest).toFixed(1)}x more expensive than ${cheap.provider}`,
                description: `${expensive.provider}: $${expensive.costPerRequest.toFixed(4)}/req vs ${cheap.provider}: $${cheap.costPerRequest.toFixed(4)}/req`,
                potentialSavings:
                    (expensive.costPerRequest - cheap.costPerRequest) * expensive.requests,
                provider: expensive.provider,
                severity: 'high',
                action: `Review ${expensive.provider} usage and consider routing more to ${cheap.provider}.`,
            });
        }
    }

    // Unused keys
    for (const r of rankings) {
        if (r.requests === 0 && r.installed && !_dismissed.has(`unused-${r.provider}`)) {
            recs.push({
                id: `cost-opt-${++id}`,
                type: 'unused_key',
                title: `${r.provider} key has zero usage`,
                description: `The ${r.provider} key is installed but never used.`,
                provider: r.provider,
                severity: 'low',
                action: `Remove ${r.provider} key or configure routing to use it.`,
            });
        }
    }

    return recs;
}

const DISMISSED_MAX = 1000;

export async function dismissRecommendation(id: string): Promise<void> {
    if (_dismissed.size >= DISMISSED_MAX) {
        const first = _dismissed.values().next();
        if (first.value) _dismissed.delete(first.value);
    }
    _dismissed.add(id);
}
