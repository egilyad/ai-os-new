import { describe, it, expect } from 'vitest';
import {
    CATALOG_CAPABILITIES,
    CATALOG_CONTEXT_WINDOWS,
    CATALOG_PRICING,
} from './models-catalog';
import { MODELS_CATALOG } from './models-catalog-detail';

describe('models catalog', () => {
    it('contains the expected mainstream models', () => {
        const gpt4o = MODELS_CATALOG.find((m) => m.id === 'openai/gpt-4o');
        expect(gpt4o).toBeDefined();
        expect(gpt4o?.context).toBe(128000);
        expect(gpt4o?.input).toBe(2.5);
        expect(gpt4o?.output).toBe(10);
        expect(gpt4o?.toolCall).toBe(true);
    });

    it('exposes context windows and pricing per 1M tokens', () => {
        expect(CATALOG_CONTEXT_WINDOWS['gpt-4o']).toBe(128000);
        expect(CATALOG_CONTEXT_WINDOWS['gemini-3.1-flash-lite']).toBe(1048576);
        expect(CATALOG_PRICING['gemini-3.1-flash-lite']).toEqual({
            input: 0.25,
            output: 1.5,
            provider: 'google',
        });
        expect(CATALOG_PRICING['claude-sonnet-4-5']).toMatchObject({ input: 3, output: 15 });
    });

    it('exposes capability flags', () => {
        expect(CATALOG_CAPABILITIES['gpt-4o']?.toolCall).toBe(true);
        expect(CATALOG_CAPABILITIES['gpt-4o']?.vision).toBe(true);
        expect(CATALOG_CAPABILITIES['claude-sonnet-4-5']?.reasoning).toBe(true);
    });

    it('keeps every entry well-formed', () => {
        const ids = new Set<string>();
        for (const entry of MODELS_CATALOG) {
            expect(entry.id).toBeTruthy();
            expect(ids.has(entry.id)).toBe(false);
            ids.add(entry.id);
            expect(entry.context).toBeGreaterThan(0);
            expect(Number.isFinite(entry.context)).toBe(true);
        }
        for (const [key, price] of Object.entries(CATALOG_PRICING)) {
            expect(key).toBe(key.toLowerCase());
            expect(Number.isFinite(price.input)).toBe(true);
            expect(Number.isFinite(price.output)).toBe(true);
            expect(price.input).toBeGreaterThanOrEqual(0);
            expect(price.output).toBeGreaterThanOrEqual(0);
        }
    });

    it('does not expose deprecated models through the lookup maps', () => {
        const deprecated = MODELS_CATALOG.filter((m) => m.deprecated);
        expect(deprecated.length).toBeGreaterThan(0);
        const liveKeys = new Set<string>();
        for (const entry of MODELS_CATALOG) {
            if (entry.deprecated) continue;
            const key = entry.model.toLowerCase();
            liveKeys.add(key);
            const slash = key.indexOf('/');
            if (slash > 0) liveKeys.add(key.slice(slash + 1));
        }
        for (const key of Object.keys(CATALOG_CONTEXT_WINDOWS)) {
            expect(liveKeys.has(key)).toBe(true);
        }
        for (const key of Object.keys(CATALOG_PRICING)) {
            expect(liveKeys.has(key)).toBe(true);
        }
    });
});
