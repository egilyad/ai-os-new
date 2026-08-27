import type { ChatMessage, ProviderResponse, SendMessageOptions, StreamMeta } from '../core/types';
import { BaseDecorator } from '../core/base-decorator';

/** B-20: stable string for scoping the cache key by agent/session/role. */
function scopeKey(scope?: SendMessageOptions['cacheScope']): string {
    if (!scope) return '-';
    return [scope.agentId ?? '-', scope.sessionId ?? '-', scope.role ?? '-'].join('|');
}

// CONTRACT-C8: This is NOT real semantic embeddings — it's an FNV-1a hash-based
// 128-dimensional approximation (word-level locality-sensitive fingerprint). Do NOT
// market this as "semantic" or "embedding". Rename to approximateTextCache if needed.
export class CacheDecorator extends BaseDecorator {
    private cache = new Map<
        string,
        {
            response: ProviderResponse;
            timestamp: number;
            embedding?: number[];
            promptText?: string;
            apiKeyHash?: string;
            model?: string;
            temperature?: number;
            toolChoice?: string;
        }
    >();
    /** CONTRACT-C8: FNV-hash approximate-text index — not real semantic embeddings. */
    private approximateTextIndex = new Map<
        string,
        Map<
            string,
            {
                response: ProviderResponse;
                timestamp: number;
                embedding?: number[];
                promptText?: string;
                apiKeyHash?: string;
                model?: string;
                temperature?: number;
                toolChoice?: string;
            }
        >
    >();
    readonly #ttlMs: number;
    readonly #maxEntries: number;
    readonly #similarityThreshold: number;
    readonly #evictionTimer: ReturnType<typeof setInterval>;
    readonly #inFlight = new Map<string, Promise<ProviderResponse>>();
    readonly #inFlightTimers = new Map<string, ReturnType<typeof setTimeout>>();
    static readonly #IN_FLIGHT_TIMEOUT_MS = 120_000;
    #destroyed = false;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        ttlMs = 60000,
        maxEntries = 100,
        similarityThreshold = 0.85,
        disableSemanticCache = false,
    ) {
        super(inner);
        this.#ttlMs = ttlMs;
        this.#maxEntries = maxEntries;
        this.#similarityThreshold = disableSemanticCache ? 0 : similarityThreshold;
        this.#evictionTimer = setInterval(() => this.#evictExpired(), 30000);
    }

    // protected for testability
    protected getEmbedding(text: string): number[] {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const dims = 128; // 128D gives far better separation than 64D
        const vec = new Array(dims).fill(0);

        for (const word of words) {
            for (let d = 0; d < dims; d++) {
                // Use two-level hash to avoid dimensional bias
                const seed = `${d}:${word}`;
                let h = 0x811c9dc5; // FNV-1a offset basis
                for (let i = 0; i < seed.length; i++) {
                    h ^= seed.charCodeAt(i);
                    h = (h * 0x01000193) >>> 0; // FNV prime, keep 32-bit unsigned
                }
                // Use bit 17 (mid-range) rather than LSB to reduce correlation
                vec[d] += ((h >>> 17) & 1) === 0 ? 1 : -1;
            }
        }

        const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let d = 0; d < dims; d++) vec[d] /= magnitude;
        }
        return vec;
    }

    // protected for testability
    protected cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dot = 0;
        for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
        return dot;
    }

    /** Compute similarity score between two prompts (exposed for diagnostics/tests). */
    getSimilarityScore(textA: string, textB: string): number {
        return this.cosineSimilarity(this.getEmbedding(textA), this.getEmbedding(textB));
    }

    /** Proactive TTL sweep — prevents expired entry accumulation */
    #evictExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp >= this.#ttlMs) {
                this.cache.delete(key);
                for (const [, bucket] of this.approximateTextIndex) bucket.delete(key);
            }
        }
        // Also evict expired entries directly from semantic index buckets
        for (const bucket of this.approximateTextIndex.values()) {
            for (const [key, entry] of bucket) {
                if (now - entry.timestamp >= this.#ttlMs) {
                    bucket.delete(key);
                    this.cache.delete(key);
                }
            }
        }
        for (const [indexKey, bucket] of this.approximateTextIndex) {
            if (bucket.size === 0) this.approximateTextIndex.delete(indexKey);
        }
    }

    private async hash(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        options?: SendMessageOptions,
    ): Promise<string> {
        const apiKeyHash = await this.hashKey(apiKey);
        const params = {
            messages,
            model,
            temperature: options?.temperature,
            maxOutputTokens: options?.maxOutputTokens,
            stopSequences: options?.stopSequences,
            toolChoice: options?.toolChoice,
            responseFormat: options?.responseFormat,
            safetySettings: options?.safetySettings,
            tools: options?.tools ? JSON.stringify(options.tools) : undefined,
            cacheScope: scopeKey(options?.cacheScope),
        };
        const fullKey = `${apiKeyHash}:${JSON.stringify(params)}`;
        const msgUint8 = new TextEncoder().encode(fullKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    private async hashKey(apiKey: string): Promise<string> {
        const msgUint8 = new TextEncoder().encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        if (this.#destroyed)
            return this.inner.sendMessage(messages, model, apiKey, signal, options);
        const now = Date.now();

        // 1. Try semantic matching if enabled
        const userMsg = messages.filter((m) => m.role === 'user').slice(-1)[0];
        const systemParts = messages
            .filter((m) => m.role === 'system')
            .map((m) => m.content)
            .join('\n');
        const prevMessages = messages
            .slice(0, -1)
            .filter((m) => m.role !== 'system')
            .map((m) => (typeof m.content === 'string' ? m.content : ''))
            .join('\n');
        const apiKeyHash = await this.hashKey(apiKey);
        if (this.#similarityThreshold > 0 && userMsg && typeof userMsg.content === 'string') {
            const targetText = [
                systemParts,
                `history:${messages.length}`,
                prevMessages.slice(0, 2000),
                userMsg.content,
            ]
                .filter(Boolean)
                .join('\n');
            const targetEmbed = this.getEmbedding(targetText);
            const indexKey = `${apiKeyHash}:${model}:${scopeKey(options?.cacheScope)}`;
            const bucket = this.approximateTextIndex.get(indexKey);
            if (bucket) {
                for (const [key, entry] of bucket) {
                    if (now - entry.timestamp >= this.#ttlMs) {
                        bucket.delete(key);
                        this.cache.delete(key);
                        continue;
                    }
                    if (entry.embedding) {
                        const score = this.cosineSimilarity(targetEmbed, entry.embedding);
                        if (score >= this.#similarityThreshold) {
                            if (entry.model !== model || entry.apiKeyHash !== apiKeyHash) continue;
                            if (options) {
                                if (
                                    options.temperature !== undefined &&
                                    entry.temperature !== options.temperature
                                )
                                    continue;
                                if (
                                    options.toolChoice !== undefined &&
                                    entry.toolChoice !== options.toolChoice
                                )
                                    continue;
                            }
                            this.cache.delete(key);
                            this.cache.set(key, entry);
                            return entry.response;
                        }
                    }
                }
            }
        }

        // 2. Exact match check
        const key = await this.hash(messages, model, apiKey, options);
        const existing = this.cache.get(key);
        if (existing && now - existing.timestamp < this.#ttlMs) {
            this.cache.delete(key);
            this.cache.set(key, existing);
            return existing.response;
        }

        // 3. Cache stampede prevention: dedup concurrent in-flight requests for same key
        const pending = this.#inFlight.get(key);
        if (pending) return pending;

        // 4. Fetch fresh response with timeout to prevent #inFlight leaks on hung calls
        const timeoutPromise = new Promise<ProviderResponse>((_, reject) => {
            const timer = setTimeout(() => {
                this.#inFlight.delete(key);
                this.#inFlightTimers.delete(key);
                reject(new Error('CacheDecorator in-flight timeout'));
            }, CacheDecorator.#IN_FLIGHT_TIMEOUT_MS);
            this.#inFlightTimers.set(key, timer);
        });
        const fetchPromise = Promise.race([
            this.inner.sendMessage(messages, model, apiKey, signal, options),
            timeoutPromise,
        ]);
        this.#inFlight.set(key, fetchPromise);
        try {
            const response = await fetchPromise;
            this.#inFlight.delete(key);
            const timer = this.#inFlightTimers.get(key);
            if (timer) {
                clearTimeout(timer);
                this.#inFlightTimers.delete(key);
            }
            if (!response.error) {
                const entry: {
                    response: ProviderResponse;
                    timestamp: number;
                    embedding?: number[];
                    promptText?: string;
                    apiKeyHash: string;
                    model: string;
                    temperature?: number;
                    toolChoice?: string;
                } = {
                    response,
                    timestamp: now,
                    apiKeyHash,
                    model,
                    temperature: options?.temperature,
                    toolChoice:
                        typeof options?.toolChoice === 'string'
                            ? options.toolChoice
                            : JSON.stringify(options?.toolChoice),
                };

                if (
                    this.#similarityThreshold > 0 &&
                    userMsg &&
                    typeof userMsg.content === 'string'
                ) {
                    const cacheText = [
                        systemParts,
                        `history:${messages.length}`,
                        prevMessages.slice(0, 2000),
                        userMsg.content,
                    ]
                        .filter(Boolean)
                        .join('\n');
                    entry.embedding = this.getEmbedding(cacheText);
                    entry.promptText = cacheText;
                }

                this.cache.set(key, entry);
                const indexKey = `${apiKeyHash}:${model}:${scopeKey(options?.cacheScope)}`;
                if (!this.approximateTextIndex.has(indexKey))
                    this.approximateTextIndex.set(indexKey, new Map());
                this.approximateTextIndex.get(indexKey)!.set(key, entry);
                if (this.cache.size > this.#maxEntries) {
                    const lruEntry = this.cache.entries().next().value;
                    if (lruEntry) {
                        this.cache.delete(lruEntry[0]);
                        for (const [, bucket] of this.approximateTextIndex)
                            bucket.delete(lruEntry[0]);
                    }
                }
            }
            return response;
        } catch (e) {
            this.#inFlight.delete(key);
            const timer = this.#inFlightTimers.get(key);
            if (timer) {
                clearTimeout(timer);
                this.#inFlightTimers.delete(key);
            }
            throw e;
        }
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        if (this.#destroyed) {
            if (!this.inner.streamMessage)
                throw new Error('CacheDecorator: inner adapter does not support streaming');
            return this.inner.streamMessage(messages, model, apiKey, onChunk, signal, options);
        }
        const now = Date.now();
        const userMsg = messages.filter((m) => m.role === 'user').slice(-1)[0];
        const systemParts = messages
            .filter((m) => m.role === 'system')
            .map((m) => m.content)
            .join('\n');
        const prevMessages = messages
            .slice(0, -1)
            .filter((m) => m.role !== 'system')
            .map((m) => (typeof m.content === 'string' ? m.content : ''))
            .join('\n');
        const apiKeyHash = await this.hashKey(apiKey);

        // Check semantic cache for streaming (same logic as sendMessage)
        if (this.#similarityThreshold > 0 && userMsg && typeof userMsg.content === 'string') {
            const targetText = [
                systemParts,
                `history:${messages.length}`,
                prevMessages.slice(0, 2000),
                userMsg.content,
            ]
                .filter(Boolean)
                .join('\n');
            const targetEmbed = this.getEmbedding(targetText);
            const indexKey = `${apiKeyHash}:${model}:${scopeKey(options?.cacheScope)}`;
            const bucket = this.approximateTextIndex.get(indexKey);
            if (bucket) {
                for (const [key, entry] of bucket) {
                    if (now - entry.timestamp >= this.#ttlMs) {
                        bucket.delete(key);
                        this.cache.delete(key);
                        continue;
                    }
                    if (entry.embedding) {
                        const score = this.cosineSimilarity(targetEmbed, entry.embedding);
                        if (score >= this.#similarityThreshold) {
                            if (entry.model !== model || entry.apiKeyHash !== apiKeyHash) continue;
                            if (options) {
                                if (
                                    options.temperature !== undefined &&
                                    entry.temperature !== options.temperature
                                )
                                    continue;
                                if (
                                    options.toolChoice !== undefined &&
                                    entry.toolChoice !== options.toolChoice
                                )
                                    continue;
                            }
                            this.cache.delete(key);
                            this.cache.set(key, entry);
                            onChunk(entry.response.content);
                            return;
                        }
                    }
                }
            }
        }

        // Check exact cache
        const key = await this.hash(messages, model, apiKey, options);
        const existing = this.cache.get(key);
        if (existing && now - existing.timestamp < this.#ttlMs) {
            this.cache.delete(key);
            this.cache.set(key, existing);
            onChunk(existing.response.content);
            return;
        }

        // Stream fresh, buffer chunks, cache on completion
        const chunks: string[] = [];
        const wrapped: typeof onChunk = (chunk, meta) => {
            chunks.push(chunk);
            onChunk(chunk, meta);
        };

        if (!this.inner.streamMessage)
            throw new Error('CacheDecorator: inner adapter does not support streaming');
        await this.inner.streamMessage(messages, model, apiKey, wrapped, signal, options);

        if (chunks.length > 0) {
            const content = chunks.join('');
            const latency = Date.now() - now;
            const tokens = content.split(/\s+/).filter(Boolean).length;
            const response: ProviderResponse = { content, tokens, latency };
            const entry: {
                response: ProviderResponse;
                timestamp: number;
                embedding?: number[];
                promptText?: string;
                apiKeyHash: string;
                model: string;
                temperature?: number;
                toolChoice?: string;
            } = {
                response,
                timestamp: now,
                apiKeyHash,
                model,
                temperature: options?.temperature,
                toolChoice:
                    typeof options?.toolChoice === 'string'
                        ? options.toolChoice
                        : JSON.stringify(options?.toolChoice),
            };

            if (this.#similarityThreshold > 0 && userMsg && typeof userMsg.content === 'string') {
                const cacheText = [
                    systemParts,
                    `history:${messages.length}`,
                    prevMessages.slice(0, 2000),
                    userMsg.content,
                ]
                    .filter(Boolean)
                    .join('\n');
                entry.embedding = this.getEmbedding(cacheText);
                entry.promptText = cacheText;
            }

            this.cache.set(key, entry);
            const indexKey = `${apiKeyHash}:${model}:${scopeKey(options?.cacheScope)}`;
            if (!this.approximateTextIndex.has(indexKey))
                this.approximateTextIndex.set(indexKey, new Map());
            this.approximateTextIndex.get(indexKey)!.set(key, entry);
            if (this.cache.size > this.#maxEntries) {
                const lruEntry = this.cache.entries().next().value;
                if (lruEntry) {
                    this.cache.delete(lruEntry[0]);
                    for (const [, bucket] of this.approximateTextIndex) bucket.delete(lruEntry[0]);
                }
            }
        }
    }

    private modelCache = new Map<string, { models: string[]; timestamp: number }>();
    private static readonly MODEL_CACHE_TTL = 120_000;

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        const keyHash = await this.hashKey(apiKey);
        const cached = this.modelCache.get(keyHash);
        if (cached && Date.now() - cached.timestamp < CacheDecorator.MODEL_CACHE_TTL)
            return cached.models;
        const models = await this.inner.getAvailableModels(apiKey, signal);
        this.modelCache.set(keyHash, { models, timestamp: Date.now() });
        return models;
    }

    destroy(): void {
        this.#destroyed = true;
        clearInterval(this.#evictionTimer);
        this.#inFlight.clear();
        for (const timer of this.#inFlightTimers.values()) clearTimeout(timer);
        this.#inFlightTimers.clear();
        this.cache.clear();
        this.approximateTextIndex.clear();
        this.modelCache.clear();
        super.destroy();
    }

    clearCache(): void {
        this.cache.clear();
        this.approximateTextIndex.clear();
        this.modelCache.clear();
        this.#inFlight.clear();
        for (const timer of this.#inFlightTimers.values()) clearTimeout(timer);
        this.#inFlightTimers.clear();
    }
}
