import { describe, it, expect } from 'vitest';
import {
    getCatalogCapabilities,
    getCatalogContextWindow,
    getCatalogPricing,
    modelLookupKeys,
} from './catalog-lookup';

describe('catalog lookup', () => {
    it('resolves bare model ids', () => {
        expect(getCatalogContextWindow('gpt-4o')).toBe(128000);
        expect(getCatalogPricing('gpt-4o')).toMatchObject({ input: 2.5, output: 10 });
        expect(getCatalogCapabilities('gpt-4o')?.toolCall).toBe(true);
    });

    it('resolves provider-prefixed model ids', () => {
        expect(getCatalogContextWindow('openai/gpt-4o')).toBe(128000);
        expect(getCatalogContextWindow('groq:llama-3.1-8b-instant')).toBe(131072);
        expect(getCatalogPricing('openrouter/anthropic/claude-opus-4.7')).toBeDefined();
    });

    it('returns undefined for unknown models', () => {
        expect(getCatalogContextWindow('completely-unknown-model-v99')).toBeUndefined();
        expect(getCatalogPricing('completely-unknown-model-v99')).toBeUndefined();
        expect(getCatalogCapabilities('completely-unknown-model-v99')).toBeUndefined();
        expect(getCatalogContextWindow('')).toBeUndefined();
    });

    it('builds lookup keys from most specific to least specific', () => {
        expect(modelLookupKeys('openai/gpt-4o')).toEqual(['openai/gpt-4o', 'gpt-4o']);
        expect(modelLookupKeys('GPT-4O')).toEqual(['gpt-4o']);
        expect(modelLookupKeys('anthropic/claude-opus-4.7')).toEqual([
            'anthropic/claude-opus-4.7',
            'claude-opus-4.7',
        ]);
    });
});
