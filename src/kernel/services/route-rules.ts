import type { SemanticRouteRule } from '../types/routing-types';
import type { RequestClassification } from './router-types';

export function matchSemanticRule(
    rules: SemanticRouteRule[],
    cls: RequestClassification,
): SemanticRouteRule | null {
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);
    for (const rule of sorted) {
        const c = rule.condition;
        if (c.intents && !c.intents.includes(cls.intent)) continue;
        if (c.languages && !c.languages.includes(cls.language)) continue;
        if (c.complexities && !c.complexities.includes(cls.complexity)) continue;
        if (c.isCode !== undefined && c.isCode !== cls.isCode) continue;
        if (c.isLong !== undefined && c.isLong !== cls.isLong) continue;
        if (c.isMultimodal !== undefined && c.isMultimodal !== cls.isMultimodal) continue;
        return rule;
    }
    return null;
}

export const DEFAULT_SEMANTIC_RULES: SemanticRouteRule[] = [
    {
        id: 'code-ru',
        label: 'Код на русском → Groq',
        condition: { intents: ['code'], languages: ['ru'] },
        target: { provider: 'groq', model: 'llama-3.1-8b-instant' },
        priority: 100,
    },
    {
        id: 'code-en',
        label: 'Code → Groq',
        condition: { intents: ['code'] },
        target: { provider: 'groq', model: 'llama-3.1-8b-instant' },
        priority: 90,
    },
    {
        id: 'math',
        label: 'Math → Gemini',
        condition: { intents: ['math'] },
        target: { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
        priority: 80,
    },
    {
        id: 'creative',
        label: 'Creative → Gemini',
        condition: { intents: ['creative'] },
        target: { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
        priority: 70,
    },
    {
        id: 'analysis-ru',
        label: 'Анализ на русском → Groq',
        condition: { intents: ['analysis'], languages: ['ru'] },
        target: { provider: 'groq', model: 'llama-3.1-8b-instant' },
        priority: 60,
    },
    {
        id: 'factual',
        label: 'Factual → Groq',
        condition: { intents: ['factual'] },
        target: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        priority: 50,
    },
    {
        id: 'complex-reasoning',
        label: 'Complex reasoning → Gemini',
        condition: { complexities: ['complex'], intents: ['analysis'] },
        target: { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
        priority: 40,
    },
];
