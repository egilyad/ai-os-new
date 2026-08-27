import { describe, it, expect } from 'vitest';
import { BayesianJudge } from './bayesian-judge';

describe('BayesianJudge', () => {
    it('update does not throw', () => {
        const j = new BayesianJudge();
        j.reset(['alice']);
        expect(() => j.update('alice', 0.6)).not.toThrow();
    });
    it('getPosterior returns number', () => {
        const j = new BayesianJudge();
        j.reset(['alice']);
        j.update('alice', 0.7);
        const b = j.getPosterior('alice');
        expect(typeof b).toBe('number');
        expect(b).toBeGreaterThan(0);
        expect(b).toBeLessThanOrEqual(1);
    });
    it('reset works', () => {
        const j = new BayesianJudge();
        j.reset(['alice']);
        j.update('alice', 0.9);
        j.reset(['alice']);
        expect(j.getPosterior('alice')).toBe(0.5);
    });
});
