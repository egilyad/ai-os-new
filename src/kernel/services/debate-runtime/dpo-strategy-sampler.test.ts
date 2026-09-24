import { describe, it, expect } from 'vitest';
import { DpoStrategySampler } from './dpo-strategy-sampler';

describe('DpoStrategySampler', () => {
    it('sample returns something', () => {
        const s = new DpoStrategySampler();
        const res = s.scorePreference('climate action now with strong evidence', 'climate topic', []);
        expect(typeof res.overall).toBe('number');
    });
    it('does not throw', () => {
        const s = new DpoStrategySampler();
        expect(() => s.rankByPreference([{ text: 'test argument', agentId: 'a' }], 'test', 1)).not.toThrow();
    });
    it('instantiable', () => {
        expect(new DpoStrategySampler()).toBeDefined();
    });
});
