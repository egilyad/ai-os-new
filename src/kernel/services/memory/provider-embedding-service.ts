/**
 * ProviderEmbeddingService — IEmbeddingPort backed by a real provider.
 *
 * Until now the memory mesh embedded text with a local hash function: no
 * semantic signal, only lexical overlap. This service talks to an
 * OpenAI-compatible `/embeddings` endpoint (OpenAI, OpenRouter, NVIDIA NIM,
 * Together, Ollama, Gemini OpenAI-compat) and hands real vectors to the
 * memory engine, which forwards them to the search worker.
 *
 * Behaviour is opt-in (`CONFIG.services.memory.providerEmbeddings.enabled`).
 * Without a configured provider or a usable API key the service refuses to
 * embed, and the memory engine keeps using the offline hash vectors.
 */
import type { IEmbeddingPort } from '../../contracts/parity';
import { EmbeddingClient } from '../../../llm/embeddings/embedding-client';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ProviderEmbeddingService');

export interface ProviderEmbeddingConfig {
    enabled: boolean;
    provider: string;
    model: string;
    baseUrl: string;
    dimensions?: number;
}

export interface ProviderEmbeddingDeps {
    /** Resolves an API key for the configured provider (key pool). */
    resolveApiKey: (provider: string) => string | undefined;
    getConfig: () => ProviderEmbeddingConfig | undefined;
    fetchImpl?: typeof fetch;
}

/** Default OpenAI-compatible endpoints per provider. */
export const EMBEDDING_BASE_URLS: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    nvidia: 'https://integrate.api.nvidia.com/v1',
    together: 'https://api.together.xyz/v1',
    deepinfra: 'https://api.deepinfra.com/v1/openai',
    siliconflow: 'https://api.siliconflow.cn/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
    ollama: 'http://localhost:11434/v1',
    lmstudio: 'http://localhost:1234/v1',
};

export class ProviderEmbeddingService implements IEmbeddingPort {
    private readonly client: EmbeddingClient;

    constructor(private readonly deps: ProviderEmbeddingDeps) {
        this.client = new EmbeddingClient(
            deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {},
        );
    }

    /** True when a provider is configured and an API key is available. */
    isAvailable(): boolean {
        const config = this.deps.getConfig();
        if (!config?.enabled) return false;
        if (!config.provider || !config.model) return false;
        return !!this.deps.resolveApiKey(config.provider);
    }

    /** Describes the configured embedding space (model / dimensionality hint). */
    describe(): { model?: string; dimensions?: number } {
        const config = this.deps.getConfig();
        if (!config?.enabled) return {};
        return { model: config.model, dimensions: config.dimensions };
    }

    async embed(texts: string[]): Promise<number[][]> {
        const config = this.deps.getConfig();
        if (!config?.enabled) {
            throw new Error('Provider embeddings are disabled');
        }
        if (!texts.length) return [];

        const apiKey = this.deps.resolveApiKey(config.provider);
        if (!apiKey) {
            throw new Error(`No API key available for embedding provider "${config.provider}"`);
        }
        const baseUrl = config.baseUrl || EMBEDDING_BASE_URLS[config.provider] || '';
        if (!baseUrl) {
            throw new Error(
                `No embeddings endpoint configured for provider "${config.provider}"`,
            );
        }

        const vectors = await this.client.embed({
            baseUrl,
            apiKey,
            model: config.model,
            texts,
            dimensions: config.dimensions,
        });
        LOGGER.debug('ProviderEmbeddingService', 'embedded batch', {
            provider: config.provider,
            model: config.model,
            count: vectors.length,
        });
        return vectors;
    }
}
