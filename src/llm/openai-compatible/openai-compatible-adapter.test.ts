/**
 * OpenAiCompatibleAdapter streaming tool_calls (Phase 70, трасса B-3).
 * Без склейки delta.tool_calls streaming-режим терял вызовы инструментов.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAiCompatibleAdapter } from './openai-compatible-adapter';

function sseResponse(events: string): Response {
    const bytes = new TextEncoder().encode(events);
    const stream = new ReadableStream<Uint8Array>({
        start(c) {
            c.enqueue(bytes);
            c.close();
        },
    });
    return { ok: true, status: 200, body: stream } as Response;
}

describe('openai-compatible streaming tool_calls (B-3)', () => {
    const realFetch = globalThis.fetch;

    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
        vi.unstubAllGlobals();
    });

    it('glues chunked delta.tool_calls into final meta', async () => {
        const events = [
            'data: {"choices":[{"delta":{"role":"assistant","tool_calls":[{"index":0,"id":"call_1","function":{"name":"get_wea","arguments":""}}]}}]}\n\n',
            'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"name":"ther","arguments":"{\\"city\\""}}]}}]}\n\n',
            'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":":\\"x\\"}"}}]}}]}\n\n',
            'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}\n\n',
            'data: [DONE]\n\n',
        ].join('');
        vi.stubGlobal('fetch', vi.fn(async () => sseResponse(events)) as unknown as typeof fetch);
        const adapter = new OpenAiCompatibleAdapter('test-openai', 'https://api.test.local/v1', false);
        const chunks: string[] = [];
        const metas: unknown[] = [];
        await adapter.doStreamMessage(
            [{ role: 'user', content: 'weather' }],
            'model-x',
            'sk-test',
            (chunk, meta) => {
                chunks.push(chunk);
                if (meta) metas.push(meta);
            },
            undefined,
            undefined,
        );
        const last = metas[metas.length - 1] as {
            finishReason?: string;
            toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
        };
        expect(last.finishReason).toBe('TOOL_CALLS');
        expect(last.toolCalls).toHaveLength(1);
        expect(last.toolCalls?.[0]).toMatchObject({
            id: 'call_1',
            type: 'function',
            function: { name: 'get_weather', arguments: '{"city":"x"}' },
        });
    });

    it('emits no toolCalls meta when stream has only text', async () => {
        const events = [
            'data: {"choices":[{"delta":{"content":"hi"}}]}\n\n',
            'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
            'data: [DONE]\n\n',
        ].join('');
        vi.stubGlobal('fetch', vi.fn(async () => sseResponse(events)) as unknown as typeof fetch);
        const adapter = new OpenAiCompatibleAdapter('test-openai', 'https://api.test.local/v1', false);
        const texts: string[] = [];
        const metas: unknown[] = [];
        await adapter.doStreamMessage(
            [{ role: 'user', content: 'hi' }],
            'model-x',
            'sk-test',
            (chunk, meta) => {
                texts.push(chunk);
                if (meta) metas.push(meta);
            },
            undefined,
            undefined,
        );
        expect(texts.join('')).toBe('hi');
        const last = metas[metas.length - 1] as { toolCalls?: unknown };
        expect(last.toolCalls).toBeUndefined();
    });

    it('non-streaming still extracts tool_calls', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: '',
                                tool_calls: [{ id: 'c1', function: { name: 'f', arguments: '{"a":1}' } }],
                            },
                            finish_reason: 'tool_calls',
                        },
                    ],
                    usage: { total_tokens: 10 },
                }),
            })) as unknown as typeof fetch,
        );
        const adapter = new OpenAiCompatibleAdapter('test-openai', 'https://api.test.local/v1', false);
        const res = await adapter.doSendMessage([{ role: 'user', content: 'go' }], 'm', 'k', undefined, undefined);
        expect(res.finishReason).toBe('TOOL_CALLS');
        expect(res.toolCalls?.[0]).toMatchObject({ id: 'c1', function: { name: 'f' } });
    });
});
