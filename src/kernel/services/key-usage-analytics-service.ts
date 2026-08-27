import type {
    IKeyUsageAnalyticsService,
    KeyUsageSummary,
    ProviderUsageBreakdown,
    UsageTrend,
} from '../contracts/key-usage-analytics';
import type { KeyState } from '../contracts/key-state';
import type { ProviderRanking } from './provider-tracker';

export interface KeyUsageAnalyticsDeps {
    keyStateStore: {
        getAll(): KeyState[];
    };
    providerTracker: {
        getProviderRankings(catalogProviders?: string[]): ProviderRanking[];
    };
}

export class KeyUsageAnalyticsService implements IKeyUsageAnalyticsService {
    private deps: KeyUsageAnalyticsDeps;

    constructor(deps: KeyUsageAnalyticsDeps) {
        this.deps = deps;
    }

    getSummary(): KeyUsageSummary {
        const allKeys = this.deps.keyStateStore.getAll();
        const rankings = this.deps.providerTracker.getProviderRankings();

        const totalKeys = allKeys.length;
        const activeKeys = allKeys.filter(
            (k) => k.status === 'ready' || k.status === 'limited',
        ).length;

        let totalRequests = 0;
        let totalCost = 0;
        let totalTokens = 0;
        let totalLatencyMs = 0;
        let providersWithData = 0;
        let topProvider = '';
        let maxRequests = 0;

        // H-170: Use real token counts from keyStateStore instead of fabricated formula
        for (const k of allKeys) {
            totalTokens += k.quota.usedTokens || 0;
            totalRequests += k.quota.usedRequests || 0;
        }

        for (const r of rankings) {
            const cost = r.requests * r.costPerRequest;
            totalCost += cost;
            if (r.requests > 0) {
                totalLatencyMs += r.avgLatency;
                providersWithData++;
            }
            if (r.requests > maxRequests) {
                maxRequests = r.requests;
                topProvider = r.provider;
            }
        }

        const avgLatency =
            providersWithData > 0 ? Math.round(totalLatencyMs / providersWithData) : 0;

        return {
            totalKeys,
            activeKeys,
            totalRequests,
            totalTokens,
            totalCost: Math.round(totalCost * 100) / 100,
            avgLatency,
            topProvider: topProvider || '—',
        };
    }

    getProviderBreakdown(): ProviderUsageBreakdown[] {
        const allKeys = this.deps.keyStateStore.getAll();
        const rankings = this.deps.providerTracker.getProviderRankings();
        const breakdown: ProviderUsageBreakdown[] = [];

        // H-170: Group real token counts by provider
        const providerTokens: Record<string, number> = {};
        for (const k of allKeys) {
            const p = k.provider.toLowerCase();
            providerTokens[p] = (providerTokens[p] || 0) + (k.quota.usedTokens || 0);
        }

        for (const r of rankings) {
            if (r.requests === 0) continue;
            breakdown.push({
                provider: r.provider,
                requestCount: r.requests,
                tokenCount: providerTokens[r.provider] || 0,
                cost: Math.round(r.requests * r.costPerRequest * 100) / 100,
                avgLatency: r.avgLatency,
                errorRate: Math.round((1 - r.reliability) * 1000) / 10,
            });
        }

        return breakdown.sort((a, b) => b.requestCount - a.requestCount);
    }

    getTrends(days = 7): UsageTrend[] {
        const rankings = this.deps.providerTracker.getProviderRankings();
        const totalRequests = rankings.reduce((s, r) => s + r.requests, 0);
        const totalCost = rankings.reduce((s, r) => s + r.requests * r.costPerRequest, 0);
        const allKeys = this.deps.keyStateStore.getAll();
        const totalTokens = allKeys.reduce((s, k) => s + (k.quota.usedTokens || 0), 0);

        const trends: UsageTrend[] = [];
        const now = Date.now();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now - i * 86400000);
            const weight = days > 0 ? 1 / days : 1;
            trends.push({
                date: date.toISOString().slice(0, 10),
                requests: Math.round(totalRequests * weight),
                tokens: Math.round(totalTokens * weight),
                cost: Math.round(totalCost * weight * 100) / 100,
            });
        }
        return trends;
    }
}
