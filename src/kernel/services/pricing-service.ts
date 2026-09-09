import { EVENTS } from '../events/event-names';
import { CONFIG } from './config-registry';
import { estimateTokens } from '../utils/tokenEstimate';
import type { ICostCalculator } from '../contracts/pricing';
import { rootLogger } from './logger-service';
const LOGGER = rootLogger.child('PricingService');

const FALLBACK_PRICING: Record<string, { input: number; output: number; provider?: string }> = {
    'gpt-4o': { input: 2.5, output: 10.0, provider: 'openai' },
    'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
    'gpt-4-turbo': { input: 10.0, output: 30.0, provider: 'openai' },
    'gpt-4': { input: 30.0, output: 60.0, provider: 'openai' },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5, provider: 'openai' },
    'claude-3-5-sonnet': { input: 3.0, output: 15.0, provider: 'anthropic' },
    'claude-3-opus': { input: 15.0, output: 75.0, provider: 'anthropic' },
    'claude-3-haiku': { input: 0.25, output: 1.25, provider: 'anthropic' },
    'claude-2': { input: 8.0, output: 24.0, provider: 'anthropic' },
    'gemini-3.1-flash-lite': { input: 0.25, output: 1.5, provider: 'google' },
    'gemini-3.1-flash': { input: 0.5, output: 2.0, provider: 'google' },
    'gemini-2.0-flash': { input: 2.5, output: 10.0, provider: 'google' },
    'gemini-3.1-pro': { input: 3.0, output: 12.0, provider: 'google' },
    'llama-3.3-70b': { input: 0.6, output: 0.8, provider: 'meta' },
    'meta/llama-3.3-70b-instruct': { input: 0.9, output: 0.9, provider: 'nvidia' },
    'meta/llama-3.1-8b-instruct': { input: 0.1, output: 0.1, provider: 'nvidia' },
    'llama-3.1-405b': { input: 2.5, output: 2.5, provider: 'meta' },
    'llama-3-70b': { input: 0.6, output: 0.8, provider: 'meta' },
    'llama-3-8b': { input: 0.05, output: 0.1, provider: 'meta' },
    'llama-3.1-8b-instant': { input: 0.03, output: 0.06, provider: 'groq' },
    'mistral-large': { input: 2.0, output: 6.0, provider: 'mistral' },
    'mistral-medium': { input: 2.5, output: 7.5, provider: 'mistral' },
    'mistral-small': { input: 0.2, output: 0.6, provider: 'mistral' },
    'deepseek-chat': { input: 0.14, output: 0.28, provider: 'deepseek' },
    'deepseek-reasoner': { input: 0.55, output: 2.19, provider: 'deepseek' },
    'qwen-2-72b': { input: 0.9, output: 0.9, provider: 'alibaba' },
    'qwen-2.5-72b': { input: 1.2, output: 1.8, provider: 'alibaba' },
    'mixtral-8x7b': { input: 0.5, output: 0.5, provider: 'mistral' },
    'mistralai/mistral-nemo': { input: 0.15, output: 0.15, provider: 'nvidia' },
    'command-r-plus': { input: 3.0, output: 15.0, provider: 'cohere' },
    'dbrx-instruct': { input: 0.6, output: 2.4, provider: 'databricks' },
    free: { input: 0, output: 0, provider: 'openrouter' },
};

const OVERRIDES_KEY = 'super_agents_pricing_overrides';
const CACHE_KEY_DB = 'pricing_cache';

