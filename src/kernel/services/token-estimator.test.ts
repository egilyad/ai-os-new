/**
 * TokenEstimator tests — AGEMS port Phase 12.4.
 */
import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateMessageTokens, truncateToTokenBudget } from './token-estimator';

describe('TokenEstimator', () => {
    it('estimates English text', () => {
        const tokens = estimateTokens('Hello world');
        expect(tokens).toBeGreaterThan(0);
        expect(tokens).toBeLessThanOrEqual(5);
    });

    it('estimates Russian text', () => {
        const tokens = estimateTokens('Привет мир');
        expect(tokens).toBeGreaterThan(0);
        expect(tokens).toBeLessThanOrEqual(7);
    });

    it('returns 0 for empty text', () => {
        expect(estimateTokens('')).toBe(0);
    });

    it('estimates message array', () => {
        const tokens = estimateMessageTokens([
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there' },
        ]);
        expect(tokens).toBeGreaterThan(0);
        expect(tokens).toBeLessThan(20);
    });

    it('truncates to token budget', () => {
        const text = 'A'.repeat(100);
        const truncated = truncateToTokenBudget(text, 10);
        expect(truncated.length).toBeLessThan(100);
        expect(truncated).toContain('...');
    });

    it('does not truncate if within budget', () => {
        const text = 'Hi';
        const truncated = truncateToTokenBudget(text, 100);
        expect(truncated).toBe('Hi');
    });
});
