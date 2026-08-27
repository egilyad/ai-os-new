import { describe, it, expect } from 'vitest';
import { SynthesisService } from './synthesis-service';

describe('SynthesisService', () => {
    const s = new SynthesisService();
    it('synthesizes when both sides present', () => {
        const r = s.synthesize('Should we go solar?', ['Solar is cheap'], ['Nuclear is reliable']);
        expect(r).not.toBeNull();
        expect(r!.coherence).toBeGreaterThan(0);
        expect(r!.synthesis).toContain('solar');
    });
    it('null when one side empty', () => {
        expect(s.synthesize('Topic', [], ['con'])).toBeNull();
        expect(s.synthesize('Topic', ['pro'], [])).toBeNull();
    });
    it('returns points', () => {
        const r = s.synthesize('T', ['A', 'B', 'C'], ['X', 'Y'])!;
        expect(r.thesisPoints.length).toBeGreaterThan(0);
        expect(r.antithesisPoints.length).toBeGreaterThan(0);
    });
});
