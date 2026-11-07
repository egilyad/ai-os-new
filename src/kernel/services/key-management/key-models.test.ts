import { describe, it, expect, vi } from 'vitest';
import { KeyModels } from './key-models';
import type { ApiKey } from '../../types/metrics-types';

function key(id: string, provider = 'OpenRouter'): ApiKey {
    return {
        id,
        provider,
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
    } as ApiKey;
}

function makeDeps(overrides: { adapter?: { getAvailableModels: unknown }; provider?: string } = {}) {
    const keys = new Map<string, ApiKey>([[overrides.provider ? 'k1' : 'k1', key('k1', overrides.provider ?? 'OpenRouter')]]);
    const registry = {
        getKey: vi.fn((id: string) => keys.get(id)),
        modifyKey: vi.fn((id: string, fn: (k: ApiKey) => void) => {
            const k = keys.get(id);
            if (k) {
                fn(k);
                keys.set(id, k);
            }
        }),
    };
    const eventBus = { emit: vi.fn() };
    const updateKeyStatus = vi.fn();
    const providerAdapterRegistry = overrides.adapter
        ? { getAdapter: vi.fn(() => overrides.adapter) }
        : undefined;
    const svc = new KeyModels({
        eventBus,
        registry,
        providerAdapterRegistry: providerAdapterRegistry as never,
        updateKeyStatus,
    });
    return { svc, registry, eventBus, updateKeyStatus, keys };
}

describe('KeyModels', () => {
    it('refreshModels resolves models through the adapter and updates the key', async () => {
        const { svc, registry, eventBus, updateKeyStatus } = makeDeps({
            adapter: { getAvailableModels: vi.fn(async () => ['model-a', 'model-b']) },
        });
        await svc.refreshModels('k1');
        expect(updateKeyStatus).toHaveBeenCalledWith('k1', 'checking');
        expect(updateKeyStatus).toHaveBeenCalledWith('k1', 'active');
        expect(registry.modifyKey).toHaveBeenCalledWith('k1', expect.any(Function));
        expect(registry.getKey('k1')?.availableModels).toEqual(['model-a', 'model-b']);
        expect(eventBus.emit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'success' }));
    });

    it('refreshModels falls back to static defaults without an adapter', async () => {
        const { svc, registry } = makeDeps();
        await svc.refreshModels('k1');
        expect(registry.getKey('k1')?.availableModels?.length).toBeGreaterThan(0);
    });

    it('refreshModels skips missing keys', async () => {
        const { svc, registry, updateKeyStatus } = makeDeps();
        await svc.refreshModels('missing');
        expect(registry.getKey).toHaveBeenCalledWith('missing');
        expect(updateKeyStatus).not.toHaveBeenCalled();
    });

    it('refreshModels marks error and notifies when the adapter throws', async () => {
        const { svc, eventBus, updateKeyStatus } = makeDeps({
            adapter: { getAvailableModels: vi.fn(async () => { throw new Error('boom'); }) },
        });
        await svc.refreshModels('k1');
        expect(updateKeyStatus).toHaveBeenCalledWith('k1', 'error');
        expect(eventBus.emit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'error' }));
    });
});
