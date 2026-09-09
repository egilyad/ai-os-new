import type { ISecurityService } from './types/interfaces';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function base64Encode(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64Decode(str: string): Uint8Array {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export class SecurityService implements ISecurityService {
    private _key: CryptoKey | null = null;
    private _salt: Uint8Array | null = null;

    async initialize(password: string, _userId?: string): Promise<boolean> {
        try {
            const STORAGE_KEY = 'security_salt';
            let salt: Uint8Array;
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                salt = base64Decode(saved);
            } else {
                salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
                localStorage.setItem(STORAGE_KEY, base64Encode(salt.buffer as ArrayBuffer));
            }
            this._salt = salt;
            this._key = await this._deriveKey(password, salt);
            return true;
        } catch {
            this._key = null;
            this._salt = null;
            return false;
        }
    }

    async changePassword(
        oldPassword: string,
        newPassword: string,
        _userId?: string,
        reEncrypt?: (encrypt: (plain: string) => Promise<string | null>) => Promise<boolean>,
    ): Promise<boolean> {
        if (!this._key || !this._salt) return false;
        try {
            const oldSalt = this._salt;
            const oldKey = await this._deriveKey(oldPassword, oldSalt);
            const oldKeyBytes = await crypto.subtle.exportKey('raw', oldKey);
            const newKeyBytes = await crypto.subtle.exportKey('raw', this._key);

            if (base64Encode(oldKeyBytes) !== base64Encode(newKeyBytes)) {
                return false;
            }

            const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
            const newKey = await this._deriveKey(newPassword, newSalt);
            this._salt = newSalt;
            this._key = newKey;

            if (reEncrypt) {
                return reEncrypt(async (plain: string) => this.encrypt(plain));
            }
            return true;
        } catch {
            return false;
        }
    }

    async encrypt(text: string): Promise<string | null> {
        if (!this._key || !this._salt) return null;
        try {
            const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
            const encoded = new TextEncoder().encode(text);
            const encrypted = await crypto.subtle.encrypt(
                { name: ALGORITHM, iv },
                this._key,
                encoded,
            );
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);
            return base64Encode(combined.buffer);
        } catch {
            return null;
        }
    }

    async decrypt(encoded: string): Promise<string | null> {
        if (!this._key || !this._salt) return null;
        try {
            const combined = base64Decode(encoded);
            const iv = combined.slice(0, IV_LENGTH);
            const ciphertext = combined.slice(IV_LENGTH);
            const decrypted = await crypto.subtle.decrypt(
                { name: ALGORITHM, iv },
                this._key,
                ciphertext,
            );
            return new TextDecoder().decode(decrypted);
        } catch {
            return null;
        }
    }

    isLocked(): boolean {
        return this._key === null;
    }

    lock(): void {
        this._key = null;
        this._salt = null;
    }

    private async _deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey'],
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt.buffer as ArrayBuffer,
                iterations: ITERATIONS,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt'],
        );
    }
}