export interface PricingServiceDeps {
    eventBus: {
        on?: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

export interface ModelPricing {
    input: number;
    output: number;
    provider?: string;
}

export class PricingService implements ICostCalculator {
    protected pricingData: Record<string, { input: number; output: number; provider?: string }> = {
        ...FALLBACK_PRICING,
    };
    protected lastFetch: number = 0;
    protected prefixCache = new Map<string, { input: number; output: number; provider?: string }>();
    protected userOverrides: Record<string, ModelPricing> = {};
    private fetchPromise: Promise<void> | null = null;
    private deps: PricingServiceDeps;
    private _initialized = false;

    constructor(deps: PricingServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.loadCache();
        await this.loadOverrides();
    }

    protected async saveCache() {
        try {
            await this.deps.database.setKv(CACHE_KEY_DB, {
                data: this.pricingData,
                timestamp: Date.now(),
            });
        } catch (e) {
            LOGGER.warn('PricingService', 'Failed to save cache', { error: e });
        }
    }

    private async loadCache() {
        try {
            const cached = await this.deps.database.getKv<{
                data: Record<string, { input: number; output: number; provider?: string }>;
                timestamp: number;
            }>(CACHE_KEY_DB);
            if (cached && Date.now() - cached.timestamp < CONFIG.pricing.cacheTTLMs) {
                this.pricingData = { ...FALLBACK_PRICING, ...cached.data };
                this.lastFetch = cached.timestamp;
            }
        } catch (e) {
            LOGGER.warn('PricingService', 'Failed to load pricing cache', { error: e });
        }
    }

    private async loadOverrides() {
        try {
            const saved =
                await this.deps.database.getKv<Record<string, ModelPricing>>(OVERRIDES_KEY);
            if (saved) this.userOverrides = saved;
        } catch (e) {
            LOGGER.warn('PricingService', 'Failed to load overrides', { error: e });
        }
    }

    private async saveOverrides() {
        try {
            await this.deps.database.setKv(OVERRIDES_KEY, this.userOverrides);
        } catch (e) {
            LOGGER.warn('PricingService', 'Failed to save overrides', { error: e });
        }
    }

    protected lookup(model: string): { input: number; output: number; provider?: string } {
        // Strip provider prefixes (openrouter/, groq/, nvidia/, meta-llama/, etc.) so model names
        // match the bare names in FALLBACK_PRICING (e.g. "llama-3.1-8b-instant")
        // Handle both slash-separated (openrouter/, meta-llama/) and colon-separated (groq:, etc.)
        const stripped = model
            .replace(
                /^(openrouter|groq|nvidia|gemini|openai|anthropic|mistral|cohere|deepseek|alibaba|meta-llama)\//i,
                '',
            )
            .replace(
                /^(openrouter|groq|nvidia|gemini|openai|anthropic|mistral|cohere|deepseek|alibaba|meta-llama):/i,
                '',
            )
            .toLowerCase()
            .trim();
        const key = stripped;
        const override = this.userOverrides[key];
        if (override) return override;
        const exact = this.pricingData[key];
        if (exact) return exact;
        const cached = this.prefixCache.get(key);
        if (cached) return cached;
        const prefix = Object.keys(this.pricingData)
            .filter((k) => key.startsWith(k))
            .sort((a, b) => b.length - a.length);
        const result =
            prefix.length > 0 ? this.pricingData[prefix[0]!] : { input: 0.15, output: 0.6 };
        if (prefix.length === 0 && key !== 'auto' && key !== '') {
            LOGGER.warn('PricingService', `Unknown model "${model}" — using fallback pricing`);
        }
        if (this.prefixCache.size >= CONFIG.pricing.prefixCacheMaxSize) {
            const oldest = this.prefixCache.keys().next().value;
            if (oldest !== undefined) this.prefixCache.delete(oldest);
        }
        this.prefixCache.set(key, result!);
        return result!;
    }

    calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        const pricing = this.lookup(model);
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        return inputCost + outputCost;
    }

    recordCost(
        model: string,
        inputTokens: number,
        outputTokens: number,
        _dedupKey?: string,
    ): number {
        return this.calculateCost(model, inputTokens, outputTokens);
    }

    estimateCost(
        model: string,
        promptLength: number,
        estimatedOutputTokens: number = CONFIG.pricing.defaultEstimatedOutputTokens,
    ): number {
        const inputTokens = Math.ceil(promptLength / CONFIG.llm.tokenEstimateDivisor);
        return this.calculateCost(model, inputTokens, estimatedOutputTokens);
    }

    predictCost(
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
    } {
        const key = model.toLowerCase().trim();
        if (/^(ollama|lmstudio|localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(key)) {
            return {
                estimatedInputTokens: 0,
                estimatedOutputTokens: 0,
                estimatedInputCost: 0,
                estimatedOutputCost: 0,
                estimatedTotalCost: 0,
                model,
                provider: 'local',
            };
        }

        const inputTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
        const estimatedOutputTokens = CONFIG.pricing.defaultEstimatedOutputTokens || 500;
        const pricing = this.lookup(model);
        const estimatedInputCost = (inputTokens / 1_000_000) * pricing.input;
        const estimatedOutputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;
        const provider = pricing.provider! || (model.includes('/') ? model.split('/')[0]! : model);

        return {
            estimatedInputTokens: inputTokens,
            estimatedOutputTokens,
            estimatedInputCost,
            estimatedOutputCost,
            estimatedTotalCost: estimatedInputCost + estimatedOutputCost,
            model,
            provider,
        };
    }

    getInputCost(model: string): number {
        return this.lookup(model).input;
    }
    getOutputCost(model: string): number {
        return this.lookup(model).output;
    }

    getPricingForModel(model: string): { input: number; output: number } {
        const p = this.lookup(model);
        return { input: p.input, output: p.output };
    }

    getPricingCapabilities(model: string) {
        return {
            supportsStreaming: true,
            supportsFunctionCalling: false,
            supportsVision: model.toLowerCase().includes('vision'),
            maxTokens: CONFIG.pricing.defaultEstimatedOutputTokens,
            supportedModels: Object.keys(this.pricingData),
        };
    }

    async syncFromOpenRouter(): Promise<void> {
        if (this.fetchPromise) return this.fetchPromise;
        this.fetchPromise = (async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                let res: Response | undefined;
                try {
                    res = await fetch('https://openrouter.ai/api/v1/models', {
                        signal: controller.signal,
                    });
                } finally {
                    clearTimeout(timeout);
                }
                if (!res.ok) {
                    res.body?.cancel()?.catch(() => {});
                    return;
                }
                const body = await res.json();
                const models: { id: string; pricing: { prompt: string; completion: string } }[] =
                    body?.data || [];
                for (const model of models) {
                    const id = model.id.toLowerCase();
                    const p = model.pricing;
                    if (p?.prompt && p?.completion) {
                        this.pricingData[id] = {
                            input: parseFloat(p.prompt),
                            output: parseFloat(p.completion),
                            provider: id.split('/')[0],
                        };
                    }
                }
                this.lastFetch = Date.now();
                this.prefixCache.clear();
                await this.saveCache();
                this.deps.eventBus.emit(EVENTS.PRICING_UPDATED, this.pricingData);
            } catch {
                LOGGER.warn('PricingService', 'OpenRouter sync failed, using fallback prices');
            } finally {
                this.fetchPromise = null;
            }
        })();
        return this.fetchPromise;
    }

    getAllPrices(): Record<string, ModelPricing> {
        return { ...this.pricingData };
    }
    getLastSync(): number {
        return this.lastFetch;
    }

    setOverride(model: string, pricing: ModelPricing) {
        this.userOverrides[model.toLowerCase().trim()] = pricing;
        this.prefixCache.clear();
        this.saveOverrides();
    }

    removeOverride(model: string) {
        delete this.userOverrides[model.toLowerCase().trim()];
        this.prefixCache.clear();
        this.saveOverrides();
    }

    getUserOverrides(): Record<string, ModelPricing> {
        return { ...this.userOverrides };
    }

    destroy() {
        this._initialized = false;
        this.prefixCache.clear();
        this.userOverrides = {};
        this.fetchPromise = null;
    }
}
