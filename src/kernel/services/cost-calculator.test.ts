/**
 * CostCalculator tests — AGEMS port Phase 12.5.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CostCalculator } from './cost-calculator';

describe('CostCalculator', () => {
    let calc: CostCalculator;

    beforeEach(() => {
        calc = new CostCalculator();
    });

    it('calculates cost for known model', () => {
        const result = calc.calculate('gpt-4o', 'openai', 1000, 500);
        expect(result.inputTokens).toBe(1000);
        expect(result.outputTokens).toBe(500);
        expect(result.totalCost).toBeGreaterThan(0);
        expect(result.currency).toBe('USD');
    });

    it('returns 0 for unknown model', () => {
        const result = calc.calculate('unknown', 'unknown', 1000, 500);
        expect(result.totalCost).toBe(0);
    });

    it('setPricing overrides default', () => {
        calc.setPricing('custom-model', 'custom', 10 / 1000, 20 / 1000);
        const result = calc.calculate('custom-model', 'custom', 1000, 1000);
        expect(result.totalCost).toBeCloseTo(0.03, 3);
    });

    it('formats cost', () => {
        const result = calc.calculate('gpt-4o', 'openai', 100, 50);
        const formatted = calc.formatCost(result);
        expect(formatted).toMatch(/^\$[\d.]+ USD$/);
    });

    it('getPricing returns tables', () => {
        const tables = calc.getPricing();
        expect(tables.length).toBeGreaterThan(0);
    });

    it('estimate from text', () => {
        const result = calc.estimate('gpt-4o', 'openai', 'A'.repeat(1000), 'B'.repeat(500));
        expect(result.totalCost).toBeGreaterThan(0);
    });
});
