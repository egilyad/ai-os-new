import { describe, expect, it } from 'vitest';
import {
    PROVIDER_DEFAULT_MODELS,
    PROVIDER_PREFERRED_MODELS,
    PROVIDER_DISPLAY_NAMES,
} from './provider-default-models';

describe('provider-default-models', () => {
    it('defines default models for core providers', () => {
        expect(PROVIDER_DEFAULT_MODELS.gemini).toBeDefined();
        expect(PROVIDER_DEFAULT_MODELS.groq).toBeDefined();
        expect(PROVIDER_DEFAULT_MODELS.openrouter).toBeDefined();
        expect(PROVIDER_DEFAULT_MODELS.nvidia).toBeDefined();
    });

    it('preferred models are non-empty arrays', () => {
        for (const v of Object.values(PROVIDER_PREFERRED_MODELS)) {
            expect(Array.isArray(v)).toBe(true);
            expect(v.length).toBeGreaterThan(0);
        }
    });

    it('display names are non-empty strings', () => {
        for (const v of Object.values(PROVIDER_DISPLAY_NAMES)) {
            expect(typeof v).toBe('string');
            expect(v.length).toBeGreaterThan(0);
        }
    });
});
