/**
 * Cost Calculator — AGEMS port, Phase 12.5.
 * Calculates LLM API costs based on token counts and pricing tables.
 */

export interface PricingTable {
    model: string;
    provider: string;
    inputPricePer1k: number;   // $ per 1K input tokens
    outputPricePer1k: number;  // $ per 1K output tokens
    currency: string;
}

export interface UsageEstimate {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
}

// Default pricing (approximate, as of 2024)
const DEFAULT_PRICING: PricingTable[] = [
    { model: 'gpt-4o', provider: 'openai', inputPricePer1k: 2.5 / 1000, outputPricePer1k: 10 / 1000, currency: 'USD' },
    { model: 'gpt-4o-mini', provider: 'openai', inputPricePer1k: 0.15 / 1000, outputPricePer1k: 0.6 / 1000, currency: 'USD' },
    { model: 'claude-3-5-sonnet', provider: 'anthropic', inputPricePer1k: 3 / 1000, outputPricePer1k: 15 / 1000, currency: 'USD' },
    { model: 'claude-3-5-haiku', provider: 'anthropic', inputPricePer1k: 0.8 / 1000, outputPricePer1k: 4 / 1000, currency: 'USD' },
    { model: 'gemini-2.0-flash', provider: 'google', inputPricePer1k: 0.1 / 1000, outputPricePer1k: 0.4 / 1000, currency: 'USD' },
];

export class CostCalculator {
    private pricing: PricingTable[];
    private customPricing = new Map<string, PricingTable>();

    constructor(pricing?: PricingTable[]) {
        this.pricing = pricing ?? DEFAULT_PRICING;
    }

    /**
     * Set custom pricing for a model.
     */
    setPricing(model: string, provider: string, inputPricePer1k: number, outputPricePer1k: number): void {
        this.customPricing.set(`${provider}/${model}`, {
            model, provider, inputPricePer1k, outputPricePer1k, currency: 'USD',
        });
    }

    /**
     * Calculate cost for a given usage.
     */
    calculate(model: string, provider: string, inputTokens: number, outputTokens: number): UsageEstimate {
        const key = `${provider}/${model}`;
        const table = this.customPricing.get(key) ?? this.pricing.find(p => p.model === model && p.provider === provider);

        const inputCost = table ? (inputTokens / 1000) * table.inputPricePer1k : 0;
        const outputCost = table ? (outputTokens / 1000) * table.outputPricePer1k : 0;

        return {
            inputTokens,
            outputTokens,
            inputCost: Math.round(inputCost * 10000) / 10000,
            outputCost: Math.round(outputCost * 10000) / 10000,
            totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
            currency: table?.currency ?? 'USD',
        };
    }

    /**
     * Estimate cost from text lengths.
     */
    estimate(model: string, provider: string, inputText: string, outputText: string, inputTokensPerChar = 0.25, outputTokensPerChar = 0.25): UsageEstimate {
        const inputTokens = Math.ceil(inputText.length * inputTokensPerChar);
        const outputTokens = Math.ceil(outputText.length * outputTokensPerChar);
        return this.calculate(model, provider, inputTokens, outputTokens);
    }

    /**
     * Format cost as string.
     */
    formatCost(estimate: UsageEstimate): string {
        return `$${estimate.totalCost.toFixed(4)} ${estimate.currency}`;
    }

    /**
     * Get available pricing tables.
     */
    getPricing(): PricingTable[] {
        return [...this.pricing, ...this.customPricing.values()];
    }
}
