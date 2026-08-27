import { LoggingDecorator } from '../decorators/logging-decorator';
import { CacheDecorator } from '../decorators/cache-decorator';
import { FallbackDecorator } from '../decorators/fallback-decorator';
import { CircuitBreakerDecorator } from '../decorators/circuit-breaker';
import { RetryDecorator } from '../decorators/retry-decorator';
import { RateLimitDecorator } from '../decorators/rate-limit-decorator';
import { PriorityQueueDecorator } from '../decorators/priority-queue';
import { CostManagerDecorator } from '../decorators/cost-manager';
import type { PriorityQueueConfig } from '../decorators/priority-queue';
import { GeminiAdapter } from '../gemini/gemini-adapter';
import { OpenRouterAdapter } from '../openrouter/openrouter-adapter';
import { NvidiaNIMAdapter } from '../nvidia/nvidia-nim-adapter';
import { MockAdapter } from '../mock/mock-adapter';
import { OpenAiCompatibleAdapter } from '../openai-compatible/openai-compatible-adapter';
import { CerebrasAdapter } from '../cerebras/cerebras-adapter';
import { GroqAdapter } from '../groq/groq-adapter';
import { CloudflareAdapter } from '../cloudflare/cloudflare-adapter';
import type { LLMProviderAdapter } from '../core/types';
import type { LLMContext } from '../../kernel/contracts/llm-context';

export interface AdapterFactoryConfig {
    logging?: boolean;
    cache?: boolean;
    cacheTtlMs?: number;
    cacheMaxEntries?: number;
    circuitBreaker?: boolean;
    circuitBreakerFailureThreshold?: number;
    circuitBreakerSuccessThreshold?: number;
    circuitBreakerOpenTimeoutMs?: number;
    circuitBreakerHalfOpenMaxRequests?: number;
    retry?: boolean;
    retryMax?: number;
    retryBaseDelayMs?: number;
    rateLimit?: boolean;
    rateLimitMaxTokens?: number;
    rateLimitRefillRate?: number;
    rateLimitRefillIntervalMs?: number;
    priorityQueue?: boolean;
    priorityQueueConfig?: Partial<PriorityQueueConfig>;
    costManager?: boolean;
}

export class AdapterFactory {
    private adapters = new Map<string, LLMProviderAdapter>();
    readonly #rateLimiters = new Map<string, RateLimitDecorator>();
    readonly #circuitBreakers = new Map<string, CircuitBreakerDecorator>();

    #config: AdapterFactoryConfig;
    #llmContext?: LLMContext;

    static readonly SUPPORTED_PROVIDERS: readonly string[] = [
        'gemini',
        'openrouter',
        'nvidia',
        'groq',
        'openai',
        'together',
        'fireworks',
        'deepseek',
        'mistral',
        'cohere',
        'azure',
        'huggingface',
        'cerebras',
        'cloudflare',
        'perplexity',
        'blackbox',
        'scaleway',
        'cometapi',
        'github',
        'ollama',
        'lmstudio',
    ];

    constructor(config: AdapterFactoryConfig = {}, llmContext?: LLMContext) {
        this.#config = config;
        this.#llmContext = llmContext;
    }

    getSupportedProviders(): string[] {
        return [...AdapterFactory.SUPPORTED_PROVIDERS];
    }

    isSupported(provider: string): boolean {
        try {
            this.create(provider);
            return true;
        } catch {
            return false;
        }
    }

