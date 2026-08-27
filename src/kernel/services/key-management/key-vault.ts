import type { ApiKey } from '../../types/metrics-types';
import type { IKeyVaultService } from '../../contracts/key-vault';
import { ssrSafeStorage } from '../../utils/ssr-storage';

const ALGORITHM = 'AES-GCM';
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];
const KEY_LENGTH = 256;
const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

// TS strict-mode ArrayBuffer compat
function asBuf(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * KeyVault — AES-GCM + PBKDF2 key encryption.
 *
 * NOTE: Vault is intentionally NOT wired into the app's bootstrap.
 * See key-registry.ts:619: "Vault system removed — keys stored as plaintext".
 * API keys are stored in IndexedDB in plaintext by design.
 * The vault code is kept as infrastructure for future password-gated encryption.
 * P0-#2 (key-registry-utils.ts) prevents silent plaintext during export.
 */
export class KeyVault implements IKeyVaultService {
    private masterKey: CryptoKey | null = null;
    private _locked = true;

    constructor() {}

    async unlock(password: string): Promise<boolean> {
        try {
            const stored = ssrSafeStorage.getItem('key-vault:salt');
            const salt = stored
                ? hexToBytes(stored)
                : crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
            if (!stored) {
                ssrSafeStorage.setItem('key-vault:salt', bytesToHex(salt));
            }
            const baseKey = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveKey'],
            );
            this.masterKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: asBuf(salt),
                    iterations: ITERATIONS,
                    hash: 'SHA-256',
                },
                baseKey,
                { name: ALGORITHM, length: KEY_LENGTH },
                false,
                KEY_USAGE,
            );
            this._locked = false;
            return true;
        } catch {
            return false;
        }
    }

    lock(keys?: ApiKey[]): void {
        this.masterKey = null;
        this._locked = true;
        if (keys) {
            for (const k of keys) {
                k.key = '[VAULT LOCKED]';
            }
        }
    }

    isLocked(): boolean {
        return this._locked;
    }

    async encryptKey(plaintext: string): Promise<string | null> {
        if (this._locked || !this.masterKey) return null;
        try {
            const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
            const encoded = new TextEncoder().encode(plaintext);
            const encrypted = await crypto.subtle.encrypt(
                { name: ALGORITHM, iv: asBuf(iv) },
                this.masterKey,
                encoded,
            );
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);
            return bytesToHex(combined);
        } catch {
            return null;
        }
    }

    async decryptKey(ciphertext: string): Promise<string | null> {
        if (this._locked || !this.masterKey) return ciphertext;
        try {
            const combined = hexToBytes(ciphertext);
            const iv = combined.slice(0, IV_LENGTH);
            const data = combined.slice(IV_LENGTH);
            const decrypted = await crypto.subtle.decrypt(
                { name: ALGORITHM, iv: asBuf(iv) },
                this.masterKey,
                data,
            );
            return new TextDecoder().decode(decrypted);
        } catch {
            return null;
        }
    }

    async decryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]> {
        if (this._locked || !this.masterKey) return keys;
        const out: ApiKey[] = [];
        for (const k of keys) {
            const decrypted = k.key.startsWith('[VAULT')
                ? k.key
                : ((await this.decryptKey(k.key)) ?? k.key);
            out.push({ ...k, key: decrypted });
        }
        return out;
    }

    async encryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]> {
        if (this._locked || !this.masterKey) return keys;
        const out: ApiKey[] = [];
        for (const k of keys) {
            const encrypted = await this.encryptKey(k.key);
            out.push({ ...k, key: encrypted ?? k.key });
        }
        return out;
    }

    stripPlaintextKeys(keys: ApiKey[]): ApiKey[] {
        if (this._locked) {
            return keys.map((k) => ({ ...k, key: '[REDACTED]' }));
        }
        return keys;
    }

    purgeKey(_key: ApiKey): void {
        /* vault system — no purge needed */
    }

    purgeAll(_keys: ApiKey[]): void {
        /* vault system — no purge needed */
    }
}
