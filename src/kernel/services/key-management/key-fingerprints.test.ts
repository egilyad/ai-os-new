import { describe, it, expect } from 'vitest';
import { KeyFingerprints } from './key-fingerprints';

const fp = new KeyFingerprints();

describe('KeyFingerprints', () => {
    it('detectProvider recognizes known prefixes', () => {
        expect(fp.detectProvider('AIzaSy...')).toBe('gemini');
        expect(fp.detectProvider('gsk_abc')).toBe('groq');
        expect(fp.detectProvider('sk-ant-abc')).toBe('anthropic');
        expect(fp.detectProvider('nvapi-abc')).toBe('nvidia');
        expect(fp.detectProvider('sk-or-abc')).toBe('openrouter');
        expect(fp.detectProvider('sk-proj-abcdefghijklmnopqrstuvwxyz')).toBe('openai');
        expect(fp.detectProvider('unknown-key')).toBeNull();
    });

    it('fingerprintKey produces a stable sha-256 hex', async () => {
        const a = await fp.fingerprintKey('sk-abc');
        const b = await fp.fingerprintKey('sk-abc');
        const c = await fp.fingerprintKey('sk-ABD');
        expect(a).toBe(b);
        expect(a).toHaveLength(64);
        expect(a).not.toBe(c);
    });

    it('findDuplicateFingerprints detects duplicates across existing and batch', async () => {
        const existing = [{ id: 'k1', provider: 'openai', key: 'sk-same' }] as never[];
        const batch = ['sk-same', 'sk-other', 'sk-other'];
        const duplicates = await fp.findDuplicateFingerprints(existing as never, batch);
        expect(duplicates.size).toBe(2);
        expect(duplicates.get(await fp.fingerprintKey('sk-other'))).toHaveLength(2);
    });

    it('matchesProviderFormat compares detected provider', async () => {
        await expect(fp.matchesProviderFormat('openai', 'sk-proj-abcdefghijklmnopqrstuvwxyz')).resolves.toBe(true);
        await expect(fp.matchesProviderFormat('groq', 'sk-proj-abcdefghijklmnopqrstuvwxyz')).resolves.toBe(false);
    });

    it('suggestModel returns a default model for known providers', () => {
        expect(fp.suggestModel('openai')).toBe('gpt-4o-mini');
        expect(fp.suggestModel('unknown')).toBeNull();
    });
});
