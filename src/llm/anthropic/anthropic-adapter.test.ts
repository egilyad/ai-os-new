/**
 * AnthropicAdapter tests (Phase 70, трасса B) — Messages API + computer-use.
 * Pure mapping tests run without network; send/stream paths use stubbed fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import {
    AnthropicAdapter,
    mapTools,
    mapToolChoice,
    toAnthropicMessages,
    extractToolCalls,
    extractText,
    parseAnthropicResponse,
    normalizeFinishReason,
    ANTHROPIC_COMPUTER_TOOL_TYPE,
} from './anthropic-adapter';

describe('anthropic message mapping', () => {
    it('extracts system prompt to top-level, keeps user first', () => {
        const { system, messages } = toAnthropicMessages([
            { role: 'system', content: 'Be concise.' },
            { role: 'user', content: 'Hello' },
        ]);
        expect(system).toBe('Be concise.');
        expect(messages).toHaveLength(1);
        expect(messages[0]).toMatchObject({ role: 'user' });
    });

    it('maps tool messages to user tool_result with tool_use_id', () => {
        const { messages } = toAnthropicMessages([
            { role: 'user', content: 'go' },
            {
                role: 'assistant',
                content: '',
                toolCalls: [{ id: 'tu_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"x"}' } }],
            },
            { role: 'tool', content: 'sunny', toolCallId: 'tu_1' },
        ]);
        expect(messages).toHaveLength(3);
        const result = messages[2] as { role: string; content: Array<Record<string, unknown>> };
        expect(result.role).toBe('user');
        expect(result.content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'tu_1' });
    });

    it('marks ERROR:-prefixed tool results as is_error', () => {
        const { messages } = toAnthropicMessages([
            { role: 'user', content: 'go' },
            { role: 'tool', content: 'ERROR: boom', toolCallId: 'tu_9' },
        ]);
        // user + tool_result смержены в одно сообщение.
        expect(messages).toHaveLength(1);
        const blocks = (messages[0] as { content: Array<Record<string, unknown>> }).content;
        expect(blocks[1]).toMatchObject({ type: 'tool_result', is_error: true });
    });

    it('merges consecutive same-role messages (alternation requirement)', () => {
        const { messages } = toAnthropicMessages([
            { role: 'user', content: 'a' },
            { role: 'tool', content: 'r1', toolCallId: 't1' },
            { role: 'tool', content: 'r2', toolCallId: 't2' },
        ]);
        // Всё user-ролевое подряд — одно сообщение API (порядок блоков сохранён).
        expect(messages).toHaveLength(1);
        const blocks = (messages[0] as { content: Array<Record<string, unknown>> }).content;
        expect(blocks).toHaveLength(3);
        expect(blocks[0]).toMatchObject({ type: 'text', text: 'a' });
        expect(blocks[1]).toMatchObject({ type: 'tool_result', tool_use_id: 't1' });
        expect(blocks[2]).toMatchObject({ type: 'tool_result', tool_use_id: 't2' });
    });

    it('maps computer toolCalls back to tool_use blocks', () => {
        const { messages } = toAnthropicMessages([
            { role: 'user', content: 'click' },
            {
                role: 'assistant',
                content: '',
                toolCalls: [
                    { id: 'tu_c', type: 'computer_20250124', function: { name: 'computer', arguments: '{"action":"click"}' } },
                ],
            },
        ]);
        const blocks = (messages[1] as { content: Array<Record<string, unknown>> }).content;
        expect(blocks[0]).toMatchObject({ type: 'tool_use', id: 'tu_c', name: 'computer' });
    });

    it('maps inlineData screenshots to image blocks (tool_result included)', () => {
        const shot = 'iVBORw0KGgo=';
        const { messages } = toAnthropicMessages([
            { role: 'user', content: 'see' },
            {
                role: 'tool',
                content: 'shot',
                toolCallId: 'tu_s',
                inlineData: [{ mimeType: 'image/png', data: shot }],
            },
        ]);
        // user 'see' + tool_result смержены в одно user-сообщение API.
        expect(messages).toHaveLength(1);
        const blocks = (messages[0] as { content: Array<Record<string, unknown>> }).content;
        expect(blocks[0]).toMatchObject({ type: 'text', text: 'see' });
        const result = blocks[1] as { content: Array<Record<string, unknown>> };
        expect(result).toMatchObject({ type: 'tool_result', tool_use_id: 'tu_s' });
        expect(result.content[1]).toMatchObject({
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: shot },
        });
    });

    it('throws a clear error when first message is not user', () => {
        expect(() =>
            toAnthropicMessages([{ role: 'assistant', content: 'hi' }]),
        ).toThrow(/first non-system message must have role user/);
    });
});

describe('anthropic tools mapping', () => {
    it('maps function tools to name/description/input_schema', () => {
        const { blocks, hasComputer } = mapTools(
            [{ type: 'function', function: { name: 'f', description: 'd', parameters: { type: 'object' } } }],
            undefined,
        );
        expect(hasComputer).toBe(false);
        expect(blocks[0]).toMatchObject({ name: 'f', description: 'd' });
        expect(blocks[0]).toHaveProperty('input_schema');
    });

    it('maps computer tool with display size', () => {
        const { blocks, hasComputer } = mapTools(
            [{ type: ANTHROPIC_COMPUTER_TOOL_TYPE, computer: { displayWidthPx: 1280, displayHeightPx: 800 } }],
            undefined,
        );
        expect(hasComputer).toBe(true);
        expect(blocks[0]).toMatchObject({
            type: 'computer_20250124',
            name: 'computer',
            display_width_px: 1280,
            display_height_px: 800,
        });
    });

    it('injects computer tool from computerUse option', () => {
        const { blocks, hasComputer } = mapTools([], { displayWidthPx: 1024, displayHeightPx: 768 });
        expect(hasComputer).toBe(true);
        expect(blocks[0]).toMatchObject({ type: 'computer_20250124' });
    });

    it('mapToolChoice translates auto/required, drops unknown', () => {
        expect(mapToolChoice('auto')).toEqual({ type: 'auto' });
        expect(mapToolChoice('required')).toEqual({ type: 'any' });
        expect(mapToolChoice('bogus')).toBeUndefined();
        expect(mapToolChoice({ type: 'tool', name: 'f' })).toEqual({ type: 'tool', name: 'f' });
    });
});

describe('anthropic response parsing', () => {
    it('extractText joins text blocks', () => {
        expect(extractText([{ type: 'text', text: 'a' }, { type: 'tool_use' }, { type: 'text', text: 'b' }])).toBe('ab');
    });

    it('extractToolCalls types computer vs function', () => {
        const calls = extractToolCalls([
            { type: 'tool_use', id: 'a', name: 'computer', input: { action: 'screenshot' } },
            { type: 'tool_use', id: 'b', name: 'f', input: { x: 1 } },
        ]);
        expect(calls).toHaveLength(2);
        expect(calls?.[0]).toMatchObject({ id: 'a', type: 'computer_20250124' });
        expect(calls?.[0]?.function.arguments).toBe('{"action":"screenshot"}');
        expect(calls?.[1]).toMatchObject({ id: 'b', type: 'function', function: { name: 'f' } });
    });

    it('parseAnthropicResponse maps usage + stop_reason', () => {
        const res = parseAnthropicResponse({
            content: [{ type: 'text', text: 'hi' }],
            stop_reason: 'end_turn',
            usage: { input_tokens: 10, output_tokens: 5 },
        });
        expect(res.content).toBe('hi');
        expect(res.tokens).toBe(15);
        expect(res.finishReason).toBe('STOP');
        expect(res.toolCalls).toBeUndefined();
    });

    it('normalizeFinishReason maps tool_use/max_tokens', () => {
        expect(normalizeFinishReason('tool_use')).toBe('TOOL_CALLS');
        expect(normalizeFinishReason('max_tokens')).toBe('MAX_TOKENS');
        expect(normalizeFinishReason('weird')).toBe('OTHER');
        expect(normalizeFinishReason(undefined)).toBeUndefined();
    });
});

describe('anthropic adapter wire format', () => {
    const realFetch = globalThis.fetch;

    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
        vi.unstubAllGlobals();
    });

    it('doSendMessage posts to /v1/messages with x-api-key (no Bearer)', async () => {
        const seen: Array<{ url: string; headers: Record<string, string>; body: Record<string, unknown> }> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                seen.push({
                    url,
                    headers: init?.headers as Record<string, string>,
                    body: JSON.parse(String(init?.body)) as Record<string, unknown>,
                });
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        content: [{ type: 'text', text: 'done' }],
                        stop_reason: 'end_turn',
                        usage: { input_tokens: 3, output_tokens: 2 },
                    }),
                };
            }) as unknown as typeof fetch,
        );
        const adapter = new AnthropicAdapter();
        const res = await adapter.doSendMessage(
            [{ role: 'user', content: 'hi' }],
            'auto',
            'sk-test',
            { maxOutputTokens: 64 },
            undefined,
        );
        expect(res.content).toBe('done');
        assert.equal(seen.length, 1);
        expect(seen[0].url).toBe('https://api.anthropic.com/v1/messages');
        expect(seen[0].headers['x-api-key']).toBe('sk-test');
        expect(seen[0].headers['authorization']).toBeUndefined();
        expect(seen[0].headers['anthropic-version']).toBe('2023-06-01');
        expect(seen[0].headers['anthropic-beta']).toBeUndefined();
        expect(seen[0].body['model']).toBe('claude-sonnet-4-20250514');
        expect(seen[0].body['max_tokens']).toBe(64);
    });

    it('doSendMessage adds beta header only for computer-use', async () => {
        const headersSeen: Array<Record<string, string>> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (_url: string, init?: RequestInit) => {
                headersSeen.push(init?.headers as Record<string, string>);
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ content: [], stop_reason: 'end_turn', usage: {} }),
                };
            }) as unknown as typeof fetch,
        );
        const adapter = new AnthropicAdapter();
        await adapter.doSendMessage(
            [{ role: 'user', content: 'click' }],
            'auto',
            'sk-test',
            { computerUse: { displayWidthPx: 1024, displayHeightPx: 768 } },
            undefined,
        );
        expect(headersSeen[0]?.['anthropic-beta']).toBe('computer-use-2025-01-24');
    });

    it('doStreamMessage accumulates text + input_json deltas', async () => {
        const events = [
            'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":8}}}\n\n',
            'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text"}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hel"}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"lo"}}\n\n',
            'event: content_block_start\ndata: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"tu_1","name":"get_weather"}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"city\\""}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":":\\"x\\"}"}}\n\n',
            'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":12}}\n\n',
        ].join('');
        const bytes = new TextEncoder().encode(events);
        const stream = new ReadableStream<Uint8Array>({
            start(c) {
                c.enqueue(bytes);
                c.close();
            },
        });
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: true, status: 200, body: stream })) as unknown as typeof fetch,
        );
        const adapter = new AnthropicAdapter();
        const chunks: string[] = [];
        const metas: unknown[] = [];
        await adapter.doStreamMessage(
            [{ role: 'user', content: 'weather' }],
            'auto',
            'sk-test',
            (chunk, meta) => {
                chunks.push(chunk);
                if (meta) metas.push(meta);
            },
            undefined,
            undefined,
        );
        expect(chunks.join('')).toBe('Hello');
        const last = metas[metas.length - 1] as {
            finishReason?: string;
            tokens?: number;
            toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
        };
        expect(last.finishReason).toBe('TOOL_CALLS');
        expect(last.tokens).toBe(20);
        expect(last.toolCalls).toHaveLength(1);
        expect(last.toolCalls?.[0]).toMatchObject({
            id: 'tu_1',
            type: 'function',
            function: { name: 'get_weather', arguments: '{"city":"x"}' },
        });
    });
});
