export interface KeyUsageSummary {
    totalKeys: number;
    activeKeys: number;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    topProvider: string;
}

export interface ProviderUsageBreakdown {
    provider: string;
    requestCount: number;
    tokenCount: number;
    cost: number;
    avgLatency: number;
    errorRate: number;
}

export interface UsageTrend {
    date: string;
    requests: number;
    tokens: number;
    cost: number;
}

export interface IKeyUsageAnalyticsService {
    getSummary(): KeyUsageSummary;
    getProviderBreakdown(): ProviderUsageBreakdown[];
    getTrends(days?: number): UsageTrend[];
}
