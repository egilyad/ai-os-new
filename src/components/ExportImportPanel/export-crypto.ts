const enc = new TextEncoder();
const dec = new TextDecoder();

const ITERATIONS = 600000;
const KEY_LENGTH = 16;
const IV_LENGTH = 12;

function toBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]!);
    return btoa(bin);
}

function fromBase64(s: string): Uint8Array {
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
        'deriveKey',
    ]);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
}

export interface EncryptedExport {
    version: string;
    encrypted: true;
    iterations: number;
    salt: string;
    iv: string;
    ciphertext: string;
}

export async function encryptExportPayload(plain: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(password, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
    const payload: EncryptedExport = {
        version: '1.0.0',
        encrypted: true,
        iterations: ITERATIONS,
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(ct),
    };
    return JSON.stringify(payload);
}

export async function decryptExportPayload(json: string, password: string): Promise<Record<string, unknown>> {
    const parsed = JSON.parse(json) as EncryptedExport;
    if (!parsed.encrypted) throw new Error('Это не зашифрованный экспорт');
    const salt = fromBase64(parsed.salt);
    const iv = fromBase64(parsed.iv);
    const key = await deriveKey(password, salt);
    const buf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        fromBase64(parsed.ciphertext),
    );
    return JSON.parse(dec.decode(buf)) as Record<string, unknown>;
}
