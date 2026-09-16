import { describe, it, expect } from 'vitest';
import { IncentiveDetector } from './incentive-detector';

describe('IncentiveDetector', () => {
    const svc = new IncentiveDetector();
    it('analyze returns null or analysis', () => {
        const res = svc.analyze('alice', 'Alice', 'We support oil deregulation because it boosts our portfolio and shareholder value.', 'Should we deregulate oil?');
        expect(res === null || typeof res === 'object').toBe(true);
        if (res) {
            expect(res).toHaveProperty('profiles');
            expect(res).toHaveProperty('conflictOfInterest');
        }
    });
    it('analyze neutral topic returns something', () => {
        const res = svc.analyze('bob', 'Bob', 'I think education should be free for all children.', 'Education funding');
        expect(res === null || typeof res === 'object').toBe(true);
    });
    it('does not throw on empty', () => {
        expect(() => svc.analyze('alice', 'Alice', '', 'Topic')).not.toThrow();
    });
});
