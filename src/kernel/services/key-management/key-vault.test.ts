import { beforeEach, describe, expect, it } from 'vitest';
import { KeyVault } from './key-vault';

// ssrSafeStorage обычно читает localStorage — в тестах (jsdom) он есть.
describe('KeyVault (SPEC_01)', () => {
    let vault: KeyVault;

    beforeEach(() => {
        localStorage.clear();
        vault = new KeyVault();
    });

    it('изначально заблокирован', () => {
        expect(vault.isLocked()).toBe(true);
    });

    it('createVault + unlockWithPassphrase с верным паролем', async () => {
        expect(vault.hasVault()).toBe(false);
        expect(await vault.createVault('my-passphrase')).toBe(true);
        expect(vault.hasVault()).toBe(true);
        expect(await vault.unlockWithPassphrase('my-passphrase')).toBe(true);
        expect(vault.isLocked()).toBe(false);
    });

    it('unlockWithPassphrase с неверным паролем — fail-closed', async () => {
        await vault.createVault('my-passphrase');
        expect(await vault.unlockWithPassphrase('wrong')).toBe(false);
        expect(vault.isLocked()).toBe(true);
    });

    it('encryptKey при locked → null (fail-closed)', async () => {
        expect(await vault.encryptKey('sk-123')).toBeNull();
    });

    it('decryptKey при locked → null, а не ciphertext', async () => {
        // даже если бы был ciphertext, locked должен возвращать null
        expect(await vault.decryptKey('some-ciphertext')).toBeNull();
    });

    it('round-trip encrypt → decrypt', async () => {
        await vault.createVault('pass');
        expect(await vault.unlockWithPassphrase('pass')).toBe(true);
        const ct = await vault.encryptKey('sk-secret-1');
        expect(ct).not.toBeNull();
        const pt = await vault.decryptKey(ct as string);
        expect(pt).toBe('sk-secret-1');
    });

    it('неверный пароль после повторной разблокировки не расшифрует', async () => {
        await vault.createVault('pass');
        expect(await vault.unlockWithPassphrase('pass')).toBe(true);
        const ct = (await vault.encryptKey('sk')) as string;
        vault.lock();
        // пытаемся разблокировать неверным — fail-closed
        await vault.unlockWithPassphrase('bad');
        expect(await vault.decryptKey(ct)).toBeNull();
    });

    it('lock маскирует переданные ключи', async () => {
        const keys = [{ id: '1', key: 'sk' } as never];
        await vault.createVault('pass');
        vault.lock(keys);
        expect((keys[0] as { key: string }).key).toBe('[VAULT LOCKED]');
    });

    it('stripPlaintextKeys при locked маскирует', async () => {
        const keys = [{ id: '1', key: 'sk-1' } as never];
        await vault.createVault('pass');
        vault.lock();
        const redacted = vault.stripPlaintextKeys(keys as never);
        expect((redacted[0] as { key: string }).key).toBe('[REDACTED]');
    });

    it('encryptAllKeys/decryptAllKeys сохраняют пары', async () => {
        const keys = [{ id: 'a', key: 'k1', isEncrypted: false }, { id: 'b', key: 'k2', isEncrypted: false }];
        await vault.createVault('pass');
        expect(await vault.unlockWithPassphrase('pass')).toBe(true);
        const enc = await vault.encryptAllKeys(keys as never);
        expect(enc.every((k) => k.isEncrypted)).toBe(true);
        const dec = await vault.decryptAllKeys(enc);
        expect(dec.map((k) => k.key)).toEqual(['k1', 'k2']);
    });
});
