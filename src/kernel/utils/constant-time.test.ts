import { describe, it, expect } from 'vitest';
import { constantTimeEqual } from './constant-time';

describe('constantTimeEqual', () => {
    it('returns true for identical strings', () => {
        expect(constantTimeEqual('secret', 'secret')).toBe(true);
        expect(constantTimeEqual('', '')).toBe(true);
    });

    it('returns false for different strings', () => {
        expect(constantTimeEqual('secret', 'secret2')).toBe(false);
        expect(constantTimeEqual('abc', 'abd')).toBe(false);
    });

    it('returns false for different lengths', () => {
        expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    });
});
