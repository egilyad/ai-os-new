import { describe, it, expect, vi } from 'vitest';
import { KeyPoolSelector } from './key-pool-selector';
import type { ApiKey } from '../../types/metrics-types';

function key(id: string, partial: Partial<ApiKey> = {}): ApiKey {
    return {
        id,
        provider: 'openai',
        key: 'sk-1',
        label: id,
        status: 'active',
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
        },
        ...partial,
    } as ApiKey;
}

function makeDeps(overrides: { pool?: ApiKey[]; all?: ApiKey[] } = {}) {
    const pool = overrides.pool ?? [key('k1'), key('k2')];
    const all = overrides.all ?? pool;
    return {
        eventBus: { emit: vi.fn(), on: vi.fn(() => () => {}), onSafe: vi.fn(() => () => {}) },
        getPoolKeys: vi.fn(() => pool),
        getKeysByProvider: vi.fn(() => all),
        canUseKey: vi.fn((k: ApiKey) => ({ can: k.status === 'active' })),
        isKeyQuotaExhausted: vi.fn(() => false),
        saveConfig: vi.fn(async () => {}),
        freeTierLimits: { openai: { requestsPerDay: 100, tokensPerDay: 1000 } },
    };
}

describe('KeyPoolSelector', () => {
    it('setPoolStrategy stores strategy, persists and emits', async () => {
        const deps = makeDeps();
        const sel = new KeyPoolSelector(deps);
        await sel.setPoolStrategy('openai', 'random');
        expect(sel.getPoolStrategy('openai')).toBe('random');
        expect(deps.saveConfig).toHaveBeenCalled();
        expect(deps.eventBus.emit).toHaveBeenCalled();
    });

    it('selectFromPool round-robins across available keys', () => {
        const deps = makeDeps();
        const sel = new KeyPoolSelector(deps);
        const first = sel.selectFromPool('openai');
        const second = sel.selectFromPool('openai');
        expect(first?.id).toBe('k1');
        expect(second?.id).toBe('k2');
    });

    it('selectFromPool returns null when the pool has no usable keys', () => {
        const deps = makeDeps({
            pool: [key('k1', { status: 'inactive' }), key('k2', { status: 'error' })],
        });
        const sel = new KeyPoolSelector(deps);
        expect(sel.selectFromPool('openai')).toBeNull();
    });

    it('selectFromPool least-usage picks the least used key', () => {
        const k1 = key('k1');
        (k1.stats as { extended?: unknown }).extended = { usageToday: { requests: 10 } };
        const k2 = key('k2');
        (k2.stats as { extended?: unknown }).extended = { usageToday: { requests: 2 } };
        const deps = makeDeps({ pool: [k1, k2] });
        const sel = new KeyPoolSelector(deps);
        expect(sel.selectFromPool('openai', 'least-usage')?.id).toBe('k2');
    });

    it('getPoolStatus aggregates total/active/used/limit', () => {
        const deps = makeDeps();
        const sel = new KeyPoolSelector(deps);
        const status = sel.getPoolStatus('openai');
        expect(status.total).toBe(2);
        expect(status.active).toBe(2);
        expect(status.used).toBe(0);
        expect(status.limit).toBe(100);
    });
});
