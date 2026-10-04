import { describe, it, expect, beforeEach } from 'vitest';
import { KeyVault } from './key-vault';
import { ssrSafeStorage } from '../../utils/ssr-storage';
import type { ApiKey } from '../../types/metrics-types';

const SALT_KEY = 'key-vault:salt';

function makeKey(overrides: Partial<ApiKey> = {}): ApiKey {
    return {
        id: 'k1',
        provider: 'openrouter',
        key: 'sk-or-test-key',
        label: 'test',
        status: 'active',
        ...overrides,
    } as ApiKey;
}

describe('KeyVault (T-C-4)', () => {
    beforeEach(() => {
        // Fresh salt per test: unlock() reuses a stored salt, so isolation
        // requires clearing it (PBKDF2 salt is the only persisted state).
        ssrSafeStorage.removeItem(SALT_KEY);
    });

    it('starts locked: encrypt returns null, decrypt passes ciphertext through', async () => {
        const vault = new KeyVault();
        expect(vault.isLocked()).toBe(true);
        await expect(vault.encryptKey('secret')).resolves.toBeNull();
        await expect(vault.decryptKey('whatever')).resolves.toBe('whatever');
    });

    it('unlocks with a password and round-trips encrypt/decrypt', async () => {
        const vault = new KeyVault();
        await expect(vault.unlock('correct-horse')).resolves.toBe(true);
        expect(vault.isLocked()).toBe(false);
        const cipher = await vault.encryptKey('sk-or-test-key');
        expect(typeof cipher).toBe('string');
        expect(cipher).not.toContain('sk-or-test-key');
        await expect(vault.decryptKey(cipher as string)).resolves.toBe('sk-or-test-key');
    });

    it('different passwords derive different keys (wrong password cannot decrypt)', async () => {
        const a = new KeyVault();
        await a.unlock('password-one');
        const cipher = (await a.encryptKey('sk-or-test-key')) as string;

        // Same stored salt, different password -> different key -> auth fails.
        const b = new KeyVault();
        await b.unlock('password-two');
        await expect(b.decryptKey(cipher)).resolves.toBeNull();
    });

    it('tampered ciphertext fails authentication', async () => {
        const vault = new KeyVault();
        await vault.unlock('pw');
        const cipher = (await vault.encryptKey('sk-or-test-key')) as string;
        const tampered = cipher.slice(0, -2) + (cipher.endsWith('00') ? 'ff' : '00');
        expect(tampered).not.toBe(cipher);
        await expect(vault.decryptKey(tampered)).resolves.toBeNull();
    });

    it('lock() wipes the key, marks locked rows and blocks encrypt', async () => {
        const vault = new KeyVault();
        await vault.unlock('pw');
        const keys = [makeKey(), makeKey({ id: 'k2' })];
        vault.lock(keys);
        expect(vault.isLocked()).toBe(true);
        expect(keys.every((k) => k.key === '[VAULT LOCKED]')).toBe(true);
        await expect(vault.encryptKey('x')).resolves.toBeNull();
    });

    it('encryptAllKeys/decryptAllKeys round-trip; locked passes through', async () => {
        const vault = new KeyVault();
        const keys = [makeKey({ key: 'aaa' }), makeKey({ id: 'k2', key: 'bbb' })];
        await expect(vault.encryptAllKeys(keys)).resolves.toBe(keys);

        await vault.unlock('pw');
        const encrypted = await vault.encryptAllKeys(keys);
        expect(encrypted.map((k) => k.key)).not.toContain('aaa');
        const decrypted = await vault.decryptAllKeys(encrypted);
        expect(decrypted.map((k) => k.key)).toEqual(['aaa', 'bbb']);
    });

    it('stripPlaintextKeys redacts only while locked', () => {
        const vault = new KeyVault();
        expect(vault.stripPlaintextKeys([makeKey()])[0]?.key).toBe('[REDACTED]');
    });

    it('each encryption uses a fresh IV (same plaintext -> different ciphertext)', async () => {
        const vault = new KeyVault();
        await vault.unlock('pw');
        const c1 = await vault.encryptKey('same');
        const c2 = await vault.encryptKey('same');
        expect(c1).not.toBe(c2);
        await expect(vault.decryptKey(c1 as string)).resolves.toBe('same');
        await expect(vault.decryptKey(c2 as string)).resolves.toBe('same');
    });
});
