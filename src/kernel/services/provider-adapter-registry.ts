import type { IAdapterRegistry, IProviderAdapter } from '../contracts/provider-adapter';
import { AdapterFactory } from '../../llm/registry/adapter-factory';
import type { AdapterFactoryConfig } from '../../llm/registry/adapter-factory';
import type { LLMContext } from '../contracts/llm-context';

export interface ProviderRuntimeStatus {
    circuitOpen: boolean;
    rateLimited: boolean;
}

export class ProviderAdapterRegistry implements IAdapterRegistry {
    private factory: AdapterFactory;
    private adapters = new Map<string, IProviderAdapter>();
    /** Event-bus subscriptions owned by the registry — cleaned up in destroy() */
    private _unsubs: Array<() => void> = [];

    constructor(config?: AdapterFactoryConfig | AdapterFactory | LLMContext, ...rest: unknown[]) {
        if (config && 'logging' in config) {
            const ctx = rest[0] as LLMContext | undefined;
            this.factory = new AdapterFactory(config as AdapterFactoryConfig, ctx);
        } else if (config instanceof AdapterFactory) {
            this.factory = config;
        } else {
            const ctx = config as LLMContext | undefined;
            this.factory = new AdapterFactory(
                {
                    logging: true,
                    cache: true,
                    cacheTtlMs: 60000,
                    cacheMaxEntries: 100,
                    circuitBreaker: true,
                    circuitBreakerFailureThreshold: 5,
                    circuitBreakerSuccessThreshold: 2,
                    circuitBreakerOpenTimeoutMs: 30000,
                    circuitBreakerHalfOpenMaxRequests: 1,
                    retry: true,
                    retryMax: 3,
                    retryBaseDelayMs: 1000,
                    rateLimit: true,
                    rateLimitMaxTokens: 60,
                    rateLimitRefillRate: 60,
                    rateLimitRefillIntervalMs: 60000,
                    priorityQueue: true,
                    priorityQueueConfig: {
                        maxConcurrency: 4,
                        lowPriorityDelayMs: 200,
                    },
                    costManager: true,
                },
                ctx,
            );
        }
    }

    getAdapter(provider: string): IProviderAdapter | undefined {
        const normalized = provider.toLowerCase();
        if (this.adapters.has(normalized)) return this.adapters.get(normalized);
        try {
            const adapter = this.factory.create(normalized);
            this.adapters.set(normalized, adapter);
            return adapter;
        } catch {
            return undefined;
        }
    }

    hasAdapter(provider: string): boolean {
        const normalized = provider.toLowerCase();
        if (this.adapters.has(normalized)) return true;
        return this.factory.isSupported(normalized);
    }

    getOrCreateWithFallback(primary: string, fallback: string): IProviderAdapter {
        const key = `${primary}+${fallback}`;
        if (this.adapters.has(key)) return this.adapters.get(key)!;
        const adapter = this.factory.createWithFallback(primary, fallback);
        this.adapters.set(key, adapter);
        return adapter;
    }

    getAllProviders(): string[] {
        return this.factory.getSupportedProviders();
    }

    getAdapterFactory(): AdapterFactory {
        return this.factory;
    }

    getProviderRuntimeStatus(provider: string): ProviderRuntimeStatus {
        return this.factory.getProviderRuntimeStatus(provider);
    }

    resetCircuitBreaker(provider: string): void {
        this.factory.resetCircuitBreaker(provider);
    }

    getCircuitBreakerState(provider: string): 'closed' | 'open' | 'half-open' {
        return this.factory.getCircuitBreakerState(provider) as 'closed' | 'open' | 'half-open';
    }

    syncCircuitBreakerState(provider: string, status: string): void {
        this.factory.syncCircuitBreakerState(provider, status);
    }

    syncRateLimitState(provider: string, remaining: number): void {
        this.factory.syncRateLimitState(provider, remaining);
    }

    clearAllCaches(): void {
        for (const [, adapter] of this.adapters) {
            let current: unknown = adapter;
            const seen = new Set<unknown>();
            while (current && !seen.has(current)) {
                seen.add(current);
                if (typeof (current as Record<string, unknown>).clearCache === 'function') {
                    (current as { clearCache: () => void }).clearCache();
                }
                current = (current as Record<string, unknown>).inner;
            }
        }
    }

    init(): void {
        /* no-op — registry is ready after construction */
    }

    start(): void {
        /* no-op — registry has no async startup */
    }

    destroy(): void {
        for (const unsub of this._unsubs) unsub();
        this._unsubs = [];
        for (const [, adapter] of this.adapters) {
            let current: unknown = adapter;
            const seen = new Set<unknown>();
            while (current && !seen.has(current)) {
                seen.add(current);
                if (typeof (current as Record<string, unknown>).destroy === 'function') {
                    (current as { destroy: () => void }).destroy();
                }
                current = (current as Record<string, unknown>).inner;
            }
        }
        this.adapters.clear();
    }
}
