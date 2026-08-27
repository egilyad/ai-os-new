import { CONFIG } from '../config-registry';
import { isLargeModel } from './debate-query-engine';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('DebateLlmCaller');

// Memory profiling: log heap changes per LLM call (visible in DevTools console)
export function getHeapMB(): number {
    try {
        const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        return mem ? Math.round(mem.usedJSHeapSize / (1024 * 1024)) : 0;
    } catch {
        return 0;
    }
}
export function logMemory(label: string, beforeMB: number): void {
    const afterMB = getHeapMB();
    const deltaMB = afterMB - beforeMB;
    if (Math.abs(deltaMB) > 3) {
        LOGGER.debug('DebateLlmCaller', 'Memory snapshot', {
            label,
            beforeMB,
            afterMB,
            deltaMB: Math.round(deltaMB * 100) / 100,
        });
    }
}

// Re-read CONFIG on each call to reflect runtime overlay changes (config import drift fix).
export function getDebateTimeoutMs(): number {
    return CONFIG?.services?.debate?.debateTimeoutMs ?? 30000;
}
export function getLargeModelTimeoutMs(): number {
    return CONFIG?.services?.debate?.largeModelTimeoutMs ?? 90000;
}
export function getBaseBackoffMs(): number {
    return CONFIG?.services?.debate?.baseBackoffMs ?? 5000;
}
export function getMaxBackoffMs(): number {
    return CONFIG?.services?.debate?.maxBackoffMs ?? 30000;
}
export function getMaxRetries(): number {
    return CONFIG?.services?.debate?.maxRetries ?? 3;
}

// Cap on consecutive cross-agent-duplicate rejections within a single callLLM.
// Beyond this we assume the LLM cluster is producing pathological content
// (same response regardless of model/key) and we abort the call rather than
// spinning forever in the brute-force fallback loop.
export const MAX_DUPLICATE_REJECTIONS = 3;

export function getModelTimeout(modelId: string): number {
    return isLargeModel(modelId) ? getLargeModelTimeoutMs() : getDebateTimeoutMs();
}

/**
 * Wait for exponential backoff with support for external abort signal.
 * Used in two retry paths (timeout and failure count) to avoid duplicated
 * Promise/setTimeout/abort wiring.
 */
export async function backoffWait(attempt: number, externalSignal?: AbortSignal): Promise<void> {
    if (externalSignal?.aborted) throw new Error('Debate cancelled during backoff');
    const jitter = 0.5 + Math.random() * 0.5;
    const delay = Math.round(
        Math.min(getBaseBackoffMs() * Math.pow(2, attempt - 1), getMaxBackoffMs()) * jitter,
    );
    let _onAbort: (() => void) | undefined;
    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        _onAbort = () => {
            clearTimeout(timer);
            reject(new Error('Debate cancelled during backoff'));
        };
        if (externalSignal) externalSignal.addEventListener('abort', _onAbort, { once: true });
    });
    if (externalSignal && _onAbort) externalSignal.removeEventListener('abort', _onAbort);
}
