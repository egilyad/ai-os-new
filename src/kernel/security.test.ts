import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityService } from './security';

describe('SecurityService (audit fixes)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('round-trips encrypt/decrypt', async () => {
        const s = new SecurityService();
        expect(await s.initialize('pw1')).toBe(true);
        const enc = await s.encrypt('hello secrets');
        expect(enc).toBeTruthy();
        expect(await s.decrypt(enc as string)).toBe('hello secrets');
    });

    it('handles >100KB payloads without RangeError (chunked base64)', async () => {
        const s = new SecurityService();
        await s.initialize('pw1');
        const big = 'x'.repeat(200_000);
        const enc = await s.encrypt(big);
        expect(enc).toBeTruthy();
        expect(await s.decrypt(enc as string)).toBe(big);
    });

    it('changePassword verifies old password and persists the new salt', async () => {
        const s = new SecurityService();
        await s.initialize('old-pw');
        const before = await s.encrypt('data');
        expect(await s.changePassword('wrong-pw', 'new-pw')).toBe(false);
        const seen: string[] = [];
        const ok = await s.changePassword('old-pw', 'new-pw', undefined, async (enc) => {
            seen.push((await enc('data')) as string);
            return true;
        });
        expect(ok).toBe(true);
        expect(seen.length).toBe(1);
        expect(localStorage.getItem('security_salt')).toBeTruthy();
        // new key decrypts data re-encrypted through the callback
        expect(await s.decrypt(seen[0]!)).toBe('data');
        expect(before).toBeTruthy();
    });

    it('restores old key/salt when reEncrypt fails', async () => {
        const s = new SecurityService();
        await s.initialize('old-pw');
        const enc = (await s.encrypt('keep me')) as string;
        expect(await s.changePassword('old-pw', 'new-pw', undefined, async () => false)).toBe(false);
        expect(s.isLocked()).toBe(false);
        expect(await s.decrypt(enc)).toBe('keep me');
    });
});
