import type {
    ChatMessage,
    ProviderResponse,
    HealthCheckResult,
    SendMessageOptions,
    StreamMeta,
} from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { LLMError, RetryableError } from '../core/errors';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';
import type { ICrossTabStateSync } from '../../kernel/contracts/cross-tab-state';
import type { IEventBus } from '../../kernel/types/interfaces';
const LOGGER = FALLBACK_LOGGER.child('CircuitBreaker');

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitConfig {
    failureThreshold: number;
    successThreshold: number;
    openTimeoutMs: number;
    halfOpenMaxRequests: number;
}

const DEFAULT_CONFIG: CircuitConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    openTimeoutMs: 30000,
    halfOpenMaxRequests: 1,
};

// 402 = Payment Required (no credits). Fail fast — don't retry, don't accumulate circuit failures.
// 429 = Rate Limited (transient). The debate-llm-caller handles 429 with per-agent rate-backoff
// independently. Opening the circuit on 429 would block ALL keys for the provider (via hasAnyOpenCircuit),
// killing multi-agent debates when a single key hits a rate limit.
const NON_CIRCUIT_HTTP_STATUSES = new Set([400, 401, 402, 403, 405, 422, 429]);
// P1-6: server errors (5xx) open circuit after 2 failures instead of waiting for default threshold (5)
const SERVER_ERROR_STATUSES = new Set([500, 502, 503, 504]);

interface CircuitStateData {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
    openSince: number;
    currentTimeoutMs?: number;
}

export class CircuitBreakerDecorator extends BaseDecorator {
    private states = new Map<string, CircuitStateData>();

    private getOrCreateState(key: string): CircuitStateData {
        let s = this.states.get(key);
        if (!s) {
            s = { state: 'closed', failures: 0, successes: 0, lastFailureTime: 0, openSince: 0 };
            this.states.set(key, s);
        }
        return s;
    }

    private halfOpenStateKeys = new Set<string>();
    private unsubSync: (() => void) | null = null;
    private transitioningKeys = new Set<string>();

    readonly #config: CircuitConfig;

