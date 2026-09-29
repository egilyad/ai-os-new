import { describe, it, expect, vi } from 'vitest';
import { CompressRouteDecorator } from './compress-route';
import type { ChatMessage, LLMProviderAdapter } from '../core/types';

function msg(content: string): ChatMessage[] {
    return [{ role: 'user', content }] as unknown as ChatMessage[];
}

function makeInner(): LLMProviderAdapter {
    return {
        id: 'test',
        sendMessage: vi.fn(async () => ({ content: 'ok', tokens: 1 })),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => []),
    } as unknown as LLMProviderAdapter;
}

function receivedMessages(inner: LLMProviderAdapter): ChatMessage[][] {
    return vi.mocked(inner.sendMessage).mock.calls.map((c) => c[0] as ChatMessage[]);
}

describe('CompressRouteDecorator', () => {
    it('passes short messages through untouched', async () => {
        const inner = makeInner();
        const decorator = new CompressRouteDecorator(inner, { maxTokens: 10000 });
        const input = msg('hi');
        await decorator.sendMessage(input, 'm', 'sk-1');
        const received = receivedMessages(inner);
        expect(received).toHaveLength(1);
        expect(received[0]).toBe(input);
    });

    it('compresses over-budget messages', async () => {
        const inner = makeInner();
        const decorator = new CompressRouteDecorator(inner, { maxTokens: 20 });
        const long = 'word '.repeat(200);
        await decorator.sendMessage(msg(long), 'm', 'sk-1');
        const received = receivedMessages(inner);
        expect(received).toHaveLength(1);
        const outText = received[0]!.map((m) => m.content).join(' ');
        expect(outText.length).toBeLessThan(long.length);
    });

    it('skips compression when disabled', async () => {
        const inner = makeInner();
        const decorator = new CompressRouteDecorator(inner, { enabled: false, maxTokens: 1 });
        const input = msg('word '.repeat(200));
        await decorator.sendMessage(input, 'm', 'sk-1');
        expect(receivedMessages(inner)[0]).toBe(input);
    });

    it('skips compression for tool messages', async () => {
        const inner = makeInner();
        const decorator = new CompressRouteDecorator(inner, { maxTokens: 1 });
        const input = [
            {
                role: 'assistant',
                content: 'calling',
                toolCalls: [{ id: 't1', type: 'function', function: { name: 'f', arguments: '{}' } }],
            },
        ] as unknown as ChatMessage[];
        await decorator.sendMessage(input, 'm', 'sk-1');
        expect(receivedMessages(inner)[0]).toBe(input);
    });

    it('records stats only when logStats is enabled', async () => {
        const inner = makeInner();
        const quiet = new CompressRouteDecorator(inner, { maxTokens: 20 });
        await quiet.sendMessage(msg('word '.repeat(200)), 'm', 'sk-1');
        expect(quiet.getCompressionStats()).toEqual({
            totalOriginal: 0,
            totalCompressed: 0,
            overallRatio: 1,
        });

        const noisy = makeInner();
        const loud = new CompressRouteDecorator(noisy, { maxTokens: 20, logStats: true });
        await loud.sendMessage(msg('word '.repeat(200)), 'm', 'sk-1');
        const stats = loud.getCompressionStats();
        expect(stats.totalOriginal).toBeGreaterThan(0);
        expect(stats.totalCompressed).toBeGreaterThan(0);
        loud.clearStats();
        expect(loud.getCompressionStats().totalOriginal).toBe(0);
    });
});
