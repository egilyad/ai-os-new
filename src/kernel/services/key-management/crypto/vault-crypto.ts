/**
 * VaultCrypto — чистый, автономный криптографический слой для зашифрованного
 * хранилища секретов (SPEC_01 / ROADMAP_07).
 *
 * Формат пакета v1 (версионируемый):
 *   {
 *     version: 1,
 *     kdf: { name: 'PBKDF2', hash: 'SHA-256', salt: base64, iterations },
 *     cipher: { name: 'AES-GCM', iv: base64 },
 *     ciphertext: base64   // GCM включает auth-тег
 *   }
 *
 * Принципы:
 *  - Мастер-ключ НИКОГДА не хранится и не экспортируется (extractable:false);
 *    он выводится из passphrase при каждой разблокировке.
 *  - AES-GCM аутентифицирует данные: неверный пароль → decrypt вернёт null.
 *  - Salt уникален на vault; IV уникален на каждое шифрование.
 *  - Все параметры KDF/шифра лежат в пакете → можно мигрировать на Argon2id,
 *    не сломав старые данные.
 *
 * Замечание по производительности: PBKDF2 (600k итераций) блокирует поток —
 * вызывай через Web Worker для UI (см. SPEC_01 §4.1).
 */

export const VAULT_VERSION = 1 as const;
export const VAULT_KDF_ITERATIONS = 600_000;
export const VAULT_SALT_LENGTH = 16;
export const VAULT_IV_LENGTH = 12;
export const VAULT_ALGORITHM = 'AES-GCM';
export const VAULT_KEY_LENGTH = 256;

export interface VaultKdfParams {
    name: 'PBKDF2';
    hash: 'SHA-256';
    /** base64-кодированная соль (16 байт). */
    salt: string;
    iterations: number;
}

export interface VaultCipherParams {
    name: 'AES-GCM';
    /** base64-кодированный IV (12 байт). */
    iv: string;
}

export interface VaultPackage {
    version: typeof VAULT_VERSION;
    kdf: VaultKdfParams;
    cipher: VaultCipherParams;
    /** base64-кодированный шифротекст (с auth-тегом GCM). */
    ciphertext: string;
}

// ---------- base64 (chunked, безопасно для >100KB) ----------

function bytesToBase64(bytes: Uint8Array): string {
    let s = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(s);
}

function base64ToBytes(str: string): Uint8Array {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

function asBuf(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

// ---------- вывод ключа ----------

/**
 * Выводит мастер-ключ AES-GCM-256 из passphrase через PBKDF2-HMAC-SHA-256.
 * Ключ неэкспортируемый (extractable:false) — не может быть украден экспортом.
 */
export async function deriveKey(
    passphrase: string,
    kdf: VaultKdfParams,
): Promise<CryptoKey> {
    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: asBuf(base64ToBytes(kdf.salt)),
            iterations: kdf.iterations,
            hash: 'SHA-256',
        },
        baseKey,
        { name: VAULT_ALGORITHM, length: VAULT_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt'],
    );
}

// ---------- seal / open ----------

/**
 * Шифрует plaintext новым пакетом (свежая соль + IV).
 */
export async function seal(
    passphrase: string,
    plaintext: Uint8Array,
): Promise<VaultPackage> {
    const salt = crypto.getRandomValues(new Uint8Array(VAULT_SALT_LENGTH));
    const kdf: VaultKdfParams = {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: bytesToBase64(salt),
        iterations: VAULT_KDF_ITERATIONS,
    };
    const key = await deriveKey(passphrase, kdf);
    const iv = crypto.getRandomValues(new Uint8Array(VAULT_IV_LENGTH));
    const encrypted = await crypto.subtle.encrypt(
        { name: VAULT_ALGORITHM, iv: asBuf(iv) },
        key,
        asBuf(plaintext),
    );
    return {
        version: VAULT_VERSION,
        kdf,
        cipher: { name: VAULT_ALGORITHM, iv: bytesToBase64(iv) },
        ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    };
}

/**
 * Расшифровывает пакет. Возвращает null при неверном пароле или
 * подделанных данных (AES-GCM отклоняет сам).
 */
export async function open(
    passphrase: string,
    pkg: VaultPackage,
): Promise<Uint8Array | null> {
    if (pkg.version !== VAULT_VERSION) return null;
    try {
        const key = await deriveKey(passphrase, pkg.kdf);
        const iv = base64ToBytes(pkg.cipher.iv);
        const decrypted = await crypto.subtle.decrypt(
            { name: VAULT_ALGORITHM, iv: asBuf(iv) },
            key,
            asBuf(base64ToBytes(pkg.ciphertext)),
        );
        return new Uint8Array(decrypted);
    } catch {
        return null;
    }
}

/**
 * Проверка пароля (для UX «неверный пароль») без расшифровки данных.
 * Использует round-trip seal/open на фиксированном маркере.
 */
export async function verify(
    passphrase: string,
    verifier: VaultPackage,
): Promise<boolean> {
    const opened = await open(passphrase, verifier);
    if (!opened) return false;
    const marker = new TextEncoder().encode(VAULT_VERIFY_MARKER);
    return opened.length === marker.length && opened.every((b, i) => b === marker[i]);
}

export const VAULT_VERIFY_MARKER = 'superagents-vault-verify';

/**
 * Создаёт пакет-верификатор пароля (хранить рядом с vault).
 */
export async function createVerifier(passphrase: string): Promise<VaultPackage> {
    return seal(passphrase, new TextEncoder().encode(VAULT_VERIFY_MARKER));
}
