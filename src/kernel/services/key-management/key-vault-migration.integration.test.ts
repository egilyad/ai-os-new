import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dexie from 'dexie';
import { anchorDexieInstance } from '../dexie-identity';
import type { ApiKey } from '../../types/metrics-types';
import type { KeyRegistryDeps } from './key-registry';
import { KeyRegistry } from './key-registry';
import { KeyVault } from './key-vault';

await anchorDexieInstance(
    'key-vault-migration.integration.test',
    new Dexie('key-vault-migration-integration-test'),
);

const SECRET = 'sk-integration-legacy-secret-123';
const PASSPHRASE = 'correct horse battery staple';

function legacyKey(): ApiKey {
    return {
        id: 'legacy-k1',
        provider: 'openai',
        key: SECRET,
        label: 'legacy profile',
        isEncrypted: false,
        status: 'active',
        stats: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
    } as unknown as ApiKey;
}

function createStore(initial: ApiKey[] = []) {
    const records = new Map<string, ApiKey>(initial.map((k) => [k.id, { ...k }]));
    return {
        records,
        listKeys: vi.fn(async () => [...records.values()].map((k) => ({ ...k }))),
        bulkPut: vi.fn(async (keys: ApiKey[]) => {
            for (const k of keys) records.set(k.id, { ...k });
        }),
        deleteKey: vi.fn(async (id: string) => {
            records.delete(id);
        }),
        saveKey: vi.fn(async (k: ApiKey) => {
            records.set(k.id, { ...k });
        }),
        getKey: vi.fn(async (id: string) => records.get(id) ?? null),
    };
}

function createDeps(store: ReturnType<typeof createStore>, vault: KeyVault) {
    const eventBus = {
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
        emit: vi.fn(),
    };
    const deps = {
        eventBus,
        keyStore: store as never,
        database: {
            getKv: vi.fn(async () => null),
            setKv: vi.fn(async () => {}),
        },
        vault: {
            encryptKey: (plaintext: string) => vault.encryptKey(plaintext),
            isLocked: () => vault.isLocked(),
            hasVault: () => vault.hasVault(),
            decryptAllKeys: (keys: ApiKey[]) => vault.decryptAllKeys(keys),
            encryptAllKeys: (keys: ApiKey[]) => vault.encryptAllKeys(keys),
            stripPlaintextKeys: (keys: ApiKey[]) => vault.stripPlaintextKeys(keys),
        },
        freeTierLimits: {},
    } as unknown as KeyRegistryDeps;
    return { deps, eventBus };
}

async function unlockedVault(): Promise<KeyVault> {
    const vault = new KeyVault();
    expect(await vault.createVault(PASSPHRASE)).toBe(true);
    expect(await vault.unlockWithPassphrase(PASSPHRASE)).toBe(true);
    return vault;
}

async function migratedProfile() {
    const store = createStore([legacyKey()]);
    const vault = await unlockedVault();
    const { deps, eventBus } = createDeps(store, vault);
    const registry = new KeyRegistry(deps);
    await registry.loadKeys();
    return { store, vault, registry, eventBus };
}

describe('KeyVault интеграционный путь: legacy профиль → сохранение → блокировка → экспорт', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('legacy plaintext-профиль конвертируется в зашифрованное хранилище без потери ключа', async () => {
        const { store, vault, registry } = await migratedProfile();

        const stored = await store.listKeys();
        expect(stored).toHaveLength(1);
        expect(stored[0]!.isEncrypted).toBe(true);
        expect(stored[0]!.key).not.toContain(SECRET);
        expect(JSON.stringify(stored)).not.toContain(SECRET);
        expect(await vault.decryptKey(stored[0]!.key)).toBe(SECRET);

        expect(registry.getKeys()[0]!.key).toBe(SECRET);
    });

    it('заблокированный vault не записывает маску в хранилище и не портит зашифрованную запись', async () => {
        const { store, vault, registry, eventBus } = await migratedProfile();
        const encryptedBefore = await store.listKeys();

        vault.lock();
        registry.redactKeys();
        expect(registry.getKeys()[0]!.key).toBe('[VAULT LOCKED]');

        await expect(registry.saveKeys()).rejects.toThrow(/vault is locked/i);
        expect(eventBus.emit).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ type: 'error' }),
        );

        const storedAfter = await store.listKeys();
        expect(storedAfter).toEqual(encryptedBefore);
        expect(JSON.stringify(storedAfter)).not.toContain(SECRET);
    });

    it('реальный encryptAllKeys при locked возвращает исходный текст, но путь записи его блокирует', async () => {
        const { store, vault, registry } = await migratedProfile();
        const encryptedBefore = await store.listKeys();

        vault.lock();
        const attempted = await vault.encryptAllKeys(registry.getKeys());
        expect(attempted[0]!.key).toBe(SECRET);
        expect(attempted[0]!.isEncrypted).toBe(false);

        await expect(registry.saveKeys()).rejects.toThrow(/vault is locked/i);
        expect(await store.listKeys()).toEqual(encryptedBefore);
    });

    it('экспорт не раскрывает секрет: разблокирован — зашифрован, заблокирован — отказан', async () => {
        const { registry, vault } = await migratedProfile();

        const exported = await registry.exportKeys((plaintext) => vault.encryptKey(plaintext));
        expect(exported).not.toContain(SECRET);
        const parsed = JSON.parse(exported) as Array<{ key: string; isEncrypted: boolean }>;
        expect(parsed).toHaveLength(1);
        expect(parsed[0]!.isEncrypted).toBe(true);
        expect(parsed[0]!.key).not.toBe(SECRET);
        expect(await vault.decryptKey(parsed[0]!.key)).toBe(SECRET);

        vault.lock();
        await expect(
            registry.exportKeys((plaintext) => vault.encryptKey(plaintext)),
        ).rejects.toThrow(/vault locked/i);
    });

    it('перезапуск с верной парольной фразой восстанавливает ключ, с неверной — нет', async () => {
        const { store, vault, registry } = await migratedProfile();

        const restarted = new KeyVault();
        expect(await restarted.unlockWithPassphrase(PASSPHRASE)).toBe(true);
        const { deps: restartedDeps } = createDeps(store, restarted);
        const restartedRegistry = new KeyRegistry(restartedDeps);
        await restartedRegistry.loadKeys();
        expect(restartedRegistry.getKeys()[0]!.key).toBe(SECRET);
        const storedAfter = await store.listKeys();
        expect(storedAfter[0]!.isEncrypted).toBe(true);
        expect(JSON.stringify(storedAfter)).not.toContain(SECRET);
        expect(await restarted.decryptKey(storedAfter[0]!.key)).toBe(SECRET);

        localStorage.clear();
        const wrongVault = new KeyVault();
        expect(await wrongVault.createVault('another-passphrase')).toBe(true);
        expect(await wrongVault.unlockWithPassphrase('wrong')).toBe(false);
        const { deps: wrongDeps } = createDeps(store, wrongVault);
        const wrongRegistry = new KeyRegistry(wrongDeps);
        await wrongRegistry.loadKeys();
        expect(wrongRegistry.getKeys()[0]!.key).not.toBe(SECRET);

        vault.lock();
        registry.destroy();
        restartedRegistry.destroy();
        wrongRegistry.destroy();
    }, 45000);
});
