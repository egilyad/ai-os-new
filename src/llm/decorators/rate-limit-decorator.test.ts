import { describe, it, expect, vi } from 'vitest';
import { RateLimitDecorator } from './rate-limit-decorator';
import type { ChatMessage, LLMProviderAdapter } from '../core/types';

const MESSAGES = [{ role: 'user', content: 'hi' }] as unknown as ChatMessage[];

function makeInner(): LLMProviderAdapter {
    return {
        id: 'test',
        sendMessage: vi.fn(async () => ({ content: 'ok', tokens: 1 })),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => []),
    } as unknown as LLMProviderAdapter;
}

describe('RateLimitDecorator', () => {
    it('allows up to maxTokens then rejects with 429', async () => {
        const inner = makeInner();
        const rl = new RateLimitDecorator(inner, 2, 0, 60000);
        expect(rl.canSend()).toBe(true);
        await rl.sendMessage(MESSAGES, 'm', 'sk-1');
        await rl.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(rl.canSend()).toBe(false);
        await expect(rl.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow(/Rate limit exceeded/);
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(2);
    });

    it('не умножает лимит на число вкладок', async () => {
        const inner = makeInner();
        let shared = {
            provider: 'unknown',
            keyId: 'test',
            remaining: 0,
            resetAt: Date.now() + 60_000,
        };
        const sync = {
            updateRateLimit: vi.fn((state: typeof shared) => {
                shared = state;
            }),
            getRateLimit: vi.fn(() => shared),
        };
        const rl = new RateLimitDecorator(inner, 5, 0, 60_000, sync as never);
        expect(rl.canSend()).toBe(false);
        await expect(rl.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow(/another tab/);
        shared = { ...shared, resetAt: Date.now() - 1 };
        expect(rl.canSend()).toBe(true);
    });

    it('forceLimited blocks everything until reset', async () => {
        const inner = makeInner();
        const rl = new RateLimitDecorator(inner, 10, 0, 60000);
        rl.forceLimited();
        expect(rl.canSend()).toBe(false);
        await expect(rl.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow();
        expect(vi.mocked(inner.sendMessage)).not.toHaveBeenCalled();
        rl.reset();
        expect(rl.canSend()).toBe(true);
        await rl.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
    });

    it('shares one bucket across sequential sends with zero refill', async () => {
        const inner = makeInner();
        const rl = new RateLimitDecorator(inner, 1, 0, 60000);
        await rl.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(rl.canSend()).toBe(false);
    });

    it('keyed canSend reflects individual buckets, keyless is conservative (L-16)', async () => {
        const inner = makeInner();
        const rl = new RateLimitDecorator(inner, 1, 0, 60000);
        expect(rl.canSend('sk-new')).toBe(true);
        await rl.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(rl.canSend('sk-1')).toBe(false);
        // No-key check reports limited when ANY bucket is exhausted.
        expect(rl.canSend()).toBe(false);
    });
});
