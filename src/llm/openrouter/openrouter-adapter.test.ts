/**
 * The streaming path of the OpenRouter adapter.
 *
 * A streamed turn sends tool calls as deltas: `index` names the call, `name`
 * arrives once and `arguments` is JSON built piece by piece. The adapter has to
 * reassemble them, otherwise an agent's streamed turn loses its tool calls and
 * silently never acts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { OpenRouterAdapter } from './openrouter-adapter';

function sseResponse(events: string): Response {
    const bytes = new TextEncoder().encode(events);
    const stream = new ReadableStream<Uint8Array>({
        start(c) {
            c.enqueue(bytes);
            c.close();
        },
    });
    return { ok: true, status: 200, body: stream } as unknown as Response;
}

function stubStream(events: string) {
    const fetchMock = vi.fn(async () => sseResponse(events));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    return fetchMock;
}

describe('OpenRouterAdapter streaming', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reassembles tool call deltas and keeps the text', async () => {
        stubStream(
            [
                'data: {"choices":[{"delta":{"content":"Смотрю"}}]}\n\n',
                'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"ui.openPanel","arguments":""}}]}}]}\n\n',
                'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"panelId\\":"}}]}}]}\n\n',
                'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"agents\\"}"}}]}}]}\n\n',
                'data: {"choices":[{"finish_reason":"tool_calls"}],"usage":{"total_tokens":11}}\n\n',
                'data: [DONE]\n\n',
            ].join(''),
        );

        const adapter = new OpenRouterAdapter({ baseURL: 'https://openrouter.test/api/v1' });
        const chunks: string[] = [];
        const metas: unknown[] = [];
        await adapter.doStreamMessage(
            [{ role: 'user', content: 'открой агентов' }],
            'openai/gpt-4o',
            'sk-test',
            (chunk, meta) => {
                chunks.push(chunk);
                if (meta) metas.push(meta);
            },
            undefined,
            undefined,
        );

        expect(chunks.join('')).toBe('Смотрю');
        const last = metas[metas.length - 1] as {
            finishReason?: string;
            toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
        };
        expect(last.finishReason).toBe('TOOL_CALLS');
        expect(last.toolCalls).toHaveLength(1);
        expect(last.toolCalls?.[0]).toEqual({
            id: 'call_1',
            type: 'function',
            function: { name: 'ui.openPanel', arguments: '{"panelId":"agents"}' },
        });
    });

    it('keeps two parallel tool calls apart by index', async () => {
        stubStream(
            [
                'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"a","function":{"name":"agents.list","arguments":"{}"}},{"index":1,"id":"b","function":{"name":"tools.list","arguments":"{}"}}]}}]}\n\n',
                'data: {"choices":[{"finish_reason":"tool_calls"}]}\n\n',
                'data: [DONE]\n\n',
            ].join(''),
        );

        const adapter = new OpenRouterAdapter({ baseURL: 'https://openrouter.test/api/v1' });
        const metas: unknown[] = [];
        await adapter.doStreamMessage(
            [{ role: 'user', content: 'что есть?' }],
            'openai/gpt-4o',
            'sk-test',
            (_chunk, meta) => {
                if (meta) metas.push(meta);
            },
            undefined,
            undefined,
        );

        const last = metas[metas.length - 1] as {
            toolCalls?: Array<{ id: string; function: { name: string } }>;
        };
        expect(last.toolCalls?.map((c) => [c.id, c.function.name])).toEqual([
            ['a', 'agents.list'],
            ['b', 'tools.list'],
        ]);
    });

    it('does not invent tool calls on a plain text stream', async () => {
        stubStream(
            [
                'data: {"choices":[{"delta":{"content":"Привет"}}]}\n\n',
                'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
                'data: [DONE]\n\n',
            ].join(''),
        );

        const adapter = new OpenRouterAdapter({ baseURL: 'https://openrouter.test/api/v1' });
        const metas: unknown[] = [];
        await adapter.doStreamMessage(
            [{ role: 'user', content: 'привет' }],
            'openai/gpt-4o',
            'sk-test',
            (_chunk, meta) => {
                if (meta) metas.push(meta);
            },
            undefined,
            undefined,
        );

        const last = metas[metas.length - 1] as { finishReason?: string; toolCalls?: unknown };
        expect(last.finishReason).toBe('STOP');
        expect(last.toolCalls).toBeUndefined();
    });
});