    create(provider: string): LLMProviderAdapter {
        const normalized = provider.toLowerCase();
        if (this.adapters.has(normalized)) return this.adapters.get(normalized)!;

        let adapter: LLMProviderAdapter;

        switch (normalized) {
            case 'gemini':
                adapter = new GeminiAdapter(undefined, import.meta.env.VITE_PROXY_GEMINI);
                break;
            case 'openrouter':
                adapter = new OpenRouterAdapter();
                break;
            case 'nvidia':
            case 'nvidia-nim':
                adapter = new NvidiaNIMAdapter();
                break;
            case 'mock':
                adapter = new MockAdapter();
                break;
            case 'groq':
                adapter = new GroqAdapter();
                break;
            case 'openai':
                adapter = new OpenAiCompatibleAdapter('openai', 'https://api.openai.com/v1', true);
                break;
            case 'together':
                adapter = new OpenAiCompatibleAdapter(
                    'together',
                    'https://api.together.xyz/v1',
                    true,
                );
                break;
            case 'fireworks':
                adapter = new OpenAiCompatibleAdapter(
                    'fireworks',
                    'https://api.fireworks.ai/inference/v1',
                    true,
                );
                break;
            case 'deepseek':
                adapter = new OpenAiCompatibleAdapter(
                    'deepseek',
                    'https://api.deepseek.com/v1',
                    true,
                );
                break;
            case 'blackboxapi':
            case 'blackbox':
                adapter = new OpenAiCompatibleAdapter('blackbox', 'https://api.blackbox.ai', true);
                break;
            case 'scaleway':
            case 'dedibox':
                adapter = new OpenAiCompatibleAdapter(
                    'scaleway',
                    'https://api.scaleway.ai/v1',
                    true,
                );
                break;
            case 'cometapi':
                adapter = new OpenAiCompatibleAdapter(
                    'cometapi',
                    'https://api.cometapi.com/v1',
                    true,
                );
                break;
            case 'github':
                adapter = new OpenAiCompatibleAdapter(
                    'github',
                    'https://models.inference.ai.azure.com',
                    true,
                );
                break;
            case 'mistral':
                adapter = new OpenAiCompatibleAdapter('mistral', 'https://api.mistral.ai/v1', true);
                break;
            case 'cohere':
                adapter = new OpenAiCompatibleAdapter('cohere', 'https://api.cohere.com/v1', true);
                break;
            case 'azure':
                // Azure OpenAI requires {resource}.openai.azure.com — user must configure via proxy/env
                adapter = new OpenAiCompatibleAdapter('azure', '/proxy/azure', false);
                break;
            case 'huggingface':
                adapter = new OpenAiCompatibleAdapter(
                    'huggingface',
                    'https://api-inference.huggingface.co/v1',
                    true,
                );
                break;
            case 'perplexity':
                adapter = new OpenAiCompatibleAdapter(
                    'perplexity',
                    'https://api.perplexity.ai',
                    true,
                );
                break;
            case 'cerebras':
                adapter = new CerebrasAdapter();
                break;
            case 'cloudflare':
                adapter = new CloudflareAdapter();
                break;
            case 'ollama':
                adapter = new OpenAiCompatibleAdapter('ollama', 'http://localhost:11434/v1', false);
                break;
            case 'lmstudio':
            case 'lm-studio':
                adapter = new OpenAiCompatibleAdapter(
                    'lmstudio',
                    'http://localhost:1234/v1',
                    false,
                );
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        let rlRef: RateLimitDecorator | undefined;
        let cbRef: CircuitBreakerDecorator | undefined;

        if (this.#config.rateLimit) {
            rlRef = new RateLimitDecorator(
                adapter,
                this.#config.rateLimitMaxTokens ?? 60,
                this.#config.rateLimitRefillRate ?? 60,
                this.#config.rateLimitRefillIntervalMs ?? 60000,
                this.#llmContext?.crossTabStateSync,
            );
            adapter = rlRef;
        }
        if (this.#config.retry)
            adapter = new RetryDecorator(
                adapter,
                this.#config.retryMax ?? 3,
                this.#config.retryBaseDelayMs ?? 1000,
            );
        if (this.#config.circuitBreaker) {
            cbRef = new CircuitBreakerDecorator(
                adapter,
                {
                    failureThreshold: this.#config.circuitBreakerFailureThreshold ?? 5,
                    successThreshold: this.#config.circuitBreakerSuccessThreshold ?? 2,
                    openTimeoutMs: this.#config.circuitBreakerOpenTimeoutMs ?? 30000,
                    halfOpenMaxRequests: this.#config.circuitBreakerHalfOpenMaxRequests ?? 1,
                },
                this.#llmContext?.crossTabStateSync,
                this.#llmContext?.eventBus,
            );
            adapter = cbRef;
        }
        if (this.#config.priorityQueue)
            adapter = new PriorityQueueDecorator(adapter, this.#config.priorityQueueConfig);
        if (this.#config.costManager)
            adapter = new CostManagerDecorator(adapter, { logCosts: true });
        if (this.#config.cache)
            adapter = new CacheDecorator(
                adapter,
                this.#config.cacheTtlMs,
                this.#config.cacheMaxEntries,
            );
        if (this.#config.logging) adapter = new LoggingDecorator(adapter);

        if (rlRef) this.#rateLimiters.set(normalized, rlRef);
        if (cbRef) this.#circuitBreakers.set(normalized, cbRef);
        this.adapters.set(normalized, adapter);
        return adapter;
    }

    createWithFallback(primary: string, fallback: string): LLMProviderAdapter {
        const key = `${primary}+${fallback}`;
        if (this.adapters.has(key)) return this.adapters.get(key)!;

        const adapter = new FallbackDecorator(this.create(primary), this.create(fallback));
        this.adapters.set(key, adapter);
        return adapter;
    }

    getProviderRuntimeStatus(provider: string): { circuitOpen: boolean; rateLimited: boolean } {
        const normalized = provider.toLowerCase();
        const cb = this.#circuitBreakers.get(normalized);
        const rl = this.#rateLimiters.get(normalized);
        return {
            circuitOpen: cb ? cb.getState() === 'open' : false,
            rateLimited: rl ? !rl.canSend() : false,
        };
    }

    getCircuitBreakerState(provider: string): string {
        const normalized = provider.toLowerCase();
        const cb = this.#circuitBreakers.get(normalized);
        return cb ? cb.getState() : 'closed';
    }

    invalidateCache(provider?: string): void {
        if (provider) {
            const key = provider.toLowerCase();
            const adapter = this.adapters.get(key);
            if (adapter && typeof (adapter as { destroy?: () => void }).destroy === 'function') {
                (adapter as { destroy: () => void }).destroy();
            }
            this.adapters.delete(key);
            this.#rateLimiters.delete(key);
            this.#circuitBreakers.delete(key);
        } else {
            for (const adapter of this.adapters.values()) {
                if (typeof (adapter as { destroy?: () => void }).destroy === 'function') {
                    (adapter as { destroy: () => void }).destroy();
                }
            }
            this.adapters.clear();
            this.#rateLimiters.clear();
            this.#circuitBreakers.clear();
        }
    }

    resetCircuitBreaker(provider: string): void {
        const normalized = provider.toLowerCase();
        const cb = this.#circuitBreakers.get(normalized);
        if (cb) cb.forceReset();
    }

    syncCircuitBreakerState(provider: string, status: string): void {
        const normalized = provider.toLowerCase();
        const cb = this.#circuitBreakers.get(normalized);
        if (!cb) return;
        if (status === 'open') cb.forceOpen();
        else if (status === 'closed') cb.forceReset();
    }

    syncRateLimitState(provider: string, remaining: number): void {
        const normalized = provider.toLowerCase();
        const rl = this.#rateLimiters.get(normalized);
        if (!rl) return;
        if (remaining <= 0) rl.forceLimited();
        else rl.reset();
    }
}
