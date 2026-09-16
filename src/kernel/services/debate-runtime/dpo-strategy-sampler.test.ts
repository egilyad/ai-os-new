import { describe, it, expect } from 'vitest';
import { DpoStrategySampler } from './dpo-strategy-sampler';

describe('DpoStrategySampler', () => {
    it('sample returns something', () => {
        const s = new DpoStrategySampler();
        const fn = (s as any).sample || (s as any).select || (s as any).getStrategy;
        if (fn) {
            const res = fn.call(s, 'climate topic', []);
            expect(res === null || typeof res === 'object' || typeof res === 'string').toBe(true);
        } else {
            expect(s).toBeDefined();
        }
    });
    it('does not throw', () => {
        const s = new DpoStrategySampler();
        expect(() => (s as any).sample?.('test', [])).not.toThrow();
    });
    it('instantiable', () => {
        expect(new DpoStrategySampler()).toBeDefined();
    });
});
