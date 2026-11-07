import { describe, it, expect, vi } from 'vitest';
import { KeyService, type KeyServiceDeps } from './key-service';
import { EVENTS } from '../../events/event-names';
import type { ApiKey } from '../../types/metrics-types';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';

function makeEventBus() {
    return {
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
        emit: vi.fn(),
        emitOnce: vi.fn(() => true),
    };
}

function makeKeyStore(initial: ApiKey[] = []) {
    const map = new Map<string, ApiKey>(initial.map((k) => [k.id, k]));
    return {
        saveKey: vi.fn(async (k: ApiKey) => {
            map.set(k.id, k);
        }),
        getKey: vi.fn(async (id: string) => map.get(id) ?? null),
        listKeys: vi.fn(async () => [...map.values()]),
        deleteKey: vi.fn(async (id: string) => {
            map.delete(id);
        }),
        bulkPut: vi.fn(async (keys: ApiKey[]) => {
            for (const k of keys) map.set(k.id, k);
        }),
        bulkAdd: vi.fn(async (keys: ApiKey[]) => {
            for (const k of keys) map.set(k.id, k);
        }),
        where: vi.fn(async (_field: string, value: string) => map.get(value)),
        exportAll: vi.fn(async () => JSON.stringify([...map.values()])),
        importAll: vi.fn(async (_payload: string) => {}),
        clear: vi.fn(async () => {
            map.clear();
        }),
        map,
    };
}

function makeDb() {
    const store = new Map<string, unknown>();
    return {
        getKv: vi.fn(async <T>(id: string): Promise<T | null> =>
            store.has(id) ? (store.get(id) as T) : null,
        ),
        setKv: vi.fn(async <T>(id: string, value: T): Promise<void> => {
            store.set(id, value);
        }),
        batchSetKv: vi.fn(async (entries: Record<string, unknown>): Promise<void> => {
            for (const [k, v] of Object.entries(entries)) store.set(k, v);
        }),
        db: {
            keyValue: {
                put: vi.fn(async () => {}),
            },
        },
        store,
    };
}

function makeProviderAdapterRegistry() {
    return {
        getAdapter: vi.fn(() => undefined),
        hasAdapter: vi.fn(() => false),
        getOrCreateWithFallback: vi.fn(() => ({})) as never,
        getAllProviders: vi.fn(() => []),
        getProviderRuntimeStatus: vi.fn(() => ({ circuitOpen: false, rateLimited: false })),
        getCircuitBreakerState: vi.fn(() => 'closed'),
        resetCircuitBreaker: vi.fn(),
        syncCircuitBreakerState: vi.fn(),
        syncRateLimitState: vi.fn(),
        invalidateCache: vi.fn(),
        clearAllCaches: vi.fn(),
    };
}

function makeService(overrides: Partial<KeyServiceDeps> = {}) {
    const eventBus = makeEventBus();
    const keyStore = makeKeyStore();
    const database = makeDb() as KeyServiceDeps['database'];
    const providerAdapterRegistry = makeProviderAdapterRegistry() as unknown as IAdapterRegistry;
    const deps: KeyServiceDeps = {
        eventBus,
        securityService: {
            initialize: vi.fn(async () => true),
            encrypt: vi.fn(async () => null),
            decrypt: vi.fn(async () => null),
            isLocked: vi.fn(() => false),
            lock: vi.fn(),
        },
        pricingService: {
            calculateCost: vi.fn(() => 0),
        },
        keyStore,
        database,
        providerAdapterRegistry,
        ...overrides,
    };
    const svc = new KeyService(deps);
    return { svc, deps, eventBus, keyStore, database, providerAdapterRegistry };
}

const OPENAI_KEY = 'sk-test-abcdefghijklmnopqrstuvwxyz';
const OPENAI_KEY_2 = 'sk-test-zzyyxwwvutsrqponmlkjihgfedcba';

function keyInput(partial: {
    provider: string;
    key: string;
    label: string;
    status?: ApiKey['status'];
}): Omit<ApiKey, 'id' | 'stats'> {
    return { status: 'active', ...partial };
}

