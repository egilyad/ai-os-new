import { describe, it, expect } from 'vitest';
import { CounterfactualService } from './counterfactual-service';

describe('CounterfactualService', () => {
    const s = new CounterfactualService();
    it('generates scenario', () => {
        const c = s.generate('Climate policy', 'Fossil fuels cause warming and must be banned');
        expect(c).not.toBeNull();
        expect(c!.assumption.length).toBeGreaterThan(0);
    });
    it('null for short claim', () => {
        expect(s.generate('Topic', 'hi')).toBeNull();
    });
    it('contains implication', () => {
        const c = s.generate('Topic', 'This is a long enough opponent claim to trigger generation');
        expect(c!.implication).toContain('Topic');
    });
});
