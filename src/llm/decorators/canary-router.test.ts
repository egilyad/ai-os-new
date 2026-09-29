import { describe, it, expect, vi } from 'vitest';
import { CanaryRouterDecorator } from './canary-router';
import type { ChatMessage, LLMProviderAdapter } from '../core/types';

function msg(content: string): ChatMessage[] {
    return [{ role: 'user', content }] as unknown as ChatMessage[];
}

function makeAdapter(id: string): LLMProviderAdapter {
    return {
        id,
        sendMessage: vi.fn(async () => ({ content: `from-${id}`, tokens: 10, latency: 5 })),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => [`${id}-model`]),
    } as unknown as LLMProviderAdapter;
}

describe('CanaryRouterDecorator', () => {
    it('requires at least two targets', () => {
        const a = makeAdapter('a');
        expect(
            () => new CanaryRouterDecorator({ targets: [{ adapter: a, model: 'm', weight: 1 }], stickySession: false }),
        ).toThrow(/at least 2 targets/);
    });

    it('sticky sessions route identical messages to the same target', async () => {
        const a = makeAdapter('a');
        const b = makeAdapter('b');
        const router = new CanaryRouterDecorator({
            targets: [
                { adapter: a, model: 'ma', weight: 1 },
                { adapter: b, model: 'mb', weight: 1 },
            ],
            stickySession: true,
        });
        const first = await router.sendMessage(msg('same question'), 'auto', 'sk-1');
        const second = await router.sendMessage(msg('same question'), 'auto', 'sk-1');
        expect(second.content).toBe(first.content);
        const total =
            vi.mocked(a.sendMessage).mock.calls.length + vi.mocked(b.sendMessage).mock.calls.length;
        expect(total).toBe(2);
    });

    it('never picks zero-weight targets', async () => {
        const a = makeAdapter('a');
        const b = makeAdapter('b');
        const router = new CanaryRouterDecorator({
            targets: [
                { adapter: a, model: 'ma', weight: 1 },
                { adapter: b, model: 'mb', weight: 0 },
            ],
            stickySession: false,
        });
        for (let i = 0; i < 5; i++) {
            const res = await router.sendMessage(msg(`q${i}`), 'auto', 'sk-1');
            expect(res.content).toBe('from-a');
        }
        expect(vi.mocked(b.sendMessage)).not.toHaveBeenCalled();
    });

    it('records results and summarizes per target', async () => {
        const a = makeAdapter('a');
        const b = makeAdapter('b');
        const router = new CanaryRouterDecorator({
            targets: [
                { adapter: a, model: 'ma', weight: 1 },
                { adapter: b, model: 'mb', weight: 0 },
            ],
            stickySession: false,
        });
        await router.sendMessage(msg('q'), 'auto', 'sk-1');
        const results = router.getResults();
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ target: 'a', model: 'ma', success: true });
        const summary = router.getSummary();
        expect(summary['a']?.requests).toBe(1);
        expect(summary['a']?.errors).toBe(0);
        expect(summary['b']?.requests).toBe(0);
        router.clearResults();
        expect(router.getResults()).toHaveLength(0);
    });

    it('checkHealth falls back when control is down', async () => {
        const a = makeAdapter('a');
        const b = makeAdapter('b');
        a.checkHealth = vi.fn(async () => ({ status: 'error' as const, latency: 0, models: [] as string[] }));
        const router = new CanaryRouterDecorator({
            targets: [
                { adapter: a, model: 'ma', weight: 1 },
                { adapter: b, model: 'mb', weight: 1 },
            ],
            stickySession: false,
        });
        const res = await router.checkHealth('sk-1');
        expect(res.status).toBe('active');
        expect(vi.mocked(b.checkHealth)).toHaveBeenCalledTimes(1);
    });

    it('merges available models without duplicates', async () => {
        const a = makeAdapter('a');
        const b = makeAdapter('b');
        a.getAvailableModels = vi.fn(async () => ['m1', 'm2']);
        b.getAvailableModels = vi.fn(async () => ['m2', 'm3']);
        const router = new CanaryRouterDecorator({
            targets: [
                { adapter: a, model: 'ma', weight: 1 },
                { adapter: b, model: 'mb', weight: 1 },
            ],
            stickySession: false,
        });
        expect(await router.getAvailableModels('sk-1')).toEqual(['m1', 'm2', 'm3']);
    });
});
