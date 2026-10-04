import type { ISecurityService } from './types/interfaces';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
// M-5: OWASP 2023 recommends 600k PBKDF2-HMAC-SHA-256 iterations. No live
// ciphertext exists (vault unwired by design), so no migration is needed.
const ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function base64Encode(buf: ArrayBuffer): string {
    // Audit #3: spread into fromCharCode throws RangeError past ~65k args —
    // chunk the conversion so >100KB payloads survive.
    const bytes = new Uint8Array(buf);
    let s = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(s);
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
            const prevSalt = this._salt;
            const prevKey = this._key;
            // Verify the old password WITHOUT exportKey: derived keys are
            // non-extractable on purpose (export would defeat that), so
            // prove equality with an encrypt/decrypt round-trip instead.
            // Wrong password → AES-GCM auth fails → null.
            const oldKey = await this._deriveKey(oldPassword, prevSalt);
            const probe = new TextEncoder().encode('password-check');
            const probeIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
            let oldOk = false;
            try {
                const ct = await crypto.subtle.encrypt(
                    { name: ALGORITHM, iv: probeIv },
                    oldKey,
                    probe,
                );
                const pt = await crypto.subtle.decrypt(
                    { name: ALGORITHM, iv: probeIv },
                    prevKey,
                    ct,
                );
                const a = new Uint8Array(pt);
                oldOk = a.length === probe.length && a.every((b, i) => b === probe[i]);
            } catch {
                oldOk = false;
            }
            if (!oldOk) return false;

            const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
            const newKey = await this._deriveKey(newPassword, newSalt);
            this._salt = newSalt;
            this._key = newKey;

            if (reEncrypt) {
                const ok = await reEncrypt(async (plain: string) => this.encrypt(plain));
                if (!ok) {
                    // Audit #2: swap happened BEFORE re-encrypt — a failure
                    // here orphaned every secret under an unrecoverable key.
                    // Restore so the old password keeps working.
                    this._salt = prevSalt;
                    this._key = prevKey;
                    return false;
                }
            }
            // Persist the new salt — without this, reload derives a
            // different key from the stale stored salt and all data is lost.
            try {
                localStorage.setItem('security_salt', base64Encode(newSalt.buffer as ArrayBuffer));
            } catch {
                this._salt = prevSalt;
                this._key = prevKey;
                return false;
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

    /**
     * L-15: TS `private` is compile-time only — without this, JSON.stringify
     * (logging, structured clone, postMessage, IndexedDB-put) would serialize
     * the raw salt alongside. The CryptoKey itself is non-extractable and
     * stringifies to {}.
     */
    toJSON(): { redacted: true } {
        return { redacted: true };
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
