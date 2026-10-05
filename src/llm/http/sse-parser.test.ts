import { describe, it, expect } from 'vitest';
import { parseSSEStream } from './sse-parser';

const textExtractor = (parsed: Record<string, unknown>): string | undefined | null => {
    const text = parsed.text;
    return typeof text === 'string' ? text : undefined;
};

describe('parseSSEStream', () => {
    it('parses SSE data chunks and flushes them to onChunk', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const enc = new TextEncoder();
                controller.enqueue(enc.encode('data: {"text":"hello"}\n\n'));
                controller.enqueue(enc.encode('data: {"text":" world"}\n\n'));
                controller.close();
            },
        });

        const chunks: string[] = [];
        await parseSSEStream(new Response(stream), (c) => chunks.push(c), textExtractor);

        expect(chunks).toEqual(['hello', ' world']);
    });

    it('G-03: settles with AbortError when the signal aborts while the body hangs', async () => {
        // Simulates the production failure: a fetch body whose read() never settles
        // (slow/silent provider). Before the G-03 fix, parseSSEStream relied solely on
        // bodyReader.cancel() to propagate the abort — if that cancel never settled,
        // the stream (and the caller's streamMessage) stayed pending forever.
        const hungStream = new ReadableStream<Uint8Array>({
            pull() {
                return new Promise(() => {});
            },
        });
        const controller = new AbortController();
        const parsePromise = parseSSEStream(
            new Response(hungStream),
            () => {},
            textExtractor,
            undefined,
            { signal: controller.signal },
        );

        const abortReason = new Error('RequestTimedOut');
        setTimeout(() => controller.abort(abortReason), 20);

        await expect(parsePromise).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('G-03: settles when the signal is already aborted before the stream is consumed', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const enc = new TextEncoder();
                controller.enqueue(enc.encode('data: {"text":"partial"}\n\n'));
                // Never close — only the abort should terminate the stream.
            },
        });
        const controller = new AbortController();
        controller.abort(new Error('CancelledByUser'));

        const parsePromise = parseSSEStream(
            new Response(stream),
            () => {},
            textExtractor,
            undefined,
            { signal: controller.signal },
        );

        await expect(parsePromise).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('hang-class: resolves (zero chunks) on a non-SSE body instead of stalling', async () => {
        // A pull() that reads bytes but enqueues nothing was never re-invoked:
        // single-line JSON bodies hung forever with idleTimeout=0 and burned
        // the full idle budget otherwise (debate stream branch, 30s turn
        // timeouts with instant-200 responses). Must resolve fast.
        const json = JSON.stringify({
            choices: [
                { message: { content: 'not-an-sse-event' }, finish_reason: 'stop' },
            ],
        });
        const chunks: string[] = [];
        await parseSSEStream(
            new Response(json, { headers: { 'content-type': 'application/json' } }),
            (c) => chunks.push(c),
            textExtractor,
            undefined,
            { idleTimeoutMs: 0 },
        );
        expect(chunks).toEqual([]);
    });

    it('hang-class: resolves a single-event SSE body delivered in one read', async () => {
        const chunks: string[] = [];
        await parseSSEStream(
            new Response('data: {"text":"one-shot"}\n\ndata: [DONE]\n\n', {
                headers: { 'content-type': 'text/event-stream' },
            }),
            (c) => chunks.push(c),
            textExtractor,
            undefined,
            { idleTimeoutMs: 30000 },
        );
        expect(chunks).toEqual(['one-shot']);
    });
});
