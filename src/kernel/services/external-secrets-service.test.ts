import { describe, it, expect, vi, afterEach } from 'vitest';
import { ExternalSecretsService } from './external-secrets-service';
import type { SecretStore } from '../contracts/secret-store';

function mockStore(overrides?: Partial<SecretStore>): SecretStore {
    const data = new Map<string, string>();
    return {
        type: 'local',
        label: 'Mock Store',
        init: vi.fn().mockResolvedValue(true),
        get: vi.fn(async (ref) => data.get(ref.path) ?? null),
        set: vi.fn(async (ref, value) => {
            data.set(ref.path, value);
            return true;
        }),
        delete: vi.fn(async (ref) => data.delete(ref.path)),
        list: vi.fn(async (prefix) => [...data.keys()].filter((k) => k.startsWith(prefix ?? ''))),
        health: vi.fn().mockResolvedValue(true),
        ...overrides,
    };
}

import type { ExternalSecretsServiceDeps } from './external-secrets-service';

function makeDeps(): ExternalSecretsServiceDeps {
    const kv = new Map<string, unknown>();
    return {
        eventBus: {
            on: vi.fn(() => vi.fn()) as unknown as ExternalSecretsServiceDeps['eventBus']['on'],
            emit: vi.fn(),
        },
        database: {
            getKv: vi.fn((id: string) =>
                Promise.resolve(kv.get(id) ?? null),
            ) as unknown as ExternalSecretsServiceDeps['database']['getKv'],
            setKv: vi.fn((id: string, value: unknown) => {
                kv.set(id, value);
                return Promise.resolve();
            }) as unknown as ExternalSecretsServiceDeps['database']['setKv'],
        },
        storeFactories: {
            local: () => mockStore({ type: 'local', label: 'Local' }),
            vault: () => mockStore({ type: 'vault', label: 'Vault' }),
        },
    };
}

describe('ExternalSecretsService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('should init with local store', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        const ok = await svc.init();
        expect(ok).toBe(true);
        expect(svc.isInitialized()).toBe(true);
        expect(svc.getActiveBackend()).toBe('local');
    });

    it('should read/write secrets to active backend', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        await svc.init();

        const ok = await svc.setSecret({ path: 'test/key' }, 'secret-value');
        expect(ok).toBe(true);

        const val = await svc.getSecret({ path: 'test/key' });
        expect(val).toBe('secret-value');
    });

    it('should delete secrets from all backends', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        await svc.setSecret({ path: 'del/key' }, 'value');
        const deleted = await svc.deleteSecret({ path: 'del/key' });
        expect(deleted).toBe(true);
        const val = await svc.getSecret({ path: 'del/key' });
        expect(val).toBeNull();
    });

    it('should list secrets', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        await svc.setSecret({ path: 'list/a' }, '1');
        await svc.setSecret({ path: 'list/b' }, '2');
        const keys = await svc.listSecrets('list/');
        expect(keys).toHaveLength(2);
    });

    it('should activate a backend', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        const ok = await svc.activateBackend('vault', { type: 'vault', label: 'Vault' });
        expect(ok).toBe(true);
        expect(svc.getActiveBackend()).toBe('vault');
    });

    it('should get status of all backends', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        svc.register('vault', mockStore({ type: 'vault', label: 'Custom' }));
        await svc.init();
        const status = await svc.getStatus();
        expect(status.length).toBeGreaterThanOrEqual(2);
        expect(status.some((s) => s.active)).toBe(true);
    });

    it('should migrate secrets between backends', async () => {
        const source = mockStore({ type: 'local', label: 'Source' });
        const target = mockStore({ type: 'vault', label: 'Target' });
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        svc.register('local', source);
        svc.register('vault', target);
        await source.set({ path: 'mig/k1' }, 'v1');
        await source.set({ path: 'mig/k2' }, 'v2');
        const result = await svc.migrateSecrets('local', 'vault');
        expect(result.migrated).toBe(2);
        expect(result.failed).toBe(0);
        const v1 = await target.get({ path: 'mig/k1' });
        expect(v1).toBe('v1');
    });

    it('should fallback to local when active backend throws', async () => {
        const deps = makeDeps();
        deps.storeFactories!.vault = () =>
            mockStore({
                type: 'vault',
                label: 'Broken Vault',
                get: vi.fn().mockRejectedValue(new Error('Vault unreachable')),
            });
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        await svc.setSecret({ path: 'shared/key' }, 'fallback-value');
        await svc.activateBackend('vault', { type: 'vault', label: 'Broken Vault' });
        const val = await svc.getSecret({ path: 'shared/key' });
        expect(val).toBe('fallback-value');
    });

    it('should return null when active backend has no secret (no fallback)', async () => {
        const deps = makeDeps();
        deps.storeFactories!.vault = () =>
            mockStore({
                type: 'vault',
                label: 'Vault',
                get: vi.fn().mockResolvedValue(null),
            });
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        await svc.setSecret({ path: 'shared/key' }, 'fallback-value');
        await svc.activateBackend('vault', { type: 'vault', label: 'Vault' });
        const val = await svc.getSecret({ path: 'shared/key' });
        expect(val).toBeNull();
    });

    it('should return null for missing secret on all backends', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        const val = await svc.getSecret({ path: 'does/not/exist' });
        expect(val).toBeNull();
    });

    it('should destroy and reset state', async () => {
        const deps = makeDeps();
        const svc = new ExternalSecretsService(deps);
        await svc.init();
        svc.destroy();
        expect(svc.isInitialized()).toBe(false);
        expect(svc.getActiveBackend()).toBe('local');
    });
});
