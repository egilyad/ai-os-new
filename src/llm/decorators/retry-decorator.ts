import { LLMError } from '../core/errors';
import type { ChatMessage, ProviderResponse, SendMessageOptions, StreamMeta } from '../core/types';
import { BaseDecorator } from '../core/base-decorator';
import { RetryableError } from '../core/errors';
import { FALLBACK_LOGGER } from '../../shared/utils/logger';
const LOGGER = FALLBACK_LOGGER.child('RetryDecorator');

export class RetryDecorator extends BaseDecorator {
    readonly #maxRetries: number;
    readonly #baseDelayMs: number;

    constructor(
        inner: import('../core/types').LLMProviderAdapter,
        maxRetries = 3,
        baseDelayMs = 1000,
    ) {
        super(inner);
        this.#maxRetries = maxRetries;
        this.#baseDelayMs = baseDelayMs;
    }

    private getDelayMs(attempt: number, error: unknown): number {
        if (error instanceof RetryableError && error.retryAfter !== undefined) {
            return error.retryAfter;
        }
        const base = this.#baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = base * (0.5 + Math.random());
        return Math.min(jitter, 30_000);
    }

    private shouldRetry(e: unknown, currentSignal?: AbortSignal): boolean {
        // Don't retry 429 — CircuitBreaker handles rate limit backoff by opening the circuit.
        // Retrying 429 inflates memory: 4× HTTP calls per rate-limited provider per request.
        if (e instanceof RetryableError && e.statusCode === 429) return false;
        // Don't retry 401/403 — auth errors won't resolve on retry, just waste quota.
        if (
            e instanceof RetryableError &&
            e.statusCode &&
            (e.statusCode === 401 || e.statusCode === 403)
        )
            return false;
        if (e instanceof RetryableError) return true;
        if (e instanceof TypeError) return true;

        if (e instanceof DOMException && e.name === 'AbortError') {
            return !currentSignal?.aborted;
        }

        if (e && typeof e === 'object' && 'statusCode' in e) {
            const sc = (e as { statusCode?: number }).statusCode;
            if (typeof sc === 'number' && sc >= 500 && sc < 600) return true;
        }

        return false;
    }

    private toRetryable(e: unknown): RetryableError {
        if (e instanceof RetryableError) return e;
        const msg = e instanceof Error ? e.message : String(e);
        const sc =
            e && typeof e === 'object' && 'statusCode' in e
                ? (e as { statusCode?: number }).statusCode
                : undefined;
        return new RetryableError(msg, this.inner.id, sc);
    }

    async sendMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<ProviderResponse> {
        let lastError: Error | undefined;
        for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    if (signal?.aborted) throw signal.reason || new Error('Aborted');
                    const delay = this.getDelayMs(attempt, lastError);
                    await new Promise<void>((resolve, reject) => {
                        const timer = setTimeout(() => {
                            signal?.removeEventListener('abort', onAbort);
                            resolve();
                        }, delay);
                        const onAbort = () => {
                            clearTimeout(timer);
                            reject(signal?.reason || new Error('Aborted'));
                        };
                        signal?.addEventListener('abort', onAbort, { once: true });
                    });
                }
                return await this.inner.sendMessage(messages, model, apiKey, signal, options);
            } catch (e) {
                if (!this.shouldRetry(e, signal)) throw e;
                if (signal?.aborted) throw e;
                lastError = this.toRetryable(e);
            }
        }
        throw lastError ?? new LLMError('Retry exhausted', this.inner.id);
    }

    async streamMessage(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: SendMessageOptions,
    ): Promise<void> {
        if (!this.inner.streamMessage)
            throw new Error('RetryDecorator: inner adapter does not support streaming');
        let lastError: Error | undefined;
        let hasEmittedChunks = false;
        const guardedChunk: typeof onChunk = (chunk, meta) => {
            hasEmittedChunks = true;
            onChunk(chunk, meta);
        };
        for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    if (signal?.aborted) throw signal.reason || new Error('Aborted');
                    if (hasEmittedChunks) {
                        throw (
                            lastError ??
                            new Error(
                                'Stream failed mid-response — no retry to avoid content mixing',
                            )
                        );
                    }
                    const delay = this.getDelayMs(attempt, lastError);
                    await new Promise<void>((resolve, reject) => {
                        const timer = setTimeout(() => {
                            signal?.removeEventListener('abort', onAbort);
                            resolve();
                        }, delay);
                        const onAbort = () => {
                            clearTimeout(timer);
                            reject(signal?.reason || new Error('Aborted'));
                        };
                        signal?.addEventListener('abort', onAbort, { once: true });
                    });
                }
                await this.inner.streamMessage(
                    messages,
                    model,
                    apiKey,
                    guardedChunk,
                    signal,
                    options,
                );
                return;
            } catch (e) {
                if (!this.shouldRetry(e, signal)) throw e;
                if (signal?.aborted) throw e;
                if (hasEmittedChunks) throw e;
                lastError = this.toRetryable(e);
                LOGGER.warn('RetryDecorator', 'Stream attempt failed', {
                    provider: this.inner.id,
                    attempt: attempt + 1,
                    maxRetries: this.#maxRetries + 1,
                    error: (e as Error).message,
                });
            }
        }
        throw lastError ?? new LLMError('Retry exhausted', this.inner.id);
    }

    destroy(): void {
        super.destroy();
    }
}
