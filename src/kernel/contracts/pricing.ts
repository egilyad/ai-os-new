import type { Result } from './results';
import type { QuotaError, KernelError } from './errors';

export interface CostEstimate {
    readonly model: string;
    readonly provider: string;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly inputCost: number;
    readonly outputCost: number;
    readonly totalCost: number;
    readonly timestamp: number;
    readonly agentId?: string;
    readonly invocationId?: string;
}

export interface ProviderBudget {
    readonly provider: string;
    readonly monthlyBudget: number;
    readonly spentThisMonth: number;
    readonly remainingBudget: number;
}

export interface BudgetInfo {
    readonly monthlyBudget: number;
    readonly spentThisMonth: number;
    readonly remainingBudget: number;
    readonly dailyAverage: number;
    readonly projectedMonthly: number;
    readonly providerBudgets: ProviderBudget[];
}

export interface PricingCapability {
    readonly supportsStreaming: boolean;
    readonly supportsFunctionCalling: boolean;
    readonly supportsVision: boolean;
    readonly maxTokens: number;
    readonly supportedModels: string[];
}

export interface CostCalculationError {
    readonly type: 'pricing';
    readonly reason:
        'model_not_found' | 'invalid_tokens' | 'budget_exceeded' | 'provider_unavailable';
    readonly model?: string;
    readonly message: string;
}

export interface ICostCalculator {
    calculateCost(model: string, inputTokens: number, outputTokens: number): number;
    recordCost(model: string, inputTokens: number, outputTokens: number, dedupKey?: string): number;
    estimateCost(model: string, promptLength: number, estimatedOutputTokens?: number): number;
    getPricingForModel(model: string): { input: number; output: number };
    getInputCost(model: string): number;
    getOutputCost(model: string): number;
    getPricingCapabilities(model: string): PricingCapability | null;
    /** Result-typed variant for safe callers */
    tryCalculateCost?(
        model: string,
        inputTokens: number,
        outputTokens: number,
    ): Result<number, CostCalculationError>;
    tryGetPricingForModel?(
        model: string,
    ): Result<{ input: number; output: number }, CostCalculationError>;
    predictCost?(
        messages: Array<{ role: string; content: string }>,
        model: string,
    ): {
        estimatedInputTokens: number;
        estimatedOutputTokens: number;
        estimatedInputCost: number;
        estimatedOutputCost: number;
        estimatedTotalCost: number;
        model: string;
        provider: string;
    };
}

export interface IUsageTracker {
    trackUsage(provider: string, model: string, tokens: number, cost: number): void;
    getUsageStats(): {
        totalTokens: number;
        totalCost: number;
        byProvider: Record<string, { tokens: number; cost: number }>;
    };
    getProviderUsage(provider: string): { tokens: number; cost: number; requestCount: number };
    checkQuota(provider: string): Result<void, QuotaError>;
    tryTrackUsage?(
        provider: string,
        model: string,
        tokens: number,
        cost: number,
    ): Result<void, KernelError>;
}
