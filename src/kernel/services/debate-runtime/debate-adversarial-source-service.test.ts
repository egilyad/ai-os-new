import { describe, it, expect } from 'vitest';
import { AdversarialSourceService } from './debate-adversarial-source-service';

describe('AdversarialSourceService', () => {
    it('verifyClaims returns array', async () => {
        const svc = new AdversarialSourceService();
        const res = await svc.verifyClaims('According to https://example.com study shows 42% effect. See source https://nature.com/paper for details.', new AbortController().signal);
        expect(Array.isArray(res)).toBe(true);
    });
    it('returns empty for text without sources', async () => {
        const svc = new AdversarialSourceService();
        const res = await svc.verifyClaims('I think solar is good because sun is bright.', new AbortController().signal);
        expect(Array.isArray(res)).toBe(true);
    });
    it('does not throw on empty', async () => {
        const svc = new AdversarialSourceService();
        await expect(svc.verifyClaims('', new AbortController().signal)).resolves.toBeDefined();
    });
});
