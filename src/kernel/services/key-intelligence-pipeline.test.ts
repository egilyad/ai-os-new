import { describe, it, expect, vi } from 'vitest';
import { KeyIntelligencePipeline } from './key-intelligence-pipeline';

function makeFingerprints() {
    return {
        detectProvider: vi.fn(() => 'openrouter'),
        fingerprintKey: vi.fn(async (raw: string) => `fp:${raw}`),
        extractAccountId: vi.fn(() => 'acc-1'),
        extractAccountLabel: vi.fn(() => 'Acct'),
    };
}

function makePipeline(overrides: { existingKeys?: unknown[]; verifyKey?: unknown } = {}) {
    const fingerprints = makeFingerprints();
    const deps = {
        fingerprints,
        getExistingKeys: vi.fn(() => (overrides.existingKeys ?? []) as never[]),
        verifyKey: overrides.verifyKey as never,
    };
    const svc = new KeyIntelligencePipeline(deps as never);
    return { svc, fingerprints, deps };
}

describe('KeyIntelligencePipeline', () => {
    it('parses newline-separated keys and reports counts', async () => {
        const { svc } = makePipeline();
        const report = await svc.run({ rawText: 'sk-a\nsk-b\nsk-c' });
        expect(report.totalInput).toBe(3);
        expect(report.added).toBe(3);
        expect(report.invalid).toBe(0);
        expect(report.duplicates).toBe(0);
        expect(report.parsed).toHaveLength(3);
        expect(report.parsed[0]?.provider).toBe('openrouter');
    });

    it('detects duplicates against existing fingerprints', async () => {
        const existing = [{ id: 'k1', provider: 'openrouter', key: 'sk-a', fingerprint: 'fp:sk-a' }];
        const { svc } = makePipeline({ existingKeys: existing });
        const report = await svc.run({ rawText: 'sk-a\nsk-b', existingKeys: existing });
        expect(report.added).toBe(1);
        expect(report.duplicates).toBe(1);
    });

    it('flags keys with whitespace as invalid', async () => {
        const { svc } = makePipeline();
        const report = await svc.run({ rawText: 'sk with spaces' });
        expect(report.invalid).toBe(1);
        expect(report.added).toBe(0);
        expect(report.parsed[0]?.isValid).toBe(false);
    });

    it('parses JSON objects with a key field', async () => {
        const { svc } = makePipeline();
        const report = await svc.run({
            rawText: JSON.stringify([{ provider: 'openrouter', key: 'sk-json' }]),
        });
        expect(report.totalInput).toBe(1);
        expect(report.added).toBe(1);
    });
});
