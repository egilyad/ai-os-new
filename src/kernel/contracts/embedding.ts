/**
 * Единый embedding-слой (SPEC_02 / ROADMAP_01 §P1, ROADMAP_04 §P1).
 *
 * Закрывает разрозненность эмбеддингов (EmbeddingClient, ProviderEmbeddingService,
 * DefaultEmbeddingService/хэш, DebateEmbeddingPipeline) единым интерфейсом
 * `IEmbeddingProvider` и сервисом выбора бэкенда с fallback.
 */

export interface EmbeddingRequest {
    texts: string[];
    /** Matryoshka-усечение (опционально). */
    dimensions?: number;
    signal?: AbortSignal;
}

export interface EmbeddingResult {
    vectors: number[][];
    dimensions: number;
    /** id провайдера, который вернул результат. */
    provider: string;
}

export interface IEmbeddingProvider {
    id: string;
    embed(req: EmbeddingRequest): Promise<EmbeddingResult>;
    isAvailable(): boolean | Promise<boolean>;
}

export interface IEmbeddingService {
    embed(texts: string[], opts?: { providerId?: string; dimensions?: number }): Promise<EmbeddingResult>;
    providers(): IEmbeddingProvider[];
    register(provider: IEmbeddingProvider): void;
}
