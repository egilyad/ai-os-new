import { describe, it, expect } from 'vitest';
import { matchSemanticRule, DEFAULT_SEMANTIC_RULES } from './route-rules';
import type { RequestClassification } from './router-types';
import type { SemanticRouteRule } from '../types/routing-types';

function cls(overrides?: Partial<RequestClassification>): RequestClassification {
    return {
        intent: 'code',
        language: 'en',
        complexity: 'simple',
        isCode: false,
        isLong: false,
        isMultimodal: false,
        ...overrides,
    } as RequestClassification;
}

describe('matchSemanticRule', () => {
    it('should match by intent', () => {
        const result = matchSemanticRule(DEFAULT_SEMANTIC_RULES, cls({ intent: 'code' }));
        expect(result).not.toBeNull();
        expect(result?.id).toBe('code-en');
    });

    it('should match by intent and language', () => {
        const result = matchSemanticRule(
            DEFAULT_SEMANTIC_RULES,
            cls({ intent: 'code', language: 'ru' }),
        );
        expect(result).not.toBeNull();
        expect(result?.id).toBe('code-ru');
    });

    it('should respect priority (highest first)', () => {
        const result = matchSemanticRule(
            DEFAULT_SEMANTIC_RULES,
            cls({ intent: 'code', language: 'ru' }),
        );
        expect(result?.priority).toBe(100);
    });

    it('should match by complexity', () => {
        const result = matchSemanticRule(
            DEFAULT_SEMANTIC_RULES,
            cls({ intent: 'analysis', complexity: 'complex' }),
        );
        expect(result?.id).toBe('complex-reasoning');
    });

    it('should return null when no rule matches', () => {
        const result = matchSemanticRule(DEFAULT_SEMANTIC_RULES, cls({ intent: 'general' }));
        // general intent has no matching default rule
        expect(result).toBeNull();
    });

    it('should filter by isCode flag', () => {
        const result = matchSemanticRule(
            DEFAULT_SEMANTIC_RULES,
            cls({ intent: 'code', isCode: false }),
        );
        // code-en has no isCode condition, so it matches
        expect(result).not.toBeNull();
    });

    it('should filter by isMultimodal flag', () => {
        const rules: SemanticRouteRule[] = [
            {
                id: 'multi-rule',
                label: 'Multimodal',
                condition: { isMultimodal: true },
                target: { provider: 'gemini', model: 'g-1' },
                priority: 50,
            },
        ];
        const match = matchSemanticRule(rules, cls({ isMultimodal: true }));
        expect(match?.id).toBe('multi-rule');
        const noMatch = matchSemanticRule(rules, cls({ isMultimodal: false }));
        expect(noMatch).toBeNull();
    });

    it('should sort by priority descending', () => {
        const rules: SemanticRouteRule[] = [
            {
                id: 'low',
                label: 'Low',
                condition: { intents: ['code'] as const },
                target: { provider: 'a' },
                priority: 10,
            },
            {
                id: 'high',
                label: 'High',
                condition: { intents: ['code'] as const },
                target: { provider: 'b' },
                priority: 50,
            },
        ];
        const result = matchSemanticRule(rules, cls({ intent: 'code' }));
        expect(result?.id).toBe('high');
    });

    it('should match by isLong flag', () => {
        const rules: SemanticRouteRule[] = [
            {
                id: 'long-rule',
                label: 'Long',
                condition: { isLong: true },
                target: { provider: 'gemini' },
                priority: 50,
            },
        ];
        expect(matchSemanticRule(rules, cls({ isLong: true }))?.id).toBe('long-rule');
        expect(matchSemanticRule(rules, cls({ isLong: false }))).toBeNull();
    });

    it('should match DEFAULT_SEMANTIC_RULES factual intent', () => {
        const result = matchSemanticRule(DEFAULT_SEMANTIC_RULES, cls({ intent: 'factual' }));
        expect(result?.id).toBe('factual');
        expect(result?.target.provider).toBe('groq');
    });
});
