import type { ApiKey } from '../../types/metrics-types';
import type { IKeyVaultService } from '../../contracts/key-vault';
import { ssrSafeStorage } from '../../utils/ssr-storage';
import {
    createVerifier,
    open,
    seal,
    type VaultPackage,
    verify,
} from './crypto/vault-crypto';

const VERIFIER_KEY = 'key-vault:verifier';

/**
 * KeyVault — passphrase-защищённое шифрование секретов (SPEC_01).
 *
 * Модель:
 *  - Мастер-ключ выводится из passphrase (VaultCrypto) и НЕ хранится.
 *  - Каждый зашифрованный ключ — это сериализованный VaultPackage (JSON),
 *    со своей солью и IV. Это самодостаточно и версионируемо.
 *  - Верификатор пароля хранится в localStorage ('key-vault:verifier').
 *  - Fail-closed: при заблокированном vault encryptKey/decryptKey возвращают
 *    null, а не молчаливо возвращают открытый текст / ciphertext.
 *
 * Замечание: полная интеграция с key-service.ts (замена deviceKey на
 * passphrase) и Passphrase-UI — следующие шаги SPEC_01.
 */
export class KeyVault implements IKeyVaultService {
    private _password: string | null = null;

    private readVerifier(): VaultPackage | null {
        const raw = ssrSafeStorage.getItem(VERIFIER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as VaultPackage;
        } catch {
            return null;
        }
    }

    async createVault(passphrase: string): Promise<boolean> {
        try {
            const verifier = await createVerifier(passphrase);
            ssrSafeStorage.setItem(VERIFIER_KEY, JSON.stringify(verifier));
            this._password = passphrase;
            return true;
        } catch {
            return false;
        }
    }

    hasVault(): boolean {
        return this.readVerifier() !== null;
    }

    async verifyPassphrase(passphrase: string): Promise<boolean> {
        const verifier = this.readVerifier();
        if (!verifier) return true; // vault ещё не создан — первый вход
        return verify(passphrase, verifier);
    }

    async unlockWithPassphrase(passphrase: string): Promise<boolean> {
        const ok = await this.verifyPassphrase(passphrase);
        if (!ok) return false;
        this._password = passphrase;
        return true;
    }

    async unlock(password: string): Promise<boolean> {
        return this.unlockWithPassphrase(password);
    }

    lock(keys?: ApiKey[]): void {
        this._password = null;
        if (keys) {
            for (const k of keys) {
                k.key = '[VAULT LOCKED]';
            }
        }
    }

    isLocked(): boolean {
        return this._password === null;
    }

    async encryptKey(plaintext: string): Promise<string | null> {
        if (this._password === null) return null;
        try {
            const pkg = await seal(this._password, new TextEncoder().encode(plaintext));
            return JSON.stringify(pkg);
        } catch {
            return null;
        }
    }

    async decryptKey(ciphertext: string): Promise<string | null> {
        if (this._password === null) return null;
        try {
            const pkg = JSON.parse(ciphertext) as VaultPackage;
            const opened = await open(this._password, pkg);
            return opened ? new TextDecoder().decode(opened) : null;
        } catch {
            return null;
        }
    }

    async decryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]> {
        if (this._password === null) return keys;
        const out: ApiKey[] = [];
        for (const k of keys) {
            if (!k.isEncrypted) {
                out.push(k);
                continue;
            }
            const decrypted = await this.decryptKey(k.key);
            out.push({ ...k, key: decrypted ?? k.key, isEncrypted: false });
        }
        return out;
    }

    async encryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]> {
        if (this._password === null) return keys;
        const out: ApiKey[] = [];
        for (const k of keys) {
            const encrypted = await this.encryptKey(k.key);
            out.push({ ...k, key: encrypted ?? k.key, isEncrypted: !!encrypted });
        }
        return out;
    }

    stripPlaintextKeys(keys: ApiKey[]): ApiKey[] {
        return this._password === null
            ? keys.map((k) => ({ ...k, key: '[REDACTED]' }))
            : keys;
    }

    purgeKey(_key: ApiKey): void {
        /* vault system — no purge needed */
    }

    purgeAll(_keys: ApiKey[]): void {
        /* vault system — no purge needed */
    }
}
