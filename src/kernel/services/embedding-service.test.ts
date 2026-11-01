import { describe, expect, it } from 'vitest';
import type { IEmbeddingProvider } from '../contracts/embedding';
import { EmbeddingService } from './embedding-service';

function makeProvider(id: string, opts: { available?: boolean; fail?: boolean } = {}) {
    const provider: IEmbeddingProvider = {
        id,
        isAvailable: async () => opts.available ?? true,
        embed: async ({ texts }) => {
            if (opts.fail) throw new Error(`${id} failed`);
            return {
                vectors: texts.map((_, i) => [i, 0, 0]),
                dimensions: 3,
                provider: id,
            };
        },
    };
    return provider;
}

describe('EmbeddingService (SPEC_02)', () => {
    it('выбирает первого доступного провайдера', async () => {
        const svc = new EmbeddingService();
        svc.register(makeProvider('a'));
        svc.register(makeProvider('b'));
        const res = await svc.embed(['x']);
        expect(res.provider).toBe('a');
    });

    it('fallback при сбое первого', async () => {
        const svc = new EmbeddingService();
        svc.register(makeProvider('a', { fail: true }));
        svc.register(makeProvider('b'));
        const res = await svc.embed(['x']);
        expect(res.provider).toBe('b');
    });

    it('пропускает недоступных, затем бросает, если все недоступны', async () => {
        const svc = new EmbeddingService();
        svc.register(makeProvider('a', { available: false }));
        svc.register(makeProvider('b', { available: false }));
        await expect(svc.embed(['x'])).rejects.toThrow(/No embedding provider/);
    });

    it('пустой вход → пустой вектор/без провайдера', async () => {
        const svc = new EmbeddingService();
        svc.register(makeProvider('a'));
        const res = await svc.embed([]);
        expect(res.vectors).toEqual([]);
        expect(res.provider).toBe('none');
    });

    it('providerId фильтрует кандидатов', async () => {
        const svc = new EmbeddingService();
        svc.register(makeProvider('a'));
        svc.register(makeProvider('b'));
        const res = await svc.embed(['x'], { providerId: 'b' });
        expect(res.provider).toBe('b');
    });

    it('register не дублирует по id', () => {
        const svc = new EmbeddingService();
        svc.register(makeProvider('a'));
        svc.register(makeProvider('a'));
        expect(svc.providers()).toHaveLength(1);
    });
});
