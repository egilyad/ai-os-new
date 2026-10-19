/**
 * Phase 75 — provider-backed embeddings for the memory mesh.
 *
 * Registers:
 *   - embeddingService (ProviderEmbeddingService): real vectors from an
 *     OpenAI-compatible /embeddings endpoint, using the provider key pool.
 *
 * The service is opt-in (`CONFIG.services.memory.providerEmbeddings.enabled`);
 * without it the memory engine keeps the offline hash embeddings.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { KeyService } from '../services/key-management/key-service';
import { CONFIG } from '../services/config-registry';
import {
    EMBEDDING_BASE_URLS,
    ProviderEmbeddingService,
    type ProviderEmbeddingConfig,
} from '../services/memory/provider-embedding-service';

export const registerPhase75: Phase = ({ register }) => {
    register(
        'embeddingService',
        (c: IContainer) => {
            const getConfig = (): ProviderEmbeddingConfig | undefined => {
                const section = CONFIG?.services?.memory?.providerEmbeddings;
                if (!section) return undefined;
                return {
                    enabled: section.enabled,
                    provider: section.provider,
                    model: section.model,
                    baseUrl: section.baseUrl || EMBEDDING_BASE_URLS[section.provider] || '',
                    dimensions: section.dimensions,
                };
            };

            return new ProviderEmbeddingService({
                getConfig,
                resolveApiKey: (provider: string) => {
                    try {
                        const keySvc = c.get<KeyService>('keyService');
                        const key =
                            keySvc.selectWithBurst(provider) ?? keySvc.selectFromPool(provider);
                        return key?.key;
                    } catch {
                        return undefined;
                    }
                },
            });
        },
    );
};
