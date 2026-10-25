import { describe, expect, it } from 'vitest';
import { estimateTokens } from './tokenEstimate';

describe('estimateTokens', () => {
    it('returns 0 for empty input', () => {
        expect(estimateTokens('')).toBe(0);
    });

    it('uses default divisor of 4', () => {
        expect(estimateTokens('abcd')).toBe(1);
        expect(estimateTokens('abcdefgh')).toBe(2);
    });

    it('rounds up', () => {
        expect(estimateTokens('abcde')).toBe(2);
    });

    it('honors a custom divisor', () => {
        expect(estimateTokens('abcdefgh', 8)).toBe(1);
        expect(estimateTokens('abcdefghij', 8)).toBe(2);
    });
});
