import { describe, expect, it } from 'vitest';
import {
    createVerifier,
    deriveKey,
    open,
    seal,
    VAULT_VERIFY_MARKER,
    verify,
} from './vault-crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe('vault-crypto', () => {
    it('seal/open round-trip возвращает исходные байты', async () => {
        const plaintext = encoder.encode('секрет-из-теста: sk-1234');
        const pkg = await seal('correct horse battery staple', plaintext);
        expect(pkg.version).toBe(1);
        expect(pkg.kdf.name).toBe('PBKDF2');
        const opened = await open('correct horse battery staple', pkg);
        expect(opened).not.toBeNull();
        expect(decoder.decode(opened as Uint8Array)).toBe(decoder.decode(plaintext));
    });

    it('неверный пароль → null (AES-GCM отклоняет)', async () => {
        const plaintext = encoder.encode('data');
        const pkg = await seal('right-password', plaintext);
        const opened = await open('wrong-password', pkg);
        expect(opened).toBeNull();
    });

    it('подделанный ciphertext → null', async () => {
        const pkg = await seal('pass', encoder.encode('data'));
        const tampered = { ...pkg, ciphertext: pkg.ciphertext.slice(0, -2) + 'AA' };
        const opened = await open('pass', tampered);
        expect(opened).toBeNull();
    });

    it('несоответствие версии → null', async () => {
        const pkg = await seal('pass', encoder.encode('data'));
        const old = { ...pkg, version: 0 as never };
        expect(await open('pass', old)).toBeNull();
    });

    it('deriveKey даёт неэкспортируемый ключ', async () => {
        const pkg = await seal('pass', encoder.encode('data'));
        const key = await deriveKey('pass', pkg.kdf);
        // KeyUsage должен содержать encrypt/decrypt, а extractable=false.
        expect(key.extractable).toBe(false);
        expect(key.usages).toContain('encrypt');
        expect(key.usages).toContain('decrypt');
    });

    it('verify: верный пароль → true, неверный → false', async () => {
        const verifier = await createVerifier('my-passphrase');
        expect(await verify('my-passphrase', verifier)).toBe(true);
        expect(await verify('not-my-passphrase', verifier)).toBe(false);
    });

    it('верификатор использует фиксированный маркер', async () => {
        const verifier = await createVerifier('x');
        const opened = await open('x', verifier);
        expect(decoder.decode(opened as Uint8Array)).toBe(VAULT_VERIFY_MARKER);
    });

    it('разные соли на каждый seal', async () => {
        const a = await seal('pass', encoder.encode('data'));
        const b = await seal('pass', encoder.encode('data'));
        expect(a.kdf.salt).not.toBe(b.kdf.salt);
        expect(a.cipher.iv).not.toBe(b.cipher.iv);
    });
});
