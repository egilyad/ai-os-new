import { describe, it, expect, vi, afterEach } from 'vitest';
import { LLMHttpClient, parseRetryAfterHeader } from './llm-http-client';
import { AuthError, RetryableError } from '../core/errors';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
    LLMHttpClient.cancelAll();
});

describe('parseRetryAfterHeader', () => {
    it('converts seconds to milliseconds', () => {
        expect(parseRetryAfterHeader('120')).toBe(120000);
        // Zero means "retry immediately", not "missing".
        expect(parseRetryAfterHeader('0')).toBe(0);
    });

    it('returns undefined for missing or garbage values', () => {
        expect(parseRetryAfterHeader(null)).toBeUndefined();
        expect(parseRetryAfterHeader('not-a-date')).toBeUndefined();
    });

    it('converts an HTTP date to a delay', () => {
        const future = new Date(Date.now() + 5000).toUTCString();
        const delay = parseRetryAfterHeader(future);
        expect(delay).toBeDefined();
        expect(delay!).toBeGreaterThan(0);
        expect(delay!).toBeLessThanOrEqual(5000);
    });
});

describe('LLMHttpClient.post', () => {
    function client(): LLMHttpClient {
        return new LLMHttpClient('https://x.test', {}, 'x-api-key', 'test', 5000);
    }

    it('returns data and releases tracking on success', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => jsonResponse({ ok: true })),
        );
        const res = await client().post('/v1/chat', { hello: 'world' }, 'sk-test');
        expect(res.data).toEqual({ ok: true });
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });

    it('maps 429 to RetryableError with retry-after', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => jsonResponse({ error: 'slow' }, 429, { 'Retry-After': '5' })),
        );
        const err = await client()
            .post('/v1/chat', {}, 'sk-test')
            .catch((e: unknown) => e);
        expect(err).toBeInstanceOf(RetryableError);
        expect((err as { retryAfter?: number }).retryAfter).toBe(5000);
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });

    it('maps 401 to AuthError', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 401)));
        const err = await client()
            .post('/v1/chat', {}, 'sk-test')
            .catch((e: unknown) => e);
        expect(err).toBeInstanceOf(AuthError);
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });

    it('rejects circular bodies before touching the semaphore', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({})));
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        await expect(client().post('/v1/chat', circular, 'sk-test')).rejects.toThrow();
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });
});

describe('LLMHttpClient.streamPost (T-H-4)', () => {
    function streamClient(): LLMHttpClient {
        return new LLMHttpClient('https://x.test', {}, 'x-api-key', 'test', 5000);
    }

    function sseResponse(): Response {
        const body = [
            'data: {"choices":[{"delta":{"content":"hi"}}]}',
            '',
            'data: [DONE]',
            '',
            '',
        ].join('\n');
        return new Response(body, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
        });
    }

    it('returns a handle; entry stays visible until release (H-5)', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => sseResponse()));
        const handle = await streamClient().streamPost('/v1/chat', { stream: true }, 'sk-test');
        // Still registered: cancelAll can abort an active body read.
        expect(LLMHttpClient.getInFlightCount()).toBe(1);
        const text = await handle.response.text();
        expect(text).toContain('hi');
        handle.release();
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
        // Idempotent — double release neither throws nor corrupts counts.
        handle.release();
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });

    it('cancelAll aborts a headers-pending stream', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                (_url: string, init?: RequestInit) =>
                    new Promise<Response>((_resolve, reject) => {
                        init?.signal?.addEventListener('abort', () => {
                            reject(new DOMException('aborted', 'AbortError'));
                        });
                    }),
            ),
        );
        const pending = streamClient().streamPost('/v1/chat', {}, 'sk-test');
        await new Promise((r) => setTimeout(r, 50));
        expect(LLMHttpClient.getInFlightCount()).toBeGreaterThan(0);
        expect(LLMHttpClient.cancelAll()).toBeGreaterThan(0);
        await expect(pending).rejects.toThrow();
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });

    it('cancelAll aborts an actively-reading stream, release settles tracking', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (_url: string, init?: RequestInit) => {
                const signal = init?.signal;
                const stream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(new TextEncoder().encode('data: {"a":1}\n\n'));
                        signal?.addEventListener('abort', () => {
                            controller.error(new DOMException('aborted', 'AbortError'));
                        });
                    },
                });
                return new Response(stream, {
                    status: 200,
                    headers: { 'Content-Type': 'text/event-stream' },
                });
            }),
        );
        const handle = await streamClient().streamPost('/v1/chat', {}, 'sk-test');
        expect(LLMHttpClient.getInFlightCount()).toBe(1);
        const reading = handle.response.text();
        expect(LLMHttpClient.cancelAll()).toBe(1);
        await expect(reading).rejects.toThrow();
        handle.release();
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });

    it('maps 401 to AuthError', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 401)));
        const err = await streamClient()
            .streamPost('/v1/chat', {}, 'sk-test')
            .catch((e: unknown) => e);
        expect(err).toBeInstanceOf(AuthError);
        expect(LLMHttpClient.getInFlightCount()).toBe(0);
    });
});
