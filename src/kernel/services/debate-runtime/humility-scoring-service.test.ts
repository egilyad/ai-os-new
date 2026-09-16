import { describe, it, expect } from 'vitest';
import { HumilityScoringService } from './humility-scoring-service';

describe('HumilityScoringService', () => {
    const svc = new HumilityScoringService();
    it('detects hedge', () => {
        const s = svc.score('Maybe I am wrong, perhaps we should consider alternative?');
        expect(s.hasHedge).toBe(true);
        expect(s.humility).toBeGreaterThan(0.2);
    });
    it('detects overconfidence', () => {
        const s = svc.score('It is certainly always definitely true, everyone knows it.');
        expect(s.overconfidence).toBeGreaterThan(0.3);
        expect(s.humility).toBeLessThan(s.overconfidence);
    });
    it('isHumble', () => {
        expect(svc.isHumble('Maybe this is incorrect, I might be wrong')).toBe(true);
        expect(svc.isHumble('This is definitely always true, no doubt')).toBe(false);
    });
});
