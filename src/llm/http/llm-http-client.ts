import { AuthError, RetryableError, LLMError } from '../core/errors';
import { rootLogger } from '../../kernel/services/logger-service';
export { sanitizeObject, sanitizeError, sanitizeApiKey } from '../../shared/utils/sanitize';

const LOGGER = rootLogger.child('LlmHttpClient');

export interface HttpResult {
    data: unknown;
    latency: number;
    response: Response;
}

/**
 * Max HTTP-layer timeout for provider calls. Must exceed the debate caller's
 * large-model window (90s), otherwise the HTTP-layer timer fires first with a
 * bare AbortError that the caller classifies as a no-retry user-abort → the
 * agent silently loses its turn (see G-01 fix in AGENTS.md).
 */
export const PROVIDER_HTTP_TIMEOUT_MS = 120000;

export class LLMHttpClient {
    readonly #baseUrl: string;
    readonly #defaultHeaders: Record<string, string>;
    readonly #authHeaderName: string;
    readonly #provider: string;
    readonly #timeoutMs: number;

    /** Semaphore concurrency limit — max concurrent HTTP requests across all instances. */
    private static readonly MAX_CONCURRENT = 50;
    private static _activeCount = 0;
    private static _waitingQueue: Array<() => void> = [];

    /** Acquire a concurrency slot — waits if at MAX_CONCURRENT. */
    private static acquireSlot(): Promise<void> {
        if (LLMHttpClient._activeCount < LLMHttpClient.MAX_CONCURRENT) {
            LLMHttpClient._activeCount++;
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            LLMHttpClient._waitingQueue.push(resolve);
        });
    }

    /** Release a concurrency slot — wakes the next waiter if any. */
    private static releaseSlot(): void {
        const next = LLMHttpClient._waitingQueue.shift();
        if (next) {
            next();
        } else {
            LLMHttpClient._activeCount--;
        }
    }

    /** Global registry of in-flight HTTP requests for memory-pressure cancellation. */
    private static readonly _inflight = new Map<
        symbol,
        {
            controller: AbortController;
            startedAt: number;
            provider: string;
            path: string;
        }
    >();

    /** Cancel the longest-running in-flight request. Returns true if cancelled. */
    static cancelLongestRunning(): boolean {
        let oldest: symbol | null = null;
        let oldestStart = Infinity;
        for (const [key, entry] of LLMHttpClient._inflight) {
            if (entry.startedAt < oldestStart) {
                oldestStart = entry.startedAt;
                oldest = key;
            }
        }
        if (oldest) {
            const entry = LLMHttpClient._inflight.get(oldest);
            entry?.controller.abort(
                new DOMException('Cancelled under memory pressure', 'AbortError'),
            );
            LLMHttpClient._inflight.delete(oldest);
            return true;
        }
        return false;
    }

    /** Cancel ALL in-flight requests. */
    static cancelAll(): number {
        const count = LLMHttpClient._inflight.size;
        for (const [, entry] of LLMHttpClient._inflight) {
            entry.controller.abort(
                new DOMException('Cancelled under memory pressure', 'AbortError'),
            );
        }
        LLMHttpClient._inflight.clear();
        return count;
    }

    /** Number of currently in-flight requests. */
    static getInFlightCount(): number {
        return LLMHttpClient._inflight.size;
    }

    constructor(
        baseUrl: string,
        defaultHeaders: Record<string, string> = {},
        authHeaderName = 'x-goog-api-key',
        provider = 'unknown',
        timeoutMs = 60000,
    ) {
        this.#baseUrl = baseUrl;
        this.#defaultHeaders = defaultHeaders;
        this.#authHeaderName = authHeaderName;
        this.#provider = provider;
        this.#timeoutMs = timeoutMs;
    }

    #withTimeout(signal?: AbortSignal): { signal: AbortSignal; controller: AbortController } {
        if (!signal) {
            const ctrl = new AbortController();
            setTimeout(
                () => ctrl.abort(new DOMException('Timeout', 'TimeoutError')),
                this.#timeoutMs,
            );
            return { signal: ctrl.signal, controller: ctrl };
        }
        // Avoid AbortSignal.any() due to Chrome GC bug:
        // AbortSignal.any() does not release internal onabort handlers
        // from constituent signals when the composed signal is GC'd,
        // causing the entire closure chain (including LLM response body)
        // to remain pinned in memory.
        // Instead, use a manual AbortController + setTimeout that avoids
        // creating a composed signal whose lifecycle depends on GC.
        const controller = new AbortController();
        const timer = setTimeout(
            () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
            this.#timeoutMs,
        );
        if (signal.aborted) {
            clearTimeout(timer);
            controller.abort(signal.reason || new DOMException('Aborted', 'AbortError'));
        } else {
            signal.addEventListener(
                'abort',
                () => {
                    clearTimeout(timer);
                    controller.abort(signal.reason || new DOMException('Aborted', 'AbortError'));
                },
                { once: true },
            );
        }
        return { signal: controller.signal, controller };
    }

    /** Register an in-flight request and return a dispose function. */
    #trackInFlight(controller: AbortController, path: string): () => void {
        const key = Symbol('inflight');
        LLMHttpClient._inflight.set(key, {
            controller,
            startedAt: Date.now(),
            provider: this.#provider,
            path,
        });
        return () => {
            LLMHttpClient._inflight.delete(key);
        };
    }

    #handleFetchError(err: unknown, mergedSignal: AbortSignal): never {
        const reason = mergedSignal.reason;
        const isTimeout =
            (err as DOMException)?.name === 'TimeoutError' ||
            (reason as DOMException)?.name === 'TimeoutError' ||
            (reason as DOMException)?.message === 'Timeout';
        if (isTimeout) {
            throw new LLMError(
                `${this.#provider} request timed out after ${this.#timeoutMs}ms`,
                this.#provider,
                408,
            );
        }
        if (err instanceof Error) throw err;
        throw new DOMException('Aborted', 'AbortError');
    }

    async post(
        path: string,
        body: unknown,
        apiKey: string,
        signal?: AbortSignal,
    ): Promise<HttpResult> {
        await LLMHttpClient.acquireSlot();
        const start = Date.now();
        const bodyStr = JSON.stringify(body);
        if (import.meta.env.DEV) {
            console.debug(`[${this.#provider}] POST ${path} size:${bodyStr.length}`);
        }
        const { signal: mergedSignal, controller } = this.#withTimeout(signal);
        const done = this.#trackInFlight(controller, path);
        try {
            let res: Response;
            try {
                res = await fetch(`${this.#baseUrl}${path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.#defaultHeaders,
                        [this.#authHeaderName]: apiKey,
                    },
                    body: bodyStr,
                    signal: mergedSignal,
                });
            } catch (err) {
                this.#handleFetchError(err, mergedSignal);
            }

            if (mergedSignal.aborted) {
                res.body?.cancel()?.catch(() => {});
                this.#handleFetchError(mergedSignal.reason, mergedSignal);
            }

            if (res.status === 401 || res.status === 403) {
                res.body?.cancel()?.catch(() => {});
                throw new AuthError(this.#provider);
            }
            if (res.status === 402) {
                res.body?.cancel()?.catch(() => {});
                throw new AuthError(
                    `Payment Required — add funds or check key`,
                    this.#provider,
                    402,
                );
            }
            if (res.status === 429) {
                res.body?.cancel()?.catch(() => {});
                const retryAfter = parseRetryAfter(res);
                throw new RetryableError(
                    `Rate limited`,
                    this.#provider,
                    429,
                    undefined,
                    retryAfter,
                );
            }
            if (res.status >= 500) {
                res.body?.cancel()?.catch(() => {});
                const retryAfter = parseRetryAfter(res);
                throw new RetryableError(
                    `Server error ${res.status}`,
                    this.#provider,
                    res.status,
                    undefined,
                    retryAfter,
                );
            }
            if (!res.ok) {
                const errorBody = await res.text().catch(() => {
                    res.body?.cancel()?.catch(() => {});
                    return '';
                });
                if (import.meta.env.DEV) {
                    LOGGER.warn('LlmHttpClient', `[${this.#provider}] POST ${res.status} body`, {
                        body: errorBody.slice(0, 500),
                    });
                }
                throw new LLMError(
                    `HTTP ${res.status}: ${errorBody.slice(0, 200)}`,
                    this.#provider,
                    res.status,
                );
            }

            let data: Record<string, unknown>;
            try {
                data = await res.json();
            } catch {
                res.body?.cancel()?.catch(() => {});
                const text = await res.text().catch(() => '');
                throw new LLMError(
                    `Invalid JSON response from ${this.#provider}: ${text.slice(0, 200)}`,
                    this.#provider,
                    res.status,
                );
            }
            const latency = Date.now() - start;
            return { data, latency, response: res };
        } finally {
            done();
            LLMHttpClient.releaseSlot();
        }
    }

    async get(path: string, apiKey: string, signal?: AbortSignal): Promise<HttpResult> {
        await LLMHttpClient.acquireSlot();
        const start = Date.now();
        const { signal: mergedSignal, controller } = this.#withTimeout(signal);
        const done = this.#trackInFlight(controller, path);
        try {
            let res: Response;
            try {
                res = await fetch(`${this.#baseUrl}${path}`, {
                    method: 'GET',
                    headers: {
                        ...this.#defaultHeaders,
                        [this.#authHeaderName]: apiKey,
                    },
                    signal: mergedSignal,
                });
            } catch (err) {
                this.#handleFetchError(err, mergedSignal);
            }

            if (mergedSignal.aborted) {
                res.body?.cancel()?.catch(() => {});
                this.#handleFetchError(mergedSignal.reason, mergedSignal);
            }

            if (res.status === 401 || res.status === 403) {
                res.body?.cancel()?.catch(() => {});
                throw new AuthError(this.#provider);
            }
            if (res.status === 402) {
                res.body?.cancel()?.catch(() => {});
                throw new AuthError(
                    `Payment Required — add funds or check key`,
                    this.#provider,
                    402,
                );
            }
            if (res.status === 429) {
                res.body?.cancel()?.catch(() => {});
                const retryAfter = parseRetryAfter(res);
                throw new RetryableError(
                    `Rate limited`,
                    this.#provider,
                    429,
                    undefined,
                    retryAfter,
                );
            }
            if (!res.ok) {
                const errorBody = await res.text().catch(() => {
                    res.body?.cancel()?.catch(() => {});
                    return '';
                });
                if (import.meta.env.DEV) {
                    LOGGER.warn('LlmHttpClient', `[${this.#provider}] GET ${res.status} body`, {
                        body: errorBody.slice(0, 500),
                    });
                }
                throw new LLMError(
                    `HTTP ${res.status}: ${errorBody.slice(0, 200)}`,
                    this.#provider,
                    res.status,
                );
            }

            let data: Record<string, unknown>;
            try {
                data = await res.json();
            } catch {
                res.body?.cancel()?.catch(() => {});
                const text = await res.text().catch(() => '');
                throw new LLMError(
                    `Invalid JSON response from ${this.#provider}: ${text.slice(0, 200)}`,
                    this.#provider,
                    res.status,
                );
            }
            const latency = Date.now() - start;
            return { data, latency, response: res };
        } finally {
            done();
            LLMHttpClient.releaseSlot();
        }
    }

    async streamPost(
        path: string,
        body: unknown,
        apiKey: string,
        signal?: AbortSignal,
    ): Promise<Response> {
        await LLMHttpClient.acquireSlot();
        const { signal: mergedSignal, controller } = this.#withTimeout(signal);
        const done = this.#trackInFlight(controller, path);
        try {
            let res: Response;
            try {
                res = await fetch(`${this.#baseUrl}${path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.#defaultHeaders,
                        [this.#authHeaderName]: apiKey,
                    },
                    body: JSON.stringify(body),
                    signal: mergedSignal,
                });
            } catch (err) {
                this.#handleFetchError(err, mergedSignal);
            }

            if (mergedSignal.aborted) {
                res.body?.cancel()?.catch(() => {});
                this.#handleFetchError(mergedSignal.reason, mergedSignal);
            }

            if (res.status === 401 || res.status === 403) {
                res.body?.cancel()?.catch(() => {});
                throw new AuthError(this.#provider);
            }
            if (res.status === 402) {
                res.body?.cancel()?.catch(() => {});
                throw new AuthError(
                    `Payment Required — add funds or check key`,
                    this.#provider,
                    402,
                );
            }
            if (res.status === 429) {
                res.body?.cancel()?.catch(() => {});
                const retryAfter = parseRetryAfter(res);
                throw new RetryableError(
                    `Rate limited`,
                    this.#provider,
                    429,
                    undefined,
                    retryAfter,
                );
            }
            if (!res.ok) {
                const errorBody = await res.text().catch(() => {
                    res.body?.cancel()?.catch(() => {});
                    return '';
                });
                if (import.meta.env.DEV) {
                    LOGGER.warn('LlmHttpClient', `[${this.#provider}] STREAM ${res.status} body`, {
                        body: errorBody.slice(0, 500),
                    });
                }
                throw new LLMError(
                    `HTTP ${res.status}: ${errorBody.slice(0, 200)}`,
                    this.#provider,
                    res.status,
                );
            }

            return res;
        } finally {
            done();
            LLMHttpClient.releaseSlot();
        }
    }
}

export function parseRetryAfterHeader(header: string | null): number | undefined {
    if (!header) return undefined;
    const seconds = parseInt(header, 10);
    if (!isNaN(seconds) && seconds > 0) return seconds * 1000;
    const parsed = Date.parse(header);
    if (!isNaN(parsed)) return Math.max(0, parsed - Date.now());
    return undefined;
}

function parseRetryAfter(res: Response): number | undefined {
    return parseRetryAfterHeader(res.headers.get('Retry-After'));
}
