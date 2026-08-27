export interface CostSummary {
    totalSpend: number;
    totalRequests: number;
    providerCosts: ProviderCost[];
    modelCosts: ModelCost[];
    period: '7d' | '30d' | 'all';
}

export interface ProviderCost {
    provider: string;
    requests: number;
    totalCost: number;
    avgCostPerRequest: number;
    avgLatency: number;
    reliability: number;
    recommendation: 'recommended' | 'good' | 'fair' | 'avoid';
}

export interface ModelCost {
    model: string;
    provider: string;
    requests: number;
    totalCost: number;
    avgCostPerRequest: number;
    inputPrice: number;
    outputPrice: number;
}

export interface CostRecommendation {
    id: string;
    type: 'cheaper_alternative' | 'underutilized' | 'overpriced' | 'budget_alert' | 'unused_key';
    title: string;
    description: string;
    potentialSavings?: number;
    provider?: string;
    model?: string;
    suggestedModel?: string;
    suggestedProvider?: string;
    severity: 'low' | 'medium' | 'high';
    action: string;
}

export interface CostOptimizationService {
    getSummary(period?: '7d' | '30d' | 'all'): Promise<CostSummary>;
    getRecommendations(): Promise<CostRecommendation[]>;
    dismissRecommendation(id: string): Promise<void>;
}
