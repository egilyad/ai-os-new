import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreakerDecorator } from './circuit-breaker';
import type { ChatMessage, LLMProviderAdapter } from '../core/types';

const MESSAGES = [{ role: 'user', content: 'hi' }] as unknown as ChatMessage[];

function statusError(statusCode: number): Error {
    return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode });
}

function makeInner(
    impl?: () => Promise<{ content: string; tokens: number }>,
): LLMProviderAdapter {
    return {
        id: 'test',
        sendMessage: vi.fn(impl ?? (async () => ({ content: 'ok', tokens: 1 }))),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => []),
    } as unknown as LLMProviderAdapter;
}

function makeBreaker(inner: LLMProviderAdapter) {
    return new CircuitBreakerDecorator(
        inner,
        { failureThreshold: 5, successThreshold: 1, openTimeoutMs: 1000, halfOpenMaxRequests: 1 },
    );
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('CircuitBreakerDecorator', () => {
    it('starts closed and passes calls through', async () => {
        const inner = makeInner();
        const cb = makeBreaker(inner);
        expect(cb.peekState('sk-1')).toBe('closed');
        await cb.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
        expect(cb.peekState('sk-1')).toBe('closed');
    });

    it('opens after two 5xx failures without waiting for the full threshold', async () => {
        const inner = makeInner(async () => {
            throw statusError(500);
        });
        const cb = makeBreaker(inner);
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('HTTP 500');
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('HTTP 500');
        expect(cb.getState('sk-1')).toBe('open');
        // Open circuit fails fast without touching the inner adapter.
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow(/Circuit breaker is OPEN/);
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(2);
    });

    it('deliberately does not open on 429 rate limit', async () => {
        // Design intent (see NON_CIRCUIT_HTTP_STATUSES): opening on 429 would
        // block ALL keys via hasAnyOpenCircuit when a single key is limited.
        const inner = makeInner(async () => {
            throw statusError(429);
        });
        const cb = makeBreaker(inner);
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        expect(cb.getState('sk-1')).toBe('closed');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(2);
    });

    it('never opens on 401 auth errors', async () => {
        const inner = makeInner(async () => {
            throw statusError(401);
        });
        const cb = makeBreaker(inner);
        for (let i = 0; i < 5; i++) {
            await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('HTTP 401');
        }
        expect(cb.getState('sk-1')).toBe('closed');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(5);
    });

    it('does not count user aborts as failures', async () => {
        const inner = makeInner(async () => {
            throw new DOMException('The operation was aborted', 'AbortError');
        });
        const cb = makeBreaker(inner);
        const controller = new AbortController();
        controller.abort();
        await expect(
            cb.sendMessage(MESSAGES, 'm', 'sk-1', controller.signal),
        ).rejects.toThrow('aborted');
        expect(cb.getState('sk-1')).toBe('closed');
    });

    it('transitions open → half-open → closed after successes', async () => {
        let fail = true;
        const inner = makeInner(async () => {
            if (fail) throw statusError(503);
            return { content: 'ok', tokens: 1 };
        });
        const cb = makeBreaker(inner);
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        expect(cb.getState('sk-1')).toBe('open');
        vi.setSystemTime(Date.now() + 1500);
        expect(cb.getState('sk-1')).toBe('half-open');
        fail = false;
        await cb.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(cb.peekState('sk-1')).toBe('closed');
    });

    it('forceReset clears an open circuit', async () => {
        const inner = makeInner(async () => {
            throw statusError(500);
        });
        const cb = makeBreaker(inner);
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        await expect(cb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        expect(cb.getState('sk-1')).toBe('open');
        cb.forceReset('sk-1');
        expect(cb.peekState('sk-1')).toBe('closed');
    });
});
