import { describe, it, expect } from 'vitest';
import { EvidenceTriangulationService } from './evidence-triangulation-service';

describe('EvidenceTriangulationService', () => {
    const svc = new EvidenceTriangulationService();
    it('checkTriangulation scores diversity', () => {
        const r1 = svc.checkTriangulation('Claim', ['https://nature.com/paper', 'https://reuters.com/news']);
        expect(r1.isTriangulated).toBe(true);
        expect(r1.diverseTypes).toBeGreaterThanOrEqual(2);
        const r2 = svc.checkTriangulation('Claim', ['my blog']);
        expect(r2.isTriangulated).toBe(false);
    });
    it('isSufficientlySupported threshold', () => {
        expect(svc.isSufficientlySupported(['https://nature.com/a', 'https://reuters.com/b'])).toBe(true);
        expect(svc.isSufficientlySupported(['blog'])).toBe(false);
        expect(svc.isSufficientlySupported([])).toBe(false);
    });
    it('score in range 0-1', () => {
        const r = svc.checkTriangulation('Test claim with many sources', ['https://nature.com/a', 'https://reuters.com/b', 'https://data.gov/c']);
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(1);
    });
});
