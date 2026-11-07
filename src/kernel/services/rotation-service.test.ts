import { describe, it, expect, vi } from 'vitest';
import { RotationService, type RotationServiceDeps } from './rotation-service';
import type { ApiKey } from '../types/metrics-types';

function makeKey(id: string, partial: Partial<ApiKey> = {}): ApiKey {
    return {
        id,
        provider: 'openrouter',
        label: id,
        status: 'active',
        key: 'sk-test',
        ...partial,
    } as ApiKey;
}

function makeDeps() {
    const keys = new Map<string, ApiKey>();
    const keyManager = {
        getKeys: vi.fn(() => [...keys.values()]),
        getKey: vi.fn((id: string) => keys.get(id)),
        addKey: vi.fn(async (data: Omit<ApiKey, 'id' | 'stats'>) => {
            const k = makeKey(`k-${keys.size + 1}`, data as Partial<ApiKey>);
            keys.set(k.id, k);
            return k;
        }),
        updateKey: vi.fn((id: string, data: Partial<ApiKey>) => {
            const k = keys.get(id);
            if (k) keys.set(id, { ...k, ...data });
        }),
    };
    const eventBus = {
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
        emit: vi.fn(),
    };
    const adapterRegistry = {
        getAdapter: vi.fn(() => undefined),
    };
    const deps: RotationServiceDeps = {
        keyManager,
        eventBus,
        adapterRegistry,
    };
    return { deps, keys, keyManager, eventBus };
}

describe('RotationService', () => {
    it('scheduleRotation sets an active timer and updates key config', () => {
        const { deps, keys } = makeDeps();
        keys.set('k1', makeKey('k1'));
        const svc = new RotationService(deps);
        svc.scheduleRotation('k1', 24);
        const status = svc.getTTLStatus('k1');
        expect(status.active).toBe(true);
        expect(status.remainingMs).toBeGreaterThan(0);
        expect(status.expiresAt).not.toBeNull();
        expect(deps.keyManager.updateKey).toHaveBeenCalledWith(
            'k1',
            expect.objectContaining({ rotationConfig: expect.objectContaining({ ttlHours: 24 }) }),
        );
        svc.destroy();
    });

    it('cancelRotation removes the active timer', () => {
        const { deps, keys } = makeDeps();
        keys.set('k1', makeKey('k1'));
        const svc = new RotationService(deps);
        svc.scheduleRotation('k1', 24);
        svc.cancelRotation('k1');
        expect(svc.getTTLStatus('k1').active).toBe(false);
        expect(svc.getTTLRemaining('k1')).toBe(0);
        svc.destroy();
    });

    it('setKeyTTL with non-positive ttl cancels and clears config', () => {
        const { deps, keys } = makeDeps();
        keys.set('k1', makeKey('k1', { rotationConfig: { ttlHours: 24, autoRotate: false, notifyBefore: '1' } }));
        const svc = new RotationService(deps);
        svc.setKeyTTL('k1', 0);
        expect(svc.getTTLStatus('k1').active).toBe(false);
        expect(deps.keyManager.updateKey).toHaveBeenCalledWith('k1', { rotationConfig: undefined });
        svc.destroy();
    });

    it('rotateNow returns false when the key is missing', async () => {
        const { deps } = makeDeps();
        const svc = new RotationService(deps);
        await expect(svc.rotateNow('missing')).resolves.toBe(false);
        svc.destroy();
    });

    it('getRotationHistory returns stored events', () => {
        const { deps, keys } = makeDeps();
        const rotationHistory = [{ id: 'r1', keyId: 'k1', timestamp: 1, type: 'auto', fromStatus: 'active', toStatus: 'inactive', result: 'success' }];
        keys.set('k1', makeKey('k1', { rotationHistory: rotationHistory as never }));
        const svc = new RotationService(deps);
        expect(svc.getRotationHistory('k1')).toHaveLength(1);
        expect(svc.getRotationHistory('missing')).toEqual([]);
        svc.destroy();
    });
});
