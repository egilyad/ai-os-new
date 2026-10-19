import { describe, it, expect, vi } from 'vitest';
import { EmbeddingClient } from './embedding-client';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: async () => body,
        text: async () => JSON.stringify(body),
    } as unknown as Response;
}

describe('EmbeddingClient', () => {
    it('posts to the embeddings endpoint and returns L2-normalized vectors', async () => {
        const fetchImpl = vi.fn(async () =>
            jsonResponse({
                data: [
                    { embedding: [3, 4], index: 0 },
                    { embedding: [0, 5], index: 1 },
                ],
            }),
        );
        const client = new EmbeddingClient({ fetchImpl: fetchImpl as unknown as typeof fetch });

        const vectors = await client.embed({
            baseUrl: 'https://api.openai.com/v1/',
            apiKey: 'sk-test',
            model: 'text-embedding-3-small',
            texts: ['a', 'b'],
        });

        expect(vectors).toHaveLength(2);
        expect(vectors[0]![0]).toBeCloseTo(0.6, 5);
        expect(vectors[0]![1]).toBeCloseTo(0.8, 5);
        expect(vectors[1]![1]).toBeCloseTo(1, 5);

        const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('https://api.openai.com/v1/embeddings');
        expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer sk-test');
        expect(JSON.parse(init.body as string)).toEqual({
            model: 'text-embedding-3-small',
            input: ['a', 'b'],
        });
    });

    it('sorts vectors by index', async () => {
        const fetchImpl = vi.fn(async () =>
            jsonResponse({
                data: [
                    { embedding: [0, 1], index: 1 },
                    { embedding: [1, 0], index: 0 },
                ],
            }),
        );
        const client = new EmbeddingClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        const vectors = await client.embed({
            baseUrl: 'https://example.test/v1',
            apiKey: 'k',
            model: 'm',
            texts: ['a', 'b'],
        });
        expect(vectors[0]).toEqual([1, 0]);
        expect(vectors[1]).toEqual([0, 1]);
    });

    it('passes the dimensions hint when provided', async () => {
        const fetchImpl = vi.fn(async () =>
            jsonResponse({ data: [{ embedding: [1, 0] }] }),
        );
        const client = new EmbeddingClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        await client.embed({
            baseUrl: 'https://example.test/v1',
            apiKey: 'k',
            model: 'm',
            texts: ['a'],
            dimensions: 256,
        });
        const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
        expect(JSON.parse(init.body as string)['dimensions']).toBe(256);
    });

    it('throws on a failed response', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ error: { message: 'nope' } }, false, 401));
        const client = new EmbeddingClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        await expect(
            client.embed({
                baseUrl: 'https://example.test/v1',
                apiKey: 'k',
                model: 'm',
                texts: ['a'],
            }),
        ).rejects.toThrow(/401/);
    });

    it('throws when the vector count does not match the input', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
        const client = new EmbeddingClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        await expect(
            client.embed({
                baseUrl: 'https://example.test/v1',
                apiKey: 'k',
                model: 'm',
                texts: ['a'],
            }),
        ).rejects.toThrow(/mismatch/);
    });

    it('short-circuits on empty input', async () => {
        const fetchImpl = vi.fn();
        const client = new EmbeddingClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        expect(
            await client.embed({
                baseUrl: 'https://example.test/v1',
                apiKey: 'k',
                model: 'm',
                texts: [],
            }),
        ).toEqual([]);
        expect(fetchImpl).not.toHaveBeenCalled();
    });
});
