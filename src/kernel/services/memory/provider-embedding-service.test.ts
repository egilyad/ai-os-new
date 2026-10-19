import { describe, it, expect, vi } from 'vitest';
import {
    EMBEDDING_BASE_URLS,
    ProviderEmbeddingService,
    type ProviderEmbeddingConfig,
} from './provider-embedding-service';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: async () => body,
        text: async () => JSON.stringify(body),
    } as unknown as Response;
}

function makeService(
    config: Partial<ProviderEmbeddingConfig> | undefined,
    key: string | undefined,
    fetchImpl = vi.fn(async () =>
        jsonResponse({ data: [{ embedding: [3, 4], index: 0 }] }),
    ),
): { service: ProviderEmbeddingService; fetchImpl: ReturnType<typeof vi.fn> } {
    const service = new ProviderEmbeddingService({
        resolveApiKey: () => key,
        getConfig: () =>
            config
                ? ({
                      enabled: true,
                      provider: 'openai',
                      model: 'text-embedding-3-small',
                      baseUrl: '',
                      ...config,
                  } as ProviderEmbeddingConfig)
                : undefined,
        fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    return { service, fetchImpl };
}

describe('ProviderEmbeddingService', () => {
    it('embeds texts through the configured provider endpoint', async () => {
        const { service, fetchImpl } = makeService({ provider: 'openai' }, 'sk-test');
        const vectors = await service.embed(['hello']);
        expect(vectors).toHaveLength(1);
        expect(vectors[0]![0]).toBeCloseTo(0.6, 5);
        const [url] = fetchImpl.mock.calls[0] as unknown as [string];
        expect(url).toBe(`${EMBEDDING_BASE_URLS['openai']}/embeddings`);
    });

    it('honours an explicit baseUrl', async () => {
        const { service, fetchImpl } = makeService(
            {
                provider: 'openai',
                baseUrl: 'https://proxy.test/v1',
            },
            'sk-test',
        );
        await service.embed(['hello']);
        const [url] = fetchImpl.mock.calls[0] as unknown as [string];
        expect(url).toBe('https://proxy.test/v1/embeddings');
    });

    it('is unavailable when disabled', async () => {
        const { service } = makeService({ enabled: false }, 'sk-test');
        expect(service.isAvailable()).toBe(false);
        await expect(service.embed(['hello'])).rejects.toThrow(/disabled/);
    });

    it('is unavailable without an API key', async () => {
        const { service } = makeService({}, undefined);
        expect(service.isAvailable()).toBe(false);
        await expect(service.embed(['hello'])).rejects.toThrow(/No API key/);
    });

    it('is unavailable without configuration', async () => {
        const { service } = makeService(undefined, 'sk-test');
        expect(service.isAvailable()).toBe(false);
        await expect(service.embed(['hello'])).rejects.toThrow(/disabled/);
    });

    it('fails when the provider has no known endpoint', async () => {
        const { service } = makeService({ provider: 'unknown-provider' }, 'sk-test');
        await expect(service.embed(['hello'])).rejects.toThrow(/No embeddings endpoint/);
    });

    it('returns an empty array for empty input', async () => {
        const { service, fetchImpl } = makeService({}, 'sk-test');
        expect(await service.embed([])).toEqual([]);
        expect(fetchImpl).not.toHaveBeenCalled();
    });
});
