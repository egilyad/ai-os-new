import { describe, expect, it, vi } from 'vitest';
import { EmbeddingPortAdapter } from './embedding-port-adapter';

describe('EmbeddingPortAdapter (SPEC_02)', () => {
    it('оборачивает порт в IEmbeddingProvider', async () => {
        const port = {
            embed: vi.fn(async ({ texts }: { texts: string[] }) => ({
                vectors: texts.map((_, i) => [i]),
                dimensions: 1,
            })),
            isAvailable: async () => true,
        };
        const adapter = new EmbeddingPortAdapter(port, 'offline-hash');
        expect(adapter.id).toBe('offline-hash');
        expect(await adapter.isAvailable()).toBe(true);
        const res = await adapter.embed({ texts: ['a', 'b'] });
        expect(res.provider).toBe('offline-hash');
        expect(res.dimensions).toBe(1);
        expect(res.vectors).toHaveLength(2);
        expect(port.embed).toHaveBeenCalledWith({ texts: ['a', 'b'], dimensions: undefined });
    });

    it('передаёт dimensions и подставляет дефолт, если порт не вернул', async () => {
        const port = {
            embed: vi.fn(async ({ texts }: { texts: string[] }) => ({
                vectors: texts.map(() => [0, 0, 0]),
            })),
        };
        const adapter = new EmbeddingPortAdapter(port, 'p');
        const res = await adapter.embed({ texts: ['x'], dimensions: 3 });
        expect(res.dimensions).toBe(3);
        expect(port.embed).toHaveBeenCalledWith({ texts: ['x'], dimensions: 3 });
    });
});
