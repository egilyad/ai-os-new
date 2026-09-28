import { describe, it, expect } from 'vitest';
import { AdapterFactory } from './adapter-factory';

describe('AdapterFactory', () => {
    it('lists supported providers', () => {
        const factory = new AdapterFactory();
        const list = factory.getSupportedProviders();
        expect(list.length).toBeGreaterThan(20);
        expect(list).toContain('groq');
        expect(list).toContain('openai');
        expect(list).toContain('azure');
        expect(list).toContain('mock');
    });

    it('rejects unknown providers', () => {
        const factory = new AdapterFactory();
        expect(() => factory.create('nope')).toThrow(/Unknown provider/);
        expect(factory.isSupported('nope')).toBe(false);
        expect(factory.isSupported('groq')).toBe(true);
    });

    it('normalizes case and caches instances', () => {
        const factory = new AdapterFactory();
        const a = factory.create('GROQ');
        const b = factory.create('groq');
        expect(a).toBe(b);
    });

    it('wires circuit breaker ref when enabled', () => {
        const factory = new AdapterFactory({ circuitBreaker: true });
        factory.create('groq');
        expect(factory.getCircuitBreakerState('groq')).toBe('closed');
        expect(factory.getProviderRuntimeStatus('groq')).toEqual({
            circuitOpen: false,
            rateLimited: false,
        });
        expect(() => factory.resetCircuitBreaker('groq')).not.toThrow();
    });

    it('wires rate limiter ref when enabled', () => {
        const factory = new AdapterFactory({ rateLimit: true, rateLimitMaxTokens: 1000 });
        factory.create('groq');
        expect(factory.getProviderRuntimeStatus('groq').rateLimited).toBe(false);
        factory.syncRateLimitState('groq', 0);
        expect(factory.getProviderRuntimeStatus('groq').rateLimited).toBe(true);
        factory.syncRateLimitState('groq', 10);
        expect(factory.getProviderRuntimeStatus('groq').rateLimited).toBe(false);
    });

    it('creates fallback composites and invalidates them', () => {
        const factory = new AdapterFactory();
        const fb = factory.createWithFallback('mock', 'groq');
        expect(fb.id).toContain('mock');
        expect(fb.id).toContain('groq');
        expect(factory.createWithFallback('mock', 'groq')).toBe(fb);
        factory.invalidateCache('mock+groq');
        expect(factory.createWithFallback('mock', 'groq')).not.toBe(fb);
    });
});
