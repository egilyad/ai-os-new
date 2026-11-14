import { describe, expect, it } from 'vitest';
import {
    ImageGenerationService,
    StubImageGenerator,
} from '../kernel/services/images/image-generation-service';

describe('smoke: ImageGenerationService', () => {
    it('stub провайдер по умолчанию', async () => {
        const svc = new ImageGenerationService();
        const res = await svc.generate('красный круг');
        expect(res.provider).toBe('stub');
        expect(res.mimeType).toBe('image/png');
        expect(res.dataB64.length).toBeGreaterThan(0);
    });

    it('кастомный провайдер + listProviders', async () => {
        const custom = {
            id: 'custom',
            generate: async (prompt: string) => ({
                dataB64: 'AAAA',
                mimeType: 'image/png',
                width: 8,
                height: 8,
                provider: 'custom',
                note: prompt,
            }),
        };
        const svc = new ImageGenerationService([custom]);
        expect(svc.listProviders()).toEqual(['custom']);
        const res = await svc.generate('x', { provider: 'custom' });
        expect(res.provider).toBe('custom');
        expect(res.dataB64).toBe('AAAA');
    });

    it('StubImageGenerator напрямую', async () => {
        const g = new StubImageGenerator();
        const res = await g.generate('тест');
        expect(res.width).toBe(1024);
        expect(res.height).toBe(1024);
    });
});
