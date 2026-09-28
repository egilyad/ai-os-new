import { describe, it, expect, vi } from 'vitest';
import { FallbackDecorator } from './fallback-decorator';
import { AuthError } from '../core/errors';
import type { ChatMessage, LLMProviderAdapter, StreamMeta } from '../core/types';

const MESSAGES = [{ role: 'user', content: 'hi' }] as unknown as ChatMessage[];

interface MockAdapter {
    adapter: LLMProviderAdapter;
    sendMessage: ReturnType<typeof vi.fn>;
    streamMessage: ReturnType<typeof vi.fn>;
}

function makeAdapter(
    id: string,
    overrides: Partial<{
        sendMessage: (messages: ChatMessage[], model: string, apiKey: string) => Promise<unknown>;
        streamMessage: (
            messages: ChatMessage[],
            model: string,
            apiKey: string,
            onChunk: (chunk: string, meta?: StreamMeta) => void,
        ) => Promise<void>;
    }> = {},
): MockAdapter {
    const sendMessage = vi.fn(
        overrides.sendMessage ?? (async () => ({ content: `from-${id}`, tokens: 1 })),
    );
    const streamMessage = vi.fn(
        overrides.streamMessage ??
            (async (
                _messages: ChatMessage[],
                _model: string,
                _key: string,
                onChunk: (chunk: string, meta?: StreamMeta) => void,
            ) => {
                onChunk(`chunk-${id}`);
            }),
    );
    const adapter = {
        id,
        sendMessage,
        streamMessage,
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => ['m1']),
    } as unknown as LLMProviderAdapter;
    return { adapter, sendMessage, streamMessage };
}

describe('FallbackDecorator', () => {
    it('returns primary result without touching fallback', async () => {
        const primary = makeAdapter('openai');
        const fallback = makeAdapter('anthropic');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        const res = await fb.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(res.content).toBe('from-openai');
        expect(fallback.sendMessage).not.toHaveBeenCalled();
    });

    it('falls back on transient primary failure', async () => {
        const primary = makeAdapter('openai', {
            sendMessage: async () => {
                throw new Error('boom');
            },
        });
        const fallback = makeAdapter('anthropic');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        const res = await fb.sendMessage(MESSAGES, 'm', 'sk-1');
        expect(res.content).toBe('from-anthropic');
        expect(fallback.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('does not fall back on auth errors', async () => {
        const primary = makeAdapter('openai', {
            sendMessage: async () => {
                throw new AuthError('bad key');
            },
        });
        const fallback = makeAdapter('anthropic');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        await expect(fb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('bad key');
        expect(fallback.sendMessage).not.toHaveBeenCalled();
    });

    it('skips fallback for the same provider type', async () => {
        const primary = makeAdapter('groq', {
            sendMessage: async () => {
                throw new Error('boom');
            },
        });
        const fallback = makeAdapter('groq-backup');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        await expect(fb.sendMessage(MESSAGES, 'm', 'sk-1')).rejects.toThrow('boom');
        expect(fallback.sendMessage).not.toHaveBeenCalled();
    });

    it('streams from fallback when primary fails before chunks', async () => {
        const primary = makeAdapter('openai', {
            streamMessage: async () => {
                throw new Error('boom');
            },
        });
        const fallback = makeAdapter('anthropic');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        const chunks: string[] = [];
        await fb.streamMessage(MESSAGES, 'm', 'sk-1', (c) => chunks.push(c));
        expect(chunks).toEqual(['chunk-anthropic']);
    });

    it('does not fall back mid-stream after chunks started', async () => {
        const primary = makeAdapter('openai', {
            streamMessage: async (
                _m: ChatMessage[],
                _model: string,
                _k: string,
                onChunk: (chunk: string, meta?: StreamMeta) => void,
            ) => {
                onChunk('partial');
                throw new Error('boom-mid');
            },
        });
        const fallback = makeAdapter('anthropic');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        const chunks: string[] = [];
        await expect(
            fb.streamMessage(MESSAGES, 'm', 'sk-1', (c) => chunks.push(c)),
        ).rejects.toThrow('boom-mid');
        expect(chunks).toEqual(['partial']);
        expect(fallback.streamMessage).not.toHaveBeenCalled();
    });

    it('checkHealth prefers primary, falls back when inactive', async () => {
        const primary = makeAdapter('openai');
        const fallback = makeAdapter('anthropic');
        const fb = new FallbackDecorator(primary.adapter, fallback.adapter);
        const ok = await fb.checkHealth('sk-1');
        expect(ok.status).toBe('active');

        const dead = makeAdapter('openai', {});
        dead.adapter.checkHealth = vi.fn(async () => ({
            status: 'error' as const,
            latency: 0,
            models: [] as string[],
        }));
        const fb2 = new FallbackDecorator(dead.adapter, fallback.adapter);
        const res = await fb2.checkHealth('sk-1');
        expect(res.status).toBe('active');
    });
});
