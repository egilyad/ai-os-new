import { describe, it, expect, vi } from 'vitest';
import { KeyRegistry, type KeyRegistryDeps } from './key-registry';
import type { ApiKey } from '../../types/metrics-types';
import { EVENTS } from '../../events/event-names';
import { anchorDexieInstance } from '../dexie-identity';
import Dexie from 'dexie';

await anchorDexieInstance('key-registry.test', new Dexie('key-registry-test'));

function makeDeps(opts: { hasVault?: boolean; locked?: boolean } = {}) {
    const keyStore = {
        listKeys: vi.fn(async () => [] as ApiKey[]),
        deleteKey: vi.fn(async () => {}),
        bulkPut: vi.fn(async () => {}),
        saveKey: vi.fn(async () => {}),
        getKey: vi.fn(async () => null),
    };
    const eventBus = { on: vi.fn(() => () => {}), emit: vi.fn() };
    const deps: KeyRegistryDeps = {
        eventBus,
        securityService: {
            initialize: vi.fn(async () => true),
            encrypt: vi.fn(async () => null),
            decrypt: vi.fn(async () => null),
            isLocked: vi.fn(() => false),
            lock: vi.fn(),
        },
        pricingService: { calculateCost: vi.fn(() => 0) } as never,
        keyStore: keyStore as never,
        database: {
            getKv: vi.fn(async () => null),
            setKv: vi.fn(async () => {}),
        } as never,
        providerAdapterRegistry: { getAdapter: vi.fn() } as never,
        vault: {
            encryptKey: vi.fn(async (v: string) => `enc:${v}`),
            isLocked: vi.fn(() => opts.locked ?? false),
            hasVault: vi.fn(() => opts.hasVault ?? false),
            encryptAllKeys: vi.fn(async (keys: ApiKey[]) =>
                keys.map((k) => ({ ...k, key: `enc:${k.key}`, isEncrypted: true })),
            ),
            decryptAllKeys: vi.fn(async (keys: ApiKey[]) => keys),
            stripPlaintextKeys: vi.fn((keys: ApiKey[]) => keys),
        },
        freeTierLimits: {},
    } as unknown as KeyRegistryDeps;
    return { deps, keyStore, eventBus };
}

const key = (): ApiKey =>
    ({
        id: 'k1',
        provider: 'openai',
        key: 'sk-plaintext-123',
        label: 'main',
        isEncrypted: false,
        status: 'active',
        stats: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }) as unknown as ApiKey;

describe('KeyRegistry vault fail-closed (P1)', () => {
    it('refuses to save plaintext keys when a created vault is locked', async () => {
        const { deps, keyStore, eventBus } = makeDeps({ hasVault: true, locked: true });
        const registry = new KeyRegistry(deps);
        registry.loadKeys = vi.fn(async () => {});
        // Load a plaintext key into the internal snapshot via forceResync path.
        const store = keyStore as unknown as { listKeys: ReturnType<typeof vi.fn> };
        store.listKeys.mockResolvedValue([key()]);
        await registry.forceResyncFromDexie();

        await expect(registry.saveKeys()).rejects.toThrow(/vault is locked/i);
        expect(keyStore.bulkPut).not.toHaveBeenCalled();
        expect(eventBus.emit).toHaveBeenCalledWith(
            EVENTS.NOTIFICATION,
            expect.objectContaining({ type: 'error' }),
        );
    });

    it('still saves in plaintext mode when no vault was created', async () => {
        const { deps, keyStore } = makeDeps({ hasVault: false, locked: true });
        const registry = new KeyRegistry(deps);
        registry.loadKeys = vi.fn(async () => {});
        (keyStore as unknown as { listKeys: ReturnType<typeof vi.fn> }).listKeys.mockResolvedValue([
            key(),
        ]);
        await registry.forceResyncFromDexie();

        await expect(registry.saveKeys()).resolves.toBeUndefined();
        expect(keyStore.bulkPut).toHaveBeenCalled();
    });
});