    #crossTabStateSync?: ICrossTabStateSync;
    #eventBus?: IEventBus;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        config: CircuitConfig = DEFAULT_CONFIG,
        crossTabStateSync?: ICrossTabStateSync,
        eventBus?: IEventBus,
    ) {
        super(inner);
        this.#config = config;
        this.#crossTabStateSync = crossTabStateSync;
        this.#eventBus = eventBus;
        if (eventBus) this.listenToCrossTabSync();
    }

    get id(): string {
        return `${this.inner.id}[cb]`;
    }

    private getKeyId(apiKey: string): string {
        let hash = 0;
        for (let i = 0; i < apiKey.length; i++) {
            hash = ((hash << 5) - hash + apiKey.charCodeAt(i)) | 0;
        }
        return `${this.getProviderId()}:${Math.abs(hash).toString(36)}`;
    }

    private hasAnyOpenCircuit(): boolean {
        for (const s of this.states.values()) {
            if (s.state === 'open') return true;
        }
        return false;
    }

    private updateAndGetState(key?: string): CircuitState {
        if (!key) return this.hasAnyOpenCircuit() ? 'open' : 'closed';
        const s = this.getOrCreateState(key);
        if (s.state === 'open') {
            if (this.transitioningKeys.has(key)) return s.state;
            const timeout = s.currentTimeoutMs ?? this.#config.openTimeoutMs;
            if (Date.now() - s.openSince >= timeout) {
                this.transitioningKeys.add(key);
                try {
                    s.state = 'half-open';
                    s.successes = 0;
                    s.currentTimeoutMs = undefined;
                    LOGGER.debug('CircuitBreaker', 'open → half-open', { key });
                } finally {
                    this.transitioningKeys.delete(key);
                }
            }
        }
        return s.state;
    }

    peekState(apiKey?: string): CircuitState {
        if (!apiKey) return this.hasAnyOpenCircuit() ? 'open' : 'closed';
        const key = this.getKeyId(apiKey);
        if (!this.states.has(key)) return 'closed';
        // Use updateAndGetState to auto-transition open→half-open when timeout has expired
        return this.updateAndGetState(key);
    }

    getState(apiKey?: string): CircuitState {
        if (!apiKey) return this.hasAnyOpenCircuit() ? 'open' : 'closed';
        const key = this.getKeyId(apiKey);
        return this.updateAndGetState(key);
    }

    forceReset(apiKey?: string): void {
        if (apiKey) {
            const key = this.getKeyId(apiKey);
            const prev = this.states.get(key)?.state;
            this.states.delete(key);
            this.halfOpenStateKeys.delete(key);
            this.transitioningKeys.delete(key);
            if (prev && prev !== 'closed') {
                LOGGER.debug('CircuitBreaker', 'key reset', { key, prev });
            }
        } else {
            this.states.clear();
            this.halfOpenStateKeys.clear();
            this.transitioningKeys.clear();
        }
    }

    forceOpen(apiKey?: string): void {
        if (!apiKey) {
            // Force open all keys for this provider
            const now = Date.now();
            for (const [k, s] of this.states) {
                s.state = 'open';
                s.openSince = now;
                this.transitioningKeys.delete(k);
            }
            return;
        }
        const key = this.getKeyId(apiKey);
        const s = this.getOrCreateState(key);
        s.state = 'open';
        s.openSince = Date.now();
        s.currentTimeoutMs = this.#config.openTimeoutMs;
        this.transitioningKeys.delete(key);
        this.#crossTabStateSync?.updateCircuitBreaker({
            provider: this.getProviderId(),
            keyId: key,
            status: 'open',
            failureCount: s.failures,
            lastFailure: s.lastFailureTime,
        });
    }

    private async callWithCircuit<T>(
        fn: () => Promise<T>,
        apiKey: string,
        signal?: AbortSignal,
    ): Promise<T> {
        const key = this.getKeyId(apiKey);
        const circuitState = this.updateAndGetState(key);
        if (circuitState === 'open') {
            const s = this.getOrCreateState(key);
            const timeout = s.currentTimeoutMs ?? this.#config.openTimeoutMs;
            throw new LLMError(
                `Circuit breaker is OPEN for key ${key}. Retry in ${timeout - (Date.now() - s.openSince)}ms`,
                this.inner.id,
                503,
            );
        }
        const isHalfOpen = circuitState === 'half-open';
        if (isHalfOpen) {
            if (this.halfOpenStateKeys.size >= this.#config.halfOpenMaxRequests) {
                throw new LLMError(
                    `Circuit breaker is HALF-OPEN for ${this.inner.id}, max concurrent test requests reached`,
                    this.inner.id,
                    503,
                );
            }
            this.halfOpenStateKeys.add(key);
        }

        try {
            const result = await fn();
            this.onSuccess(key, circuitState);
            return result;
        } catch (e) {
            const statusCode = this.getStatusCodeForNonCircuit(e);
            if (statusCode !== undefined && NON_CIRCUIT_HTTP_STATUSES.has(statusCode)) {
                throw e;
            }
            this.onFailure(key, e, circuitState, signal);
            if (e instanceof RetryableError) {
                const error = new LLMError(
                    e instanceof Error ? e.message : String(e),
                    this.inner.id,
                    (e as { statusCode?: number }).statusCode,
                    { cause: e },
                );
                if (e.retryAfter !== undefined)
                    (error as { retryAfter?: number }).retryAfter = e.retryAfter;
                throw error;
            }
            throw e;
        } finally {
            if (isHalfOpen) {
                this.halfOpenStateKeys.delete(key);
            }
        }
    }

    private getStatusCodeForNonCircuit(e: unknown): number | undefined {
        if (!e || typeof e !== 'object') return undefined;
        return this.getStatusCode(e);
    }

    private getProviderId(): string {
        return this.inner.id.replace(/\[(rl|cb|pq|rt|log|metrics|cache|fb|sr|cr|cm)\]/g, '');
    }

    private isUserInitiatedAbort(e: unknown, signal?: AbortSignal): boolean {
        if (!(e instanceof DOMException) || e.name !== 'AbortError') return false;
        return signal?.aborted === true;
    }

    private onSuccess(key: string, capturedState: CircuitState): void {
        const s = this.getOrCreateState(key);
        if (capturedState === 'half-open') {
            if (s.state !== 'half-open') return;
            s.successes++;
            if (s.successes >= this.#config.successThreshold) {
                this.states.delete(key);
                this.#crossTabStateSync?.updateCircuitBreaker({
                    provider: this.getProviderId(),
                    keyId: key,
                    status: 'closed',
                    failureCount: 0,
                    lastFailure: 0,
                });
            }
        } else if (capturedState === 'closed' && s.state === 'closed') {
            s.failures = 0;
        }
    }

    private onFailure(
        key: string,
        e?: unknown,
        capturedState?: CircuitState,
        signal?: AbortSignal,
    ): void {
        if (this.isUserInitiatedAbort(e, signal)) return;
        const statusCode = this.getStatusCode(e);
        if (statusCode !== undefined && NON_CIRCUIT_HTTP_STATUSES.has(statusCode)) return;

        const s = this.getOrCreateState(key);
        if (capturedState && capturedState !== s.state) return;

        s.failures++;
        s.lastFailureTime = Date.now();

        let isRateLimit = false;
        let customTimeoutMs: number | undefined;
        let isServerError = false;

        if (statusCode !== undefined) {
            if (statusCode === 429) {
                isRateLimit = true;
                const retryAfter =
                    e && typeof e === 'object'
                        ? (e as Record<string, unknown>).retryAfter
                        : undefined;
                if (typeof retryAfter === 'number' && retryAfter > 0) {
                    customTimeoutMs = retryAfter;
                }
            }
            if (SERVER_ERROR_STATUSES.has(statusCode)) {
                isServerError = true;
            }
        }

        const serverErrorThresholdReached = isServerError && s.failures >= 2;
        if (
            s.state === 'half-open' ||
            isRateLimit ||
            serverErrorThresholdReached ||
            s.failures >= this.#config.failureThreshold
        ) {
            const prev = s.state;
            s.state = 'open';
            s.openSince = Date.now();
            if (customTimeoutMs) s.currentTimeoutMs = customTimeoutMs;
            LOGGER.debug('CircuitBreaker', 'state → open', {
                key,
                prev,
                failures: s.failures,
                rateLimit: isRateLimit,
            });

            this.#crossTabStateSync?.updateCircuitBreaker({
                provider: this.getProviderId(),
                keyId: key,
                status: 'open',
                failureCount: s.failures,
                lastFailure: s.lastFailureTime,
            });
        }
    }

    private getStatusCode(e: unknown): number | undefined {
        if (!e || typeof e !== 'object' || !('statusCode' in e)) return undefined;
        const statusCode = (e as Record<string, unknown>).statusCode;
        return typeof statusCode === 'number' ? statusCode : undefined;
    }

    listenToCrossTabSync(): void {
        this.unsubSync =
            this.#eventBus?.on('provider:circuit-breaker:synced', (state: unknown) => {
                const s = state as { provider: string; keyId: string; status: string };
                const syncKey = `${s.provider}:${s.keyId}`;
                if (!syncKey.startsWith(this.getProviderId())) return;
                if (s.status === 'open') {
                    const existing = this.states.get(s.keyId);
                    if (existing) {
                        existing.state = 'open';
                        existing.openSince = Date.now();
                    } else {
                        this.states.set(s.keyId, {
                            state: 'open',
                            failures: 0,
                            successes: 0,
                            lastFailureTime: 0,
                            openSince: Date.now(),
                        });
                    }
                } else if (s.status === 'closed') {
                    this.states.delete(s.keyId);
                }
            }) ?? null;
    }

    destroy(): void {
        if (this.unsubSync) {
            this.unsubSync();
            this.unsubSync = null;
        }
        this.states.clear();
        this.halfOpenStateKeys.clear();
        this.transitioningKeys.clear();
        super.destroy();
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        return this.callWithCircuit(
            () => this.inner.sendMessage(messages, model, apiKey, signal, options),
            apiKey,
            signal,
        );
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        const streamMessage = this.inner.streamMessage;
        if (!streamMessage)
            throw new Error('CircuitBreaker: inner adapter does not support streaming');
        return this.callWithCircuit(
            () => streamMessage.call(this.inner, messages, model, apiKey, onChunk, signal, options),
            apiKey,
            signal,
        );
    }

    async batchSendMessage(
        requests: Array<{
            messages: ChatMessage[];
            model: string;
            apiKey: string;
            signal?: AbortSignal;
            options?: SendMessageOptions;
        }>,
    ): Promise<ProviderResponse[]> {
        if (requests.length === 0) return [];
        return this.callWithCircuit(
            () => this.inner.batchSendMessage!(requests),
            requests[0]!.apiKey,
        );
    }

    async batchStreamMessage(
        requests: Array<{
            messages: ChatMessage[];
            model: string;
            apiKey: string;
            onChunk: (chunk: string, meta?: StreamMeta) => void;
            signal?: AbortSignal;
            options?: SendMessageOptions;
        }>,
    ): Promise<void> {
        if (requests.length === 0) return;
        return this.callWithCircuit(
            () => this.inner.batchStreamMessage!(requests),
            requests[0]!.apiKey,
        );
    }

    async checkHealth(apiKey: string): Promise<HealthCheckResult> {
        const key = this.getKeyId(apiKey);
        const state = this.updateAndGetState(key);
        if (state === 'open') {
            const s = this.states.get(key);
            const secs = s ? Math.round((Date.now() - s.openSince) / 1000) : 0;
            return {
                status: 'error',
                latency: 0,
                models: [],
                error: `Circuit breaker OPEN (${secs}s ago)`,
            };
        }
        return this.inner.checkHealth(apiKey);
    }

    async getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
        if (this.updateAndGetState(this.getKeyId(apiKey)) === 'open') return [];
        return this.inner.getAvailableModels(apiKey, signal);
    }
}
