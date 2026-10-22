import { describe, it, expect } from 'vitest';
import { GeminiStreamParser } from './gemini-stream-parser';
import type { StreamMeta } from './gemini-types';

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

describe('GeminiStreamParser', () => {
    it('reports streamed function calls as tool calls', async () => {
        const response = sseResponse(
            [
                'data: {"candidates":[{"content":{"parts":[{"text":"Проверяю"}]}}]}\n\n',
                'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"ui.openPanel","args":{"panelId":"agents"}}}]}}]}\n\n',
                'data: {"candidates":[{"finishReason":"STOP"}],"usageMetadata":{"totalTokenCount":9}}\n\n',
            ].join(''),
        );

        const chunks: string[] = [];
        const metas: StreamMeta[] = [];
        await GeminiStreamParser.parse(response, (chunk, meta) => {
            chunks.push(chunk);
            if (meta) metas.push(meta);
        });

        expect(chunks.join('')).toContain('Проверяю');
        const last = metas[metas.length - 1];
        expect(last.finishReason).toBe('STOP');
        expect(last.toolCalls).toEqual([
            {
                id: 'gemini_call_0',
                type: 'function',
                function: { name: 'ui.openPanel', arguments: '{"panelId":"agents"}' },
            },
        ]);
    });

    it('does not invent tool calls on a plain text stream', async () => {
        const response = sseResponse(
            [
                'data: {"candidates":[{"content":{"parts":[{"text":"Привет"}]}}]}\n\n',
                'data: {"candidates":[{"finishReason":"STOP"}]}\n\n',
            ].join(''),
        );

        const metas: StreamMeta[] = [];
        await GeminiStreamParser.parse(response, (_chunk, meta) => {
            if (meta) metas.push(meta);
        });

        const last = metas[metas.length - 1];
        expect(last.finishReason).toBe('STOP');
        expect(last.toolCalls).toBeUndefined();
    });
});
