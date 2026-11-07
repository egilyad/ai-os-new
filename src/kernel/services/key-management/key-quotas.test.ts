import { describe, it, expect, vi } from 'vitest';
import { KeyQuotas } from './key-quotas';
import type { ApiKey } from '../../types/metrics-types';

function baseKey(overrides: Partial<ApiKey> = {}): ApiKey {
    return {
        id: 'k1',
        provider: 'openai',
        key: 'sk-1',
        label: 'k1',
        status: 'active',
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
        },
        ...overrides,
    } as ApiKey;
}

/** Minimal extended-stats shape used by KeyQuotas (typed loosely for tests). */
function withExtended(k: ApiKey, ext: Record<string, unknown>): ApiKey {
    (k.stats as { extended?: Record<string, unknown> }).extended = ext;
    return k;
}

function quotaExt(partial: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        rules: { quota: { requestsPerDay: 100, tokensPerDay: 100, monthlyBudget: 100 } },
        usageToday: { requests: 0, tokens: 0 },
        usageMonthly: { estimatedCost: 0 },
        currentConcurrentRequests: 0,
        ...partial,
    };
}

function makeDeps() {
    return {
        eventBus: { emit: vi.fn() },
        onQuotaExceeded: vi.fn(),
        onStateTransition: vi.fn(),
        addAlert: vi.fn(),
    };
}

const FREE_LIMITS = { openai: { requestsPerDay: 50, tokensPerDay: 1000 } };

describe('KeyQuotas', () => {
    it('applyFreeTierQuota applies limits to free-tier keys', () => {
        const deps = makeDeps();
        const quotas = new KeyQuotas(deps, FREE_LIMITS);
        const k = baseKey({ tags: ['tier:free'] });
        withExtended(k, quotaExt());
        quotas.applyFreeTierQuota(k);
        const ext = (k.stats as { extended?: Record<string, unknown> }).extended as Record<string, unknown>;
        expect((ext.rules as Record<string, unknown>).quota).toMatchObject({
            requestsPerDay: 50,
            tokensPerDay: 1000,
        });
    });

    it('checkQuotas fires alert/transition/exceeded when token quota is hit', () => {
        const deps = makeDeps();
        const quotas = new KeyQuotas(deps, FREE_LIMITS);
        const k = baseKey();
        withExtended(k, quotaExt({ usageToday: { requests: 0, tokens: 100 } }));
        quotas.checkQuotas(k);
        expect(deps.onQuotaExceeded).toHaveBeenCalledWith('k1', 'openai', 'tokens');
        expect(deps.onStateTransition).toHaveBeenCalledWith('k1', 'UNSTABLE');
        expect(deps.addAlert).toHaveBeenCalledWith(
            'k1',
            expect.objectContaining({ type: 'quota_exceeded' }),
        );
    });

    it('isKeyQuotaExhausted returns true when requests are exhausted', () => {
        const deps = makeDeps();
        const quotas = new KeyQuotas(deps, FREE_LIMITS);
        const k = baseKey();
        withExtended(k, quotaExt({ usageToday: { requests: 100, tokens: 0 } }));
        expect(quotas.isKeyQuotaExhausted(k)).toBe(true);
    });

    it('canUseKey rejects inactive keys and exhausted quotas', () => {
        const deps = makeDeps();
        const quotas = new KeyQuotas(deps, FREE_LIMITS);
        expect(quotas.canUseKey(baseKey({ status: 'error' }))).toEqual({
            can: false,
            reason: 'Key inactive',
        });
        const k = baseKey();
        withExtended(k, quotaExt({ usageToday: { requests: 100, tokens: 0 } }));
        expect(quotas.canUseKey(k)).toEqual({ can: false, reason: 'Daily quota exceeded' });
    });
});
