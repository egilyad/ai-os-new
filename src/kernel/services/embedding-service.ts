import type {
    EmbeddingResult,
    IEmbeddingProvider,
    IEmbeddingService,
} from '../contracts/embedding';

/**
 * EmbeddingService — единый сервис эмбеддингов (SPEC_02).
 *
 * Пытается эмбеддить через зарегистрированных провайдеров по порядку,
 * проваливаясь на следующий при ошибке/недоступности (fallback). Это
 * убирает проблему «один сбой провайдера глобально отключает векторный
 * поиск до перезагрузки» (см. ROADMAP_04 §P0).
 */
export class EmbeddingService implements IEmbeddingService {
    private _providers: IEmbeddingProvider[] = [];

    register(provider: IEmbeddingProvider): void {
        if (this._providers.some((p) => p.id === provider.id)) return;
        this._providers.push(provider);
    }

    providers(): IEmbeddingProvider[] {
        return [...this._providers];
    }

    async embed(
        texts: string[],
        opts?: { providerId?: string; dimensions?: number },
    ): Promise<EmbeddingResult> {
        if (texts.length === 0) {
            return { vectors: [], dimensions: opts?.dimensions ?? 0, provider: 'none' };
        }

        let candidates = this._providers;
        if (opts?.providerId) {
            candidates = this._providers.filter((p) => p.id === opts.providerId);
        }
        if (candidates.length === 0) {
            throw new Error('No embedding provider registered');
        }

        let lastError: unknown;
        for (const provider of candidates) {
            try {
                const available = await provider.isAvailable();
                if (!available) continue;
                return await provider.embed({
                    texts,
                    dimensions: opts?.dimensions,
                });
            } catch (e) {
                lastError = e;
            }
        }

        throw (
            lastError ??
            new Error('No embedding provider available — all failed or unavailable')
        );
    }
}
