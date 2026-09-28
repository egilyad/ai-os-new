import { describe, it, expect, vi } from 'vitest';
import { LoggingDecorator } from './logging-decorator';
import type { ChatMessage, LLMProviderAdapter, StreamMeta } from '../core/types';

const MESSAGES = [{ role: 'user', content: 'hi' }] as unknown as ChatMessage[];

function makeInner(
    impl?: () => Promise<{ content: string; tokens: number }>,
): LLMProviderAdapter {
    return {
        id: 'test',
        sendMessage: vi.fn(impl ?? (async () => ({ content: 'ok', tokens: 1 }))),
        streamMessage: vi.fn(
            async (
                _m: ChatMessage[],
                _model: string,
                _k: string,
                onChunk: (chunk: string, meta?: StreamMeta) => void,
            ) => {
                onChunk('a');
                onChunk('b');
            },
        ),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => []),
    } as unknown as LLMProviderAdapter;
}

describe('LoggingDecorator', () => {
    it('passes responses through untouched', async () => {
        const inner = makeInner();
        const logging = new LoggingDecorator(inner);
        const res = await logging.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(res).toEqual({ content: 'ok', tokens: 1 });
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
    });

    it('rethrows inner errors after logging', async () => {
        const inner = makeInner(async () => {
            throw new Error('boom');
        });
        const logging = new LoggingDecorator(inner);
        await expect(logging.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('boom');
    });

    it('forwards every stream chunk', async () => {
        const inner = makeInner();
        const logging = new LoggingDecorator(inner);
        const chunks: string[] = [];
        await logging.streamMessage(MESSAGES, 'm', 'sk-1', (c) => chunks.push(c));
        expect(chunks).toEqual(['a', 'b']);
    });

    it('passes health checks through', async () => {
        const inner = makeInner();
        const logging = new LoggingDecorator(inner);
        const res = await logging.checkHealth('sk-1');
        expect(res.status).toBe('active');
    });
});
