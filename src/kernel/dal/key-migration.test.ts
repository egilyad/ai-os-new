import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiKey } from '../types/metrics-types';
import type { IDatabaseService } from '../types/interfaces';
import type { KeyStore } from '../contracts/storage/key-store';
import { runOnce } from './key-migration';
import { ssrSafeStorage } from '../utils/ssr-storage';

const STORAGE_KEY = 'super_agents_api_keys';

function apiKey(id: string, provider: string, key: string): ApiKey {
    return {
        id,
        provider,
        key,
        label: `${provider}-${id}`,
        status: 'active',
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
        },
    };
}

function makeDb(): { db: IDatabaseService; kv: Map<string, unknown> } {
    const kv = new Map<string, unknown>();
    return {
        kv,
        db: {
            async getKv<T>(id: string): Promise<T | null> {
                return kv.has(id) ? (kv.get(id) as T) : null;
            },
            async setKv<T>(id: string, value: T): Promise<void> {
                kv.set(id, value);
            },
        } as unknown as IDatabaseService,
    };
}

function makeKeyStore(seed: ApiKey[]): {
    ks: KeyStore;
    records: Map<string, ApiKey>;
} {
    const records = new Map<string, ApiKey>(seed.map((k) => [k.id, k]));
    const ks: KeyStore = {
        saveKey: async () => {},
        getKey: async (id) => records.get(id) ?? null,
        listKeys: async () => Array.from(records.values()),
        deleteKey: async (id) => {
            records.delete(id);
        },
        bulkPut: async (keys) => {
            for (const k of keys) records.set(k.id, k);
        },
        bulkAdd: async () => {},
        where: async () => undefined,
        exportAll: async () => '[]',
        importAll: async () => {},
        clear: async () => {
            records.clear();
        },
    };
    return { ks, records };
}

function makeSecurity(opts: { locked?: boolean; encryptReturns?: string } = {}) {
    const encrypt = vi.fn(async (k: string) =>
        opts.encryptReturns !== undefined ? opts.encryptReturns : `enc:${k}`,
    );
    return {
        initialize: vi.fn(),
        decrypt: vi.fn(),
        lock: vi.fn(),
        changePassword: vi.fn(),
        isLocked: () => opts.locked === true,
        encrypt,
    } as unknown as import('../types/interfaces').ISecurityService;
}

beforeEach(() => {
    try {
        localStorage.clear();
    } catch {
        /* jsdom */
    }
});

describe('runOnce (key migration)', () => {
    it('skips when migration flag is already done', async () => {
        const { db, kv } = makeDb();
        kv.set('keys:migrated:v12', { done: true, timestamp: 1 });
        const { ks } = makeKeyStore([apiKey('a', 'groq', 'sk-a')]);
        const result = await runOnce({ db, keyStore: ks });
        expect(result).toEqual({ migrated: 0, source: 'already-migrated' });
    });

    it('marks done when no keys found anywhere', async () => {
        const { db, kv } = makeDb();
        const { ks } = makeKeyStore([]);
        const result = await runOnce({ db, keyStore: ks });
        expect(result).toEqual({ migrated: 0, source: 'no-keys' });
        expect(kv.get('keys:migrated:v12')).toMatchObject({ done: true });
    });

    it('migrates keys from localStorage and persists them encrypted', async () => {
        ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify([apiKey('l1', 'local', 'sk-local')]));
        const { db } = makeDb();
        const { ks, records } = makeKeyStore([]);
        const security = makeSecurity();

        const result = await runOnce({ db, keyStore: ks, securityService: security });

        expect(result.migrated).toBe(1);
        const stored = records.get('l1');
        expect(stored?.key).toBe('enc:sk-local');
        expect(stored?.isEncrypted).toBe(true);
        expect(security.encrypt).toHaveBeenCalledWith('sk-local');
    });

    it('defers when the vault is locked (skips plaintext, keeps done:false)', async () => {
        ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify([apiKey('l1', 'local', 'sk-local')]));
        const { db, kv } = makeDb();
        const { ks, records } = makeKeyStore([]);
        const security = makeSecurity({ locked: true });

        const result = await runOnce({ db, keyStore: ks, securityService: security });

        expect(result.source).toBe('migration-v12');
        expect(records.size).toBe(0); // nothing persisted because all skipped
        expect(kv.get('keys:migrated:v12')).toMatchObject({ done: false, pending: 1 });
    });

    it('rolls back persisted keys if final flag write fails', async () => {
        ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify([apiKey('l1', 'local', 'sk-local')]));
        const { db, kv } = makeDb();
        const { ks, records } = makeKeyStore([]);
        // Make the flag write throw
        const failing = {
            ...db,
            async setKv<T>(id: string, value: T): Promise<void> {
                if (id === 'keys:migrated:v12') throw new Error('flag write failed');
                kv.set(id, value);
            },
        } as unknown as IDatabaseService;

        await expect(
            runOnce({ db: failing, keyStore: ks, securityService: makeSecurity() }),
        ).rejects.toThrow();
        // Keys were rolled back after bulkPut
        expect(records.size).toBe(0);
    });
});
