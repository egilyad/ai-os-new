import type { ChatMessage, ProviderResponse, SendMessageOptions, StreamMeta } from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { LLMError } from '../core/errors';
import { estimateTokenCount } from '../utils/token-counter';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';

const LOGGER = FALLBACK_LOGGER.child('CostManagerDecorator');

export interface CostManagerPricing {
    inputPer1K: number;
    outputPer1K: number;
}

export interface CostManagerConfig {
    pricing: Record<string, CostManagerPricing>;
    monthlyBudget?: number;
    weeklyBudget?: number;
    dailyBudget?: number;
    onExceeded?: 'block' | 'downgrade';
    downgradeModel?: string;
    logCosts: boolean;
}

export interface CostRecord {
    timestamp: number;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
}

export interface CostSummary {
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    requestCount: number;
    byModel: Record<
        string,
        { cost: number; requests: number; inputTokens: number; outputTokens: number }
    >;
}

const DEFAULT_PRICING: Record<string, CostManagerPricing> = {};

const FALLBACK_PRICING: CostManagerPricing = {
    inputPer1K: 0.002,
    outputPer1K: 0.008,
};

export class CostManagerDecorator extends BaseDecorator {
    private records: CostRecord[] = [];
    private config: CostManagerConfig;
    private budgetExceeded = false;
    private _runningDay = 0;
    private _runningWeek = 0;
    private _runningMonth = 0;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        config?: Partial<CostManagerConfig>,
    ) {
        super(inner);
        this.config = {
            pricing: DEFAULT_PRICING,
            logCosts: true,
            ...config,
        };
    }

    get id(): string {
        return `${this.inner.id}[cost]`;
    }

    private getPricing(model: string): CostManagerPricing {
        return this.config.pricing[model] ?? FALLBACK_PRICING;
    }

    private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        const p = this.getPricing(model);
        return (inputTokens / 1000) * p.inputPer1K + (outputTokens / 1000) * p.outputPer1K;
    }

    private checkBudget(): void {
        const now = Date.now();
        const day = 86400000;
        const week = 7 * day;
        const month = 30 * day;

        // Incremental running totals — O(1) instead of O(n) per call
        this._runningMonth = 0;
        this._runningWeek = 0;
        this._runningDay = 0;
        for (const r of this.records) {
            const age = now - r.timestamp;
            if (age < month) this._runningMonth += r.cost;
            if (age < week) this._runningWeek += r.cost;
            if (age < day) this._runningDay += r.cost;
        }

        const exceeded =
            (this.config.dailyBudget !== undefined &&
                this._runningDay >= this.config.dailyBudget) ||
            (this.config.weeklyBudget !== undefined &&
                this._runningWeek >= this.config.weeklyBudget) ||
            (this.config.monthlyBudget !== undefined &&
                this._runningMonth >= this.config.monthlyBudget);

        if (exceeded && !this.budgetExceeded) {
            this.budgetExceeded = true;
            if (this.config.logCosts) LOGGER.warn('CostManagerDecorator', 'Budget exceeded');
        } else if (!exceeded && this.budgetExceeded) {
            this.budgetExceeded = false;
            if (this.config.logCosts) LOGGER.info('CostManagerDecorator', 'Budget auto-reset');
        }
    }

    private handleBudgetExceeded(
        model: string,
        _messages: ChatMessage[],
        _apiKey: string,
        _signal: AbortSignal | undefined,
    ): { model: string; blocked: boolean } {
        if (!this.budgetExceeded) return { model, blocked: false };

        if (this.config.onExceeded === 'downgrade' && this.config.downgradeModel) {
            if (this.config.logCosts)
                LOGGER.warn(
                    'CostManagerDecorator',
                    `Downgrading from ${model} to ${this.config.downgradeModel}`,
                );
            return { model: this.config.downgradeModel, blocked: false };
        }

        return { model, blocked: true };
    }

    getCosts(windowMs?: number): CostSummary {
        const now = Date.now();
        const filtered = windowMs
            ? this.records.filter((r) => now - r.timestamp < windowMs)
            : this.records;

        const byModel: CostSummary['byModel'] = {};
        let totalCost = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (const r of filtered) {
            totalCost += r.cost;
            totalInputTokens += r.inputTokens;
            totalOutputTokens += r.outputTokens;
            if (!byModel[r.model])
                byModel[r.model] = { cost: 0, requests: 0, inputTokens: 0, outputTokens: 0 };
            byModel[r.model]!.cost += r.cost;
            byModel[r.model]!.requests++;
            byModel[r.model]!.inputTokens += r.inputTokens;
            byModel[r.model]!.outputTokens += r.outputTokens;
        }

        return {
            totalCost,
            totalInputTokens,
            totalOutputTokens,
            requestCount: filtered.length,
            byModel,
        };
    }

    resetBudget(): void {
        this.budgetExceeded = false;
        this.records = []; // Clear records so budget check doesn't immediately re-trip
    }

    clearRecords(): void {
        this.records = [];
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        this.checkBudget(); // CRITICAL (Audit P0 Fix): Refresh budget status before checking
        const { model: resolvedModel, blocked } = this.handleBudgetExceeded(
            model,
            messages,
            apiKey,
            signal,
        );
        if (blocked)
            throw new LLMError(`Budget exceeded for ${this.id}. Request blocked.`, this.id, 429);

        const inputTokens = messages.reduce((s, m) => s + estimateTokenCount(m.content), 0);

        const res = await this.inner.sendMessage(messages, resolvedModel, apiKey, signal, options);
        const outputTokens = Math.max(0, (res.tokens ?? 0) - inputTokens);
        const actualCost = this.calculateCost(resolvedModel, inputTokens, outputTokens);

        this.records.push({
            timestamp: Date.now(),
            model: resolvedModel,
            inputTokens,
            outputTokens,
            cost: actualCost,
        });
        if (this.records.length > 10000) {
            this.records = this.records.slice(-5000);
        }
        if (this.config.logCosts)
            LOGGER.debug(
                'CostManagerDecorator',
                `${resolvedModel}: $${actualCost.toFixed(6)} (${inputTokens}+${outputTokens}t)`,
            );
        this.checkBudget();
        return res;
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        this.checkBudget(); // CRITICAL (Audit P0 Fix): Refresh budget status before checking
        const { model: resolvedModel, blocked } = this.handleBudgetExceeded(
            model,
            messages,
            apiKey,
            signal,
        );
        if (blocked)
            throw new LLMError(`Budget exceeded for ${this.id}. Request blocked.`, this.id, 429);

        const inputTokens = messages.reduce((s, m) => s + estimateTokenCount(m.content), 0);

        let outputTokens = 0;
        let finalMeta: Record<string, unknown> | undefined;

        const wrapped: typeof onChunk = (chunk, meta) => {
            if (meta) finalMeta = meta as Record<string, unknown>;
            outputTokens += estimateTokenCount(chunk);
            onChunk(chunk, meta);
        };

        if (!this.inner.streamMessage)
            throw new Error('CostManager: inner adapter does not support streaming');
        await this.inner.streamMessage(messages, resolvedModel, apiKey, wrapped, signal, options);
        const usage = finalMeta?.usage as
            { total_tokens?: number; totalTokens?: number } | undefined;
        const totalTokens =
            (finalMeta?.tokens as number) ??
            usage?.total_tokens ??
            usage?.totalTokens ??
            outputTokens;
        const streamOutputTokens = Math.max(0, totalTokens - inputTokens);
        const actualCost = this.calculateCost(resolvedModel, inputTokens, streamOutputTokens);
        this.records.push({
            timestamp: Date.now(),
            model: resolvedModel,
            inputTokens,
            outputTokens: streamOutputTokens,
            cost: actualCost,
        });
        if (this.records.length > 10000) {
            this.records = this.records.slice(-5000);
        }
        if (this.config.logCosts)
            LOGGER.debug(
                'CostManagerDecorator',
                `${resolvedModel} stream: $${actualCost.toFixed(6)} (${inputTokens}+${streamOutputTokens}t)`,
            );
        this.checkBudget();
    }

    destroy(): void {
        super.destroy();
    }
}
