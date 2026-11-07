import { describe, it, expect, vi } from 'vitest';
import { KeyStatusManager } from './key-status';
import type { ApiKey } from '../../types/metrics-types';

function key(id: string, status: ApiKey['status'] = 'active'): ApiKey {
    return {
        id,
        provider: 'openai',
        key: 'sk-1',
        label: id,
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

function makeDeps() {
    const keys = new Map<string, ApiKey>([
        ['k1', key('k1')],
        ['k2', key('k2', 'inactive')],
    ]);
    const registry = {
        getKey: vi.fn((id: string) => keys.get(id)),
        getKeys: vi.fn(() => [...keys.values()]),
        modifyKey: vi.fn((id: string, fn: (k: ApiKey) => void) => {
            const k = keys.get(id);
            if (k) {
                fn(k);
                keys.set(id, k);
            }
        }),
        saveKeys: vi.fn(async () => {}),
    };
    const eventBus = { emit: vi.fn(), emitOnce: vi.fn(() => true) };
    const health = { quarantineKey: vi.fn(() => true), compromiseKey: vi.fn() };
    const lifecycle = { onError: vi.fn() };
    const notify = vi.fn();
    const svc = new KeyStatusManager({
        eventBus,
        registry,
        health,
        lifecycle,
        notify,
    });
    return { svc, registry, eventBus, notify, keys };
}

describe('KeyStatusManager', () => {
    it('updateKeyStatus mutates status, bumps version, records history and emits', async () => {
        const { svc, registry, eventBus, notify } = makeDeps();
        svc.updateKeyStatus('k1', 'inactive');
        const k = registry.getKey('k1')!;
        expect(k.status).toBe('inactive');
        expect(k.statusVersion).toBe(1);
        expect(k.history?.[0]?.detail).toBe('active > inactive');
        expect(eventBus.emitOnce).toHaveBeenCalledWith(
            expect.anything(),
            'k1:openai:inactive',
            expect.objectContaining({ previousState: 'active' }),
        );
        expect(registry.saveKeys).toHaveBeenCalled();
        expect(notify).toHaveBeenCalled();
    });

    it('toggleKeyStatus flips active ↔ inactive', async () => {
        const { svc, registry } = makeDeps();
        await svc.toggleKeyStatus('k1');
        expect(registry.getKey('k1')?.status).toBe('inactive');
        await svc.toggleKeyStatus('k1');
        expect(registry.getKey('k1')?.status).toBe('active');
        await svc.toggleKeyStatus('k2');
        expect(registry.getKey('k2')?.status).toBe('active');
    });

    it('enableAllKeys/disableAllKeys change every key', async () => {
        const { svc, registry } = makeDeps();
        await svc.enableAllKeys();
        expect(registry.getKeys().every((k) => k.status === 'active')).toBe(true);
        await svc.disableAllKeys();
        expect(registry.getKeys().every((k) => k.status === 'inactive')).toBe(true);
    });
});