describe('KeyService', () => {
    it('addKey creates a key, persists it and notifies', async () => {
        const { svc, keyStore, eventBus } = makeService();
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        expect(added?.id).toBeTruthy();
        expect(added?.status).toBe('active');
        expect(added?.stats).toBeDefined();
        expect(added?.fingerprint).toMatch(/^[0-9a-f]{64}$/);
        expect(keyStore.bulkPut).toHaveBeenCalled();
        expect(eventBus.emitOnce).toHaveBeenCalledWith(
            EVENTS.KEY_ADDED,
            added!.id,
            expect.objectContaining({ id: added!.id }),
        );
        expect(eventBus.emit).toHaveBeenCalledWith(
            EVENTS.NOTIFICATION,
            expect.objectContaining({ type: 'success' }),
        );
        expect(svc.getKey(added!.id)).toBeDefined();
        expect(svc.getKeys()).toHaveLength(1);
        svc.destroy();
    });

    it('addKey rejects empty and whitespace-only keys', async () => {
        const { svc, eventBus } = makeService();
        await expect(
            svc.addKey(keyInput({ provider: 'openai', key: '   ', label: 'x' })),
        ).resolves.toBeUndefined();
        expect(eventBus.emit).toHaveBeenCalledWith(
            EVENTS.NOTIFICATION,
            expect.objectContaining({ type: 'error' }),
        );
        expect(svc.getKeys()).toHaveLength(0);
        svc.destroy();
    });

    it('addKey rejects duplicate keys by fingerprint', async () => {
        const { svc } = makeService();
        await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'a' }));
        const dup = await svc.addKey(
            keyInput({ provider: 'groq', key: OPENAI_KEY, label: 'b' }),
        );
        expect(dup).toBeUndefined();
        expect(svc.getKeys()).toHaveLength(1);
        svc.destroy();
    });

    it('removeKey removes the key, deletes it from the store and cleans adapter cache', async () => {
        const { svc, keyStore, eventBus, providerAdapterRegistry } = makeService();
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        await svc.removeKey(added!.id);
        expect(svc.getKey(added!.id)).toBeUndefined();
        expect(keyStore.deleteKey).toHaveBeenCalledWith(added!.id);
        expect(providerAdapterRegistry.invalidateCache).toHaveBeenCalledWith('openai');
        expect(eventBus.emitOnce).toHaveBeenCalledWith(
            EVENTS.KEY_REMOVED,
            added!.id,
            { id: added!.id },
        );
        svc.destroy();
    });

    it('removeKey keeps adapter cache when other keys of the provider remain', async () => {
        const { svc, providerAdapterRegistry } = makeService();
        const a = await svc.addKey(
            keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'a' }),
        );
        const b = await svc.addKey(
            keyInput({ provider: 'openai', key: OPENAI_KEY_2, label: 'b' }),
        );
        await svc.removeKey(a!.id);
        expect(b).toBeDefined();
        expect(providerAdapterRegistry.invalidateCache).not.toHaveBeenCalled();
        svc.destroy();
    });

    it('updateKey patches fields and persists', async () => {
        const { svc, keyStore } = makeService();
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        await svc.updateKey(added!.id, { label: 'renamed', model: 'gpt-4o-mini' });
        expect(svc.getKey(added!.id)?.label).toBe('renamed');
        expect(svc.getKey(added!.id)?.model).toBe('gpt-4o-mini');
        expect(keyStore.bulkPut).toHaveBeenCalled();
        svc.destroy();
    });

    it('canUseKey reflects registry and quota state', async () => {
        const { svc } = makeService();
        expect(svc.canUseKey('missing')).toEqual({ can: false, reason: 'Key not found' });
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        expect(svc.canUseKey(added!.id)).toEqual({ can: true });
        await svc.toggleKeyStatus(added!.id);
        expect(svc.canUseKey(added!.id)).toEqual({ can: false, reason: 'Key inactive' });
        svc.destroy();
    });

    it('recordUsage updates stats by provider and records failures', async () => {
        const { svc } = makeService();
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        svc.recordUsage('openai', 120, 500, 'gpt-4o-mini');
        let k = svc.getKey(added!.id)!;
        expect(k.stats.successCount).toBe(1);
        expect(k.stats.totalTokens).toBe(500);
        svc.recordUsage(added!.id, 80, 0, 'gpt-4o-mini', {
            failed: true,
            error: 'HTTP 429 rate limit',
        });
        k = svc.getKey(added!.id)!;
        expect(k.stats.errorCount).toBe(1);
        expect(k.history?.some((h) => h.action === 'error')).toBe(true);
        expect(k.stats.extended?.errorBreakdown.rateLimit).toBe(1);
        svc.destroy();
    });

    it('selectFromPool returns an active key; pool status counts keys', async () => {
        const { svc } = makeService();
        const a = await svc.addKey(
            keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'a' }),
        );
        await svc.addKey(
            keyInput({ provider: 'openai', key: OPENAI_KEY_2, label: 'b' }),
        );
        const picked = svc.selectFromPool('openai');
        expect(picked?.id).toBe(a!.id);
        expect(svc.getPoolStatus('openai').total).toBe(2);
        expect(svc.getPoolStatus('openai').active).toBe(2);
        svc.destroy();
    });

    it('selectFromPool returns null when pool has no usable keys', async () => {
        const { svc } = makeService();
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        await svc.toggleKeyStatus(added!.id);
        expect(svc.selectFromPool('openai')).toBeNull();
        svc.destroy();
    });

    it('fingerprint/detectProvider helpers behave', async () => {
        const { svc } = makeService();
        const fp = await svc.fingerprintKey(OPENAI_KEY);
        expect(fp).toMatch(/^[0-9a-f]{64}$/);
        expect(svc.detectProvider('sk-ant-abc123')).toBe('anthropic');
        expect(svc.detectProvider(OPENAI_KEY)).toBe('openai');
        await expect(svc.verifyKey('openai', OPENAI_KEY)).resolves.toBe(true);
        await expect(svc.verifyKey('anthropic', OPENAI_KEY)).resolves.toBe(false);
        svc.destroy();
    });

    it('exportKeys refuses while vault is locked, works after unlock', async () => {
        const { svc } = makeService();
        await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        await expect(svc.exportKeys()).rejects.toThrow(/Vault locked/);
        await expect(svc.unlockVaultWithPassphrase('secret')).resolves.toBe(true);
        const exported = await svc.exportKeys();
        const parsed = JSON.parse(exported) as Array<{ isEncrypted: boolean; key: string }>;
        expect(parsed).toHaveLength(1);
        expect(parsed[0]!.isEncrypted).toBe(true);
        expect(parsed[0]!.key).not.toContain('sk-test');
        svc.destroy();
    });

    it('importKeys imports valid entries and ignores invalid ones', async () => {
        const { svc } = makeService();
        const payload = JSON.stringify([
            { id: 'imp-1', provider: 'openai', key: OPENAI_KEY, label: 'imported' },
            { id: 'imp-2', provider: 'unknown', key: 'x', label: 'bad' },
            { id: 'imp-3', provider: 'groq', key: 'gsk_aaaa', label: 'groq' },
        ]);
        await expect(svc.importKeys(payload)).resolves.toBe(2);
        expect(svc.getKey('imp-1')?.label).toBe('imported');
        expect(svc.getKey('imp-3')?.provider).toBe('groq');
        expect(svc.getKey('imp-2')).toBeUndefined();
        svc.destroy();
    });

    it('pushHistory appends history entries', async () => {
        const { svc } = makeService();
        const added = await svc.addKey(keyInput({ provider: 'openai', key: OPENAI_KEY, label: 'main' }));
        svc.pushHistory(added!.id, 'quota_exceeded', 'tokens quota exceeded');
        const k = svc.getKey(added!.id)!;
        expect(k.history?.some((h) => h.action === 'quota_exceeded')).toBe(true);
        svc.destroy();
    });
});
