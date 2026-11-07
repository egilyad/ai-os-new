import { describe, it, expect } from 'vitest';
import { summarizeProviderFleet } from './provider-fleet-health';
import type { ApiKey } from '../types/metrics-types';

function key(status: ApiKey['status']): ApiKey {
    return {
        id: `k-${status}`,
        provider: 'openai',
        key: 'sk-1',
        label: 'k',
        status,
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
        },
    } as ApiKey;
}

describe('summarizeProviderFleet', () => {
    it('reports no_adapter when the provider has no adapter', () => {
        const result = summarizeProviderFleet('openai', [key('active')], false);
        expect(result.status).toBe('no_adapter');
        expect(result.hint).toContain('No adapter');
    });

    it('reports unconfigured when no keys exist', () => {
        const result = summarizeProviderFleet('openai', [], true);
        expect(result.status).toBe('unconfigured');
    });

    it('reports ready when all keys are active', () => {
        const result = summarizeProviderFleet('openai', [key('active'), key('active')], true);
        expect(result.status).toBe('ready');
        expect(result.readyCount).toBe(2);
    });

    it('reports broken when all keys are in broken statuses', () => {
        const result = summarizeProviderFleet('openai', [key('error'), key('quarantined')], true);
        expect(result.status).toBe('broken');
    });

    it('reports degraded on mixed health', () => {
        const result = summarizeProviderFleet('openai', [key('active'), key('pending')], true);
        expect(result.status).toBe('degraded');
    });

    it('downgrades ready to degraded on low reliability', () => {
        const result = summarizeProviderFleet('openai', [key('active')], true, 0, 0.2);
        expect(result.status).toBe('degraded');
        expect(result.hint).toContain('Low reliability');
    });
});
