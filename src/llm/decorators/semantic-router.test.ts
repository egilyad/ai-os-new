import { describe, it, expect, vi } from 'vitest';
import { SemanticRouterDecorator } from './semantic-router';
import type { ChatMessage, LLMProviderAdapter } from '../core/types';

function msg(content: string): ChatMessage[] {
    return [{ role: 'user', content }] as unknown as ChatMessage[];
}

function makeAdapter(id: string): LLMProviderAdapter {
    return {
        id,
        sendMessage: vi.fn(async (_m: ChatMessage[], model: string) => ({
            content: `from-${id}-${model}`,
            tokens: 1,
        })),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => [`${id}-model`]),
    } as unknown as LLMProviderAdapter;
}

function makeRouter() {
    const fast = makeAdapter('fast-llm');
    const powerful = makeAdapter('pro-llm');
    const router = new SemanticRouterDecorator({
        fast: { adapter: fast, model: 'fast-model' },
        powerful: { adapter: powerful, model: 'pro-model' },
    });
    return { router, fast, powerful };
}

describe('SemanticRouterDecorator', () => {
    it('routes short simple prompts to the fast adapter and model', async () => {
        const { router, fast, powerful } = makeRouter();
        const res = await router.sendMessage(msg('hi'), 'auto', 'sk-1');
        expect(res.content).toBe('from-fast-llm-fast-model');
        expect(vi.mocked(fast.sendMessage)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(powerful.sendMessage)).not.toHaveBeenCalled();
    });

    it('routes long prompts to the powerful adapter', async () => {
        const { router, fast, powerful } = makeRouter();
        const res = await router.sendMessage(msg('x'.repeat(500)), 'auto', 'sk-1');
        expect(res.content).toBe('from-pro-llm-pro-model');
        expect(vi.mocked(fast.sendMessage)).not.toHaveBeenCalled();
    });

    it('routes code prompts to the powerful adapter', async () => {
        const { router, fast, powerful } = makeRouter();
        await router.sendMessage(msg('write function foo() {}'), 'auto', 'sk-1');
        expect(vi.mocked(powerful.sendMessage)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(fast.sendMessage)).not.toHaveBeenCalled();
    });

    it('keeps an explicit model instead of the route default', async () => {
        const { router, fast } = makeRouter();
        await router.sendMessage(msg('hi'), 'custom-model', 'sk-1');
        const calls = vi.mocked(fast.sendMessage).mock.calls;
        expect(calls).toHaveLength(1);
        expect(calls[0]?.[1]).toBe('custom-model');
    });

    it('checkHealth short-circuits on fast error', async () => {
        const { router, fast, powerful } = makeRouter();
        fast.checkHealth = vi.fn(async () => ({
            status: 'error' as const,
            latency: 0,
            models: [] as string[],
        }));
        const res = await router.checkHealth('sk-1');
        expect(res.status).toBe('error');
        expect(vi.mocked(powerful.checkHealth)).not.toHaveBeenCalled();
    });

    it('merges available models without duplicates', async () => {
        const { router, fast, powerful } = makeRouter();
        fast.getAvailableModels = vi.fn(async () => ['m1', 'm2']);
        powerful.getAvailableModels = vi.fn(async () => ['m2', 'm3']);
        expect(await router.getAvailableModels('sk-1')).toEqual(['m1', 'm2', 'm3']);
    });
});
