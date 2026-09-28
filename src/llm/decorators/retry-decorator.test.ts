import { describe, it, expect, vi } from 'vitest';
import { RetryDecorator } from './retry-decorator';
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

describe('RetryDecorator', () => {
    it('retries transient 5xx and returns the success', async () => {
        let calls = 0;
        const inner = makeInner(async () => {
            calls++;
            if (calls === 1) throw statusError(500);
            return { content: 'recovered', tokens: 5 };
        });
        const retry = new RetryDecorator(inner, 3, 1);
        const res = await retry.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(res.content).toBe('recovered');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(2);
    });

    it('does not retry 429 rate limits', async () => {
        const inner = makeInner(async () => {
            const { RetryableError } = await import('../core/errors');
            throw new RetryableError('slow', 'test', 429);
        });
        const retry = new RetryDecorator(inner, 3, 1);
        await expect(retry.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('slow');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
    });

    it('does not retry 401 auth errors', async () => {
        const inner = makeInner(async () => {
            const { RetryableError } = await import('../core/errors');
            throw new RetryableError('bad key', 'test', 401);
        });
        const retry = new RetryDecorator(inner, 3, 1);
        await expect(retry.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('bad key');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
    });

    it('gives up after maxRetries + 1 attempts', async () => {
        const inner = makeInner(async () => {
            throw statusError(500);
        });
        const retry = new RetryDecorator(inner, 2, 1);
        await expect(retry.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('HTTP 500');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(3);
    });

    it('throws immediately on pre-aborted signal without calling inner', async () => {
        const inner = makeInner(async () => {
            throw statusError(500);
        });
        const retry = new RetryDecorator(inner, 3, 1);
        const controller = new AbortController();
        controller.abort(new Error('user stop'));
        await expect(
            retry.sendMessage(MESSAGES, 'm', 'sk-1', controller.signal),
        ).rejects.toThrow();
        // Attempt 0 runs, then the aborted signal stops the retry loop.
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
    });
});
