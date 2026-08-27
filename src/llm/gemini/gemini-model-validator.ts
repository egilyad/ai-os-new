import { ModelValidationError } from '../core/errors';
import { rootLogger } from '../../kernel/services/logger-service';

const MODEL_NAME_RE = /^[a-zA-Z0-9_.-]+$/;
const MODEL_CACHE_TTL = 5 * 60 * 1000;

const FAILED_KEY_RETRY_MS = 10 * 60 * 1000;

function hashKey(apiKey: string): string {
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
        const chr = apiKey.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return `k_${Math.abs(hash).toString(36)}`;
}

class ModelCache {
    private cache = new Map<string, { models: Set<string>; timestamp: number }>();
    private fetchPromises = new Map<string, Promise<Set<string>>>();
    private refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private fetcher: ((apiKey: string) => Promise<Set<string>>) | null = null;
    private failedKeys = new Map<string, number>();
    private static readonly MAX_CACHE_SIZE = 100;
    private static readonly MAX_FETCH_PROMISES = 50;

    private k(apiKey: string): string {
        return hashKey(apiKey);
    }

    setFetcher(fn: (apiKey: string) => Promise<Set<string>>): void {
        this.fetcher = fn;
    }

    markFailed(apiKey: string): void {
        const h = this.k(apiKey);
        this.failedKeys.set(h, Date.now() + FAILED_KEY_RETRY_MS);
        this.clearTimer(apiKey);
        this.fetchPromises.delete(h);
        this.cache.delete(h);
        // Schedule a retry after the backoff window so the circuit breaker recovers proactively
        const existingRetry = this.retryTimers.get(h);
        if (existingRetry) clearTimeout(existingRetry);
        this.retryTimers.set(
            h,
            setTimeout(() => {
                this.retryTimers.delete(h);
                this.refresh(apiKey);
            }, FAILED_KEY_RETRY_MS),
        );
    }

    private isKeyFailed(apiKey: string): boolean {
        const h = this.k(apiKey);
        const retryAt = this.failedKeys.get(h);
        if (!retryAt) return false;
        if (Date.now() >= retryAt) {
            this.failedKeys.delete(h);
            return false;
        }
        return true;
    }

    private cleanupCache(): void {
        if (this.cache.size > ModelCache.MAX_CACHE_SIZE) {
            const toRemove = this.cache.size - ModelCache.MAX_CACHE_SIZE;
            let count = 0;
            for (const [h] of this.cache.entries()) {
                if (count >= toRemove) break;
                this.cache.delete(h);
                count++;
            }
        }
    }

    private clearTimer(apiKey: string): void {
        const h = this.k(apiKey);
        const timer = this.refreshTimers.get(h);
        if (timer) {
            clearTimeout(timer);
            this.refreshTimers.delete(h);
        }
    }

    destroy(): void {
        this.cache.clear();
        this.fetchPromises.clear();
        this.failedKeys.clear();
        for (const timer of this.refreshTimers.values()) {
            clearTimeout(timer);
        }
        this.refreshTimers.clear();
        for (const timer of this.retryTimers.values()) {
            clearTimeout(timer);
        }
        this.retryTimers.clear();
    }

    private scheduleRefresh(apiKey: string): void {
        this.clearTimer(apiKey);
        const h = this.k(apiKey);
        const delay = MODEL_CACHE_TTL * 0.8;
        this.refreshTimers.set(
            h,
            setTimeout(() => {
                this.refresh(apiKey);
            }, delay),
        );
    }

    private async refresh(apiKey: string): Promise<void> {
        if (!this.fetcher) return;
        if (this.isKeyFailed(apiKey)) return;
        const h = this.k(apiKey);
        const existing = this.fetchPromises.get(h);
        if (existing) return;
        if (this.fetchPromises.size >= ModelCache.MAX_FETCH_PROMISES) return;
        const promise = this.fetcher(apiKey);
        this.fetchPromises.set(h, promise);
        try {
            const models = await promise;
            this.cache.set(h, { models, timestamp: Date.now() });
            this.cleanupCache();
            this.scheduleRefresh(apiKey);
        } catch {
            this.markFailed(apiKey);
        } finally {
            this.fetchPromises.delete(h);
        }
    }

    async get(apiKey: string): Promise<Set<string>> {
        if (this.isKeyFailed(apiKey)) return new Set();
        const h = this.k(apiKey);

        const cached = this.cache.get(h);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < MODEL_CACHE_TTL) {
                if (age > MODEL_CACHE_TTL * 0.8) this.refresh(apiKey);
                return cached.models;
            }
        }
        if (!this.fetcher) return new Set();

        const existingPromise = this.fetchPromises.get(h);
        if (existingPromise) return existingPromise;

        if (this.fetchPromises.size >= ModelCache.MAX_FETCH_PROMISES) {
            return cached?.models ?? new Set();
        }

        const promise = this.fetcher(apiKey);
        this.fetchPromises.set(h, promise);

        try {
            const models = await promise;
            this.cache.set(h, { models, timestamp: Date.now() });
            this.cleanupCache();
            return models;
        } catch {
            this.markFailed(apiKey);
            return cached?.models ?? new Set();
        } finally {
            this.fetchPromises.delete(h);
        }
    }
}

export const modelCache = new ModelCache();

export function sanitizeModel(model: string): void {
    if (!MODEL_NAME_RE.test(model)) {
        throw new ModelValidationError(model, 'contains disallowed characters', 'gemini');
    }
}

export async function validateModel(model: string, apiKey: string): Promise<string> {
    sanitizeModel(model);
    // Non-blocking background fetch of cached model list to prevent delaying execution
    void modelCache
        .get(apiKey)
        .then((cached) => {
            if (cached && cached.size > 0 && !cached.has(model)) {
                rootLogger.warn(
                    'GeminiModelValidator',
                    `Model "${model}" not in recent model list — may fail at runtime`,
                );
            }
        })
        .catch((e) =>
            rootLogger.error('GeminiModelValidator', 'Model list fetch failed', { error: e }),
        );
    return model;
}
