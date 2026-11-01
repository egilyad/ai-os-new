import type {
    EmbeddingRequest,
    EmbeddingResult,
    IEmbeddingProvider,
} from '../../contracts/embedding';

/**
 * Минимальный «порт» эмбеддингов, совместимый с IEmbeddingPort.
 * (новый контракт для адаптации существующих ProviderEmbeddingService/
 * DefaultEmbeddingService).
 */
export interface EmbeddingPortLike {
    embed(req: { texts: string[]; dimensions?: number }): Promise<{
        vectors: number[][];
        dimensions?: number;
    }>;
    isAvailable?(): boolean | Promise<boolean>;
}

/**
 * EmbeddingPortAdapter — оборачивает существующий IEmbeddingPort-подобный
 * объект в IEmbeddingProvider (SPEC_02).
 */
export class EmbeddingPortAdapter implements IEmbeddingProvider {
    constructor(
        private port: EmbeddingPortLike,
        readonly id: string,
    ) {}

    isAvailable(): boolean | Promise<boolean> {
        if (this.port.isAvailable) return this.port.isAvailable();
        return true;
    }

    async embed(req: EmbeddingRequest): Promise<EmbeddingResult> {
        const r = await this.port.embed({
            texts: req.texts,
            dimensions: req.dimensions,
        });
        return {
            vectors: r.vectors,
            dimensions: r.dimensions ?? req.dimensions ?? 0,
            provider: this.id,
        };
    }
}
