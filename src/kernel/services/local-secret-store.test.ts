import { describe, expect, it, vi } from 'vitest';
import { LocalSecretStore } from './local-secret-store';

describe('LocalSecretStore (атомарность)', () => {
    it('set использует batchSetKv одной записью, когда доступен', async () => {
        const batch = vi.fn(async () => {});
        const db = {
            getKv: vi.fn(async () => null),
            setKv: vi.fn(async () => {}),
            batchSetKv: batch,
        };
        const store = new LocalSecretStore(db as never);
        await store.set({ path: 'a/b' }, 'secret');
        expect(batch).toHaveBeenCalledTimes(1);
        const args = batch.mock.calls[0][0];
        expect(args['external_secret:a/b']).toBe('secret');
        expect(args['external_secret_index']).toEqual(['a/b']);
    });

    it('delete удаляет из индекса через batchSetKv', async () => {
        const batch = vi.fn(async () => {});
        const db = {
            getKv: vi.fn(async () => ['a/b', 'c']),
            setKv: vi.fn(async () => {}),
            batchSetKv: batch,
        };
        const store = new LocalSecretStore(db as never);
        await store.delete({ path: 'a/b' });
        const args = batch.mock.calls[0][0];
        expect(args['external_secret:a/b']).toBeNull();
        expect(args['external_secret_index']).toEqual(['c']);
    });

    it('fallback на последовательные setKv без batchSetKv', async () => {
        const setKv = vi.fn(async () => {});
        const db = { getKv: vi.fn(async () => null), setKv };
        const store = new LocalSecretStore(db as never);
        await store.set({ path: 'x' }, 'v');
        expect(setKv).toHaveBeenCalledTimes(2);
    });

    it('get/list/health работают', async () => {
        const db = {
            getKv: vi.fn(async () => ['p1', 'p2']),
            setKv: vi.fn(async () => {}),
        };
        const store = new LocalSecretStore(db as never);
        expect(await store.list('p')).toEqual(['p1', 'p2']);
        expect(await store.health()).toBe(true);
    });
});
