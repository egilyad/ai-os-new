import { describe, expect, it } from 'vitest';
import {
    FREE_TIER_PROVIDERS,
    getFreeModels,
    getFreeTierProviders,
    isFreeTierProvider,
    resolveFreeModel,
    resolveProviderEnvVar,
} from './free-tiers';

describe('free-tier registry', () => {
    it('exposes the providers already supported by the project', () => {
        expect(isFreeTierProvider('openrouter')).toBe(true);
        expect(isFreeTierProvider('gemini')).toBe(true);
        expect(isFreeTierProvider('groq')).toBe(true);
        expect(isFreeTierProvider('nvidia')).toBe(true);
        expect(isFreeTierProvider('cerebras')).toBe(true);
        expect(isFreeTierProvider('cloudflare')).toBe(true);
        expect(isFreeTierProvider('does-not-exist')).toBe(false);
    });

    it('splits free access from trial credits', () => {
        const free = getFreeTierProviders('free');
        const credits = getFreeTierProviders('credits');
        expect(free.length).toBeGreaterThan(0);
        expect(credits.length).toBeGreaterThan(0);
        expect(free.every((p) => p.kind === 'free')).toBe(true);
        expect(credits.every((p) => p.kind === 'credits')).toBe(true);
    });

    it('every provider declares env vars, a signup url and limits', () => {
        for (const provider of Object.values(FREE_TIER_PROVIDERS)) {
            expect(provider.envVars.length, provider.id).toBeGreaterThan(0);
            expect(provider.signupUrl, provider.id).toMatch(/^https:\/\//);
            expect(provider.limits.length, provider.id).toBeGreaterThan(0);
        }
    });

    it('resolves the env var that actually holds the key', () => {
        const env = { GOOGLE_API_KEY: 'x' };
        expect(resolveProviderEnvVar('gemini', env)).toBe('GOOGLE_API_KEY');
        expect(resolveProviderEnvVar('gemini', { GEMINI_API_KEY: 'y' })).toBe('GEMINI_API_KEY');
        expect(resolveProviderEnvVar('gemini', {})).toBeUndefined();
        expect(resolveProviderEnvVar('unknown', { GEMINI_API_KEY: 'y' })).toBeUndefined();
    });

    it('keeps the preferred model when it is free', () => {
        expect(resolveFreeModel('groq', 'openai/gpt-oss-120b')).toBe('openai/gpt-oss-120b');
    });

    it('falls back to a known free model when the preferred one is not free', () => {
        const resolved = resolveFreeModel('groq', 'llama-3.3-70b-versatile');
        expect(getFreeModels('groq')).toContain(resolved);
    });

    it('returns the preferred model when the provider has no free list', () => {
        expect(resolveFreeModel('nvidia', 'openai/gpt-oss-120b')).toBe('openai/gpt-oss-120b');
    });
});
