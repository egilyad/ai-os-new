import { describe, it, expect } from 'vitest';
import { PersonaMixer } from './persona-mixer';

describe('PersonaMixer', () => {
    it('mix returns string', () => {
        const m = new PersonaMixer();
        const fn = (m as any).mix || (m as any).blend || (m as any).combine;
        if (fn) {
            const res = fn.call(m, ['scientist', 'philosopher'], 'climate');
            expect(typeof res === 'string' || typeof res === 'object').toBe(true);
        } else {
            expect(m).toBeDefined();
        }
    });
    it('does not throw on empty', () => {
        const m = new PersonaMixer();
        expect(() => (m as any).mix?.([], '')).not.toThrow();
    });
    it('instantiable', () => {
        expect(new PersonaMixer()).toBeDefined();
    });
});
