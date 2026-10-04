import type { ChatMessage, ProviderResponse, SendMessageOptions, StreamMeta } from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { RetryableError } from '../core/errors';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';
import type { ICrossTabStateSync } from '../../kernel/contracts/cross-tab-state';

const LOGGER = FALLBACK_LOGGER.child('RateLimitDecorator');

/** FNV-1a 32-bit, hex-free alphanumerics — for bucket keys, not security. */
function fnv1a(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

interface TokenBucket {
    tokens: number;
    lastRefill: number;
}

export class RateLimitDecorator extends BaseDecorator {
    readonly #maxTokens: number;
    readonly #refillRate: number;
    readonly #refillInterval: number;
    readonly #crossTabStateSync?: ICrossTabStateSync;
    #global: TokenBucket;
    #perProvider: Map<string, TokenBucket>;
    #manualLimited = false;
    private static readonly MAX_PROVIDERS = 100;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        maxTokens = 60,
        refillRate = 60,
        refillInterval = 60000,
        crossTabStateSync?: ICrossTabStateSync,
    ) {
        super(inner);
        this.#maxTokens = maxTokens;
        this.#refillRate = refillRate;
        this.#refillInterval = refillInterval;
        this.#crossTabStateSync = crossTabStateSync;
        this.#global = { tokens: maxTokens, lastRefill: Date.now() };
        this.#perProvider = new Map();
    }

    get id(): string {
        return `${this.inner.id}[rl]`;
    }

    private refill(bucket: TokenBucket): void {
        const now = Date.now();
        const elapsed = now - bucket.lastRefill;
        const add = (elapsed / this.#refillInterval) * this.#refillRate;
        bucket.tokens = Math.min(this.#maxTokens, bucket.tokens + add);
        bucket.lastRefill = now;
    }

    private getProviderId(): string {
        return this.inner.id.replace(/\[(rl|cb|pq|rt|log|metrics|cache|fb|sr|cr|cm)\]/g, '');
    }

    private cleanupProviders(): void {
        if (this.#perProvider.size > RateLimitDecorator.MAX_PROVIDERS) {
            const toRemove = this.#perProvider.size - RateLimitDecorator.MAX_PROVIDERS;
            let count = 0;
            for (const [providerId] of this.#perProvider.entries()) {
                if (count >= toRemove) break;
                this.#perProvider.delete(providerId);
                count++;
            }
        }
    }

    destroy(): void {
        super.destroy();
    }

    forceLimited(): void {
        this.#global.tokens = 0;
        this.#perProvider.clear();
        this.#manualLimited = true;
    }

    reset(): void {
        this.#global.tokens = this.#maxTokens;
        this.#global.lastRefill = Date.now();
        this.#manualLimited = false;
    }

    canSend(apiKey?: string): boolean {
        if (this.#manualLimited) return false;
        const now = Date.now();
        const globalElapsed = now - this.#global.lastRefill;
        const globalAvailable = Math.min(
            this.#maxTokens,
            this.#global.tokens + (globalElapsed / this.#refillInterval) * this.#refillRate,
        );
        if (globalAvailable < 1) return false;
        const providerId = this.getProviderId();
        // L-16: with per-key buckets, a keyless check is conservative — false
        // if ANY bucket for the provider is exhausted.
        const ids = apiKey
            ? [this.bucketKey(apiKey)]
            : [...this.#perProvider.keys()].filter(
                  (k) => k === providerId || k.startsWith(`${providerId}:k`),
              );
        return ids.every((id) => this.bucketAvailable(id, now));
    }

    private bucketKey(apiKey?: string): string {
        const providerId = this.getProviderId();
        return apiKey ? `${providerId}:k${fnv1a(apiKey).toString(36)}` : providerId;
    }

    private bucketAvailable(id: string, now: number): boolean {
        const pb = this.#perProvider.get(id);
        if (!pb) return true;
        return (
            Math.min(
                this.#maxTokens,
                pb.tokens + ((now - pb.lastRefill) / this.#refillInterval) * this.#refillRate,
            ) >= 1
        );
    }

    private async checkRate(apiKey?: string): Promise<void> {
        if (this.#manualLimited) {
            throw new RetryableError('Rate limit manually forced', this.inner.id, 429);
        }
        // L-16: bucket per provider+key (FNV-1a hash, not the key itself —
        // no key material at rest in the map). Previously all keys of one
        // provider shared a bucket, so one bursty key starved the rest.
        // NOTE: the global bucket still bounds aggregate throughput — per-key
        // buckets fix distribution fairness, not total capacity.
        const providerId = this.getProviderId();
        const bucketId = this.bucketKey(apiKey);
        if (!this.#perProvider.has(bucketId)) {
            this.cleanupProviders();
            this.#perProvider.set(bucketId, { tokens: this.#maxTokens, lastRefill: Date.now() });
        }
        const pb = this.#perProvider.get(bucketId)!;
        // Check both buckets first (read-only), then consume atomically
        this.refill(pb);
        this.refill(this.#global);
        if (pb.tokens < 1) {
            this.#crossTabStateSync?.updateRateLimit({
                provider: providerId,
                keyId: this.inner.id,
                remaining: 0,
                resetAt: Date.now(),
            });
            LOGGER.debug('RateLimitDecorator', 'Rate limit hit', {
                provider: providerId,
                adapter: this.inner.id,
            });
            throw new RetryableError(`Rate limit exceeded for ${providerId}`, this.inner.id, 429);
        }
        if (this.#global.tokens < 1) {
            this.#crossTabStateSync?.updateRateLimit({
                provider: 'unknown',
                keyId: this.inner.id,
                remaining: 0,
                resetAt: Date.now(),
            });
            LOGGER.debug('RateLimitDecorator', 'Global rate limit exceeded', {
                adapter: this.inner.id,
            });
            throw new RetryableError('Global rate limit exceeded', this.inner.id, 429);
        }
        // Both available — consume atomically
        pb.tokens--;
        this.#global.tokens--;
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        await this.checkRate(apiKey);
        return this.inner.sendMessage(messages, model, apiKey, signal, options);
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        await this.checkRate(apiKey);
        if (!this.inner.streamMessage)
            throw new Error('RateLimit: inner adapter does not support streaming');
        return this.inner.streamMessage(messages, model, apiKey, onChunk, signal, options);
    }
}
