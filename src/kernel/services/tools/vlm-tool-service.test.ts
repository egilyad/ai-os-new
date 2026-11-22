import { describe, it, expect } from 'vitest';
import { VlmToolService } from './vlm-tool-service';

describe('VlmToolService', () => {
    it('parses a structured vision response', async () => {
        const svc = new VlmToolService({
            chat: async () => ({ content: '{"description":"a cat","labels":["cat","indoor"]}' }),
        });
        const r = await svc.analyze('data:image/png;base64,abc');
        expect(r.description).toBe('a cat');
        expect(r.labels).toEqual(['cat', 'indoor']);
        expect(svc.isConfigured()).toBe(true);
    });

    it('falls back to raw text when JSON is malformed', async () => {
        const svc = new VlmToolService({ chat: async () => ({ content: 'just text' }) });
        expect((await svc.analyze('http://x/img.png')).description).toBe('just text');
    });

    it('fails loud without a configured model', async () => {
        const svc = new VlmToolService();
        expect(svc.isConfigured()).toBe(false);
        await expect(svc.analyze('x')).rejects.toThrow(/not configured/);
    });
});
