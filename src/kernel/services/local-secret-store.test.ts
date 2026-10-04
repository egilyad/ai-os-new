import { describe, it, expect, vi } from 'vitest';
import { LocalSecretStore } from './local-secret-store';

function makeDb() {
    const kv = new Map<string, unknown>();
    return {
        getKv: vi.fn(async <T,>(id: string): Promise<T | null> => (kv.has(id) ? (kv.get(id) as T) : null)),
        setKv: vi.fn(async <T,>(id: string, value: T): Promise<void> => {
            kv.set(id, value);
        }),
    };
}

describe('LocalSecretStore (P-CRIT-2)', () => {
    it('inits healthy and round-trips secrets', async () => {
        const store = new LocalSecretStore(makeDb());
        await expect(store.init({ type: 'local', label: 'Local' })).resolves.toBe(true);
        await expect(store.health()).resolves.toBe(true);
        await expect(store.set({ path: 'a/b' }, 'v1')).resolves.toBe(true);
        await expect(store.get({ path: 'a/b' })).resolves.toBe('v1');
        await expect(store.get({ path: 'missing' })).resolves.toBeNull();
    });

    it('lists by prefix and forgets deleted paths', async () => {
        const store = new LocalSecretStore(makeDb());
        await store.init({ type: 'local', label: 'Local' });
        await store.set({ path: 'x/1' }, '1');
        await store.set({ path: 'x/2' }, '2');
        await store.set({ path: 'y/1' }, '3');
        expect(await store.list('x/')).toEqual(['x/1', 'x/2']);
        await store.delete({ path: 'x/1' });
        expect(await store.list('x/')).toEqual(['x/2']);
        await expect(store.get({ path: 'x/1' })).resolves.toBeNull();
    });

    it('plumbs through ExternalSecretsService init with local factory', async () => {
        const { ExternalSecretsService } = await import('./external-secrets-service');
        const db = makeDb();
        const svc = new ExternalSecretsService({
            eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
            database: db,
            storeFactories: { local: () => new LocalSecretStore(db) },
        });
        await expect(svc.init()).resolves.toBe(true);
        expect(svc.getActiveBackend()).toBe('local');
        await expect(svc.setSecret({ path: 'k' }, 'v')).resolves.toBe(true);
        await expect(svc.getSecret({ path: 'k' })).resolves.toBe('v');
    });
});
