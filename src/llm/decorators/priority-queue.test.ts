import { describe, it, expect, vi } from 'vitest';
import { PriorityQueueDecorator } from './priority-queue';
import type { ChatMessage, LLMProviderAdapter, SendMessageOptions } from '../core/types';

const MESSAGES = [{ role: 'user', content: 'hi' }] as unknown as ChatMessage[];

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function makeInner() {
    const pending = new Map<string, ReturnType<typeof deferred<{ content: string }>>>();
    const sendMessage = vi.fn(
        async (messages: ChatMessage[], model: string, _apiKey: string) => {
            const gate = deferred<{ content: string }>();
            pending.set(model, gate);
            return gate.promise;
        },
    );
    const adapter = {
        id: 'test',
        sendMessage,
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => []),
    } as unknown as LLMProviderAdapter;
    return { adapter, sendMessage, pending };
}

describe('PriorityQueueDecorator', () => {
    it('serves high priority before low under contention', async () => {
        const { adapter, sendMessage, pending } = makeInner();
        const pq = new PriorityQueueDecorator(adapter, {
            maxConcurrency: 1,
            lowPriorityDelayMs: 5,
            maxQueueSize: 100,
        });
        const opts = (priority: 'high' | 'normal' | 'low'): SendMessageOptions =>
            ({ priority }) as SendMessageOptions;
        const pa = pq.sendMessage(MESSAGES, 'm-a', 'k', undefined, opts('normal'));
        const pb = pq.sendMessage(MESSAGES, 'm-b', 'k', undefined, opts('low'));
        const pc = pq.sendMessage(MESSAGES, 'm-c', 'k', undefined, opts('high'));
        // Let B's low-priority delay elapse so all three are decided.
        await new Promise((r) => setTimeout(r, 25));
        pending.get('m-a')!.resolve({ content: 'a' });
        await expect(pa).resolves.toEqual({ content: 'a' });
        // High (m-c) must be served before low (m-b).
        expect(sendMessage.mock.calls.map((c) => c[1])).toEqual(['m-a', 'm-c']);
        pending.get('m-c')!.resolve({ content: 'c' });
        await expect(pc).resolves.toEqual({ content: 'c' });
        pending.get('m-b')!.resolve({ content: 'b' });
        await expect(pb).resolves.toEqual({ content: 'b' });
        expect(sendMessage.mock.calls.map((c) => c[1])).toEqual(['m-a', 'm-c', 'm-b']);
    });

    it('rejects when the queue is full', async () => {
        const { adapter, sendMessage } = makeInner();
        const pq = new PriorityQueueDecorator(adapter, {
            maxConcurrency: 1,
            lowPriorityDelayMs: 1,
            maxQueueSize: 1,
        });
        const p1 = pq.sendMessage(MESSAGES, 'm-1', 'k');
        void p1.catch(() => {});
        const p2 = pq.sendMessage(MESSAGES, 'm-2', 'k');
        void p2.catch(() => {});
        await expect(pq.sendMessage(MESSAGES, 'm-3', 'k')).rejects.toThrow(/Queue is full/);
        expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on pre-aborted signal without calling inner', async () => {
        const { adapter, sendMessage } = makeInner();
        const pq = new PriorityQueueDecorator(adapter, { maxConcurrency: 1 });
        const controller = new AbortController();
        controller.abort();
        await expect(pq.sendMessage(MESSAGES, 'm', 'k', controller.signal)).rejects.toThrow();
        expect(sendMessage).not.toHaveBeenCalled();
    });
});
