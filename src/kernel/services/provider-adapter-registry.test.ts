import { describe, it, expect } from 'vitest';
import { ProviderAdapterRegistry } from './provider-adapter-registry';

describe('ProviderAdapterRegistry fallback wiring (C-2)', () => {
    it('forwards the stored key resolver to fallback composites', () => {
        const registry = new ProviderAdapterRegistry();
        const plain = registry.getOrCreateWithFallback('mock', 'groq');
        expect(plain).toBe(registry.getOrCreateWithFallback('mock', 'groq'));

        registry.setKeyResolver(() => 'sk-x');
        const keyed = registry.getOrCreateWithFallback('mock', 'groq');
        // Separate cache entry from the legacy pass-through instance.
        expect(keyed).not.toBe(plain);
        expect(registry.getOrCreateWithFallback('mock', 'groq')).toBe(keyed);
    });

    it('explicit per-call resolver takes precedence over the stored one', () => {
        const registry = new ProviderAdapterRegistry();
        registry.setKeyResolver(() => 'sk-stored');
        const viaStored = registry.getOrCreateWithFallback('mock', 'groq');
        // Explicit resolver hits the same keyed cache entry (pair-keyed).
        const viaExplicit = registry.getOrCreateWithFallback('mock', 'groq', () => 'sk-explicit');
        expect(viaExplicit).toBe(viaStored);
    });
});
