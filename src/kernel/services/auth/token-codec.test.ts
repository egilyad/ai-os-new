import { describe, expect, it } from 'vitest';
import { TokenCodec } from './token-codec';

describe('TokenCodec (SPEC_10)', () => {
    const codec = new TokenCodec('test-secret-1234567890');

    it('issue/verify round-trip', async () => {
        const token = await codec.issue({ tenantId: 'tenant-a', userId: 'u1', roles: ['approver'] });
        const ctx = await codec.verify(token);
        expect(ctx).toEqual({ tenantId: 'tenant-a', userId: 'u1', roles: ['approver'] });
    });

    it('verify отклоняет подделанный токен', async () => {
        const token = await codec.issue({ tenantId: 't', userId: 'u', roles: [] });
        const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
        expect(await codec.verify(tampered)).toBeNull();
    });

    it('verify отклоняет протухший токен', async () => {
        const token = await codec.issue({ tenantId: 't', userId: 'u', roles: [] }, -1000);
        expect(await codec.verify(token)).toBeNull();
    });

    it('verify отклоняет мусор', async () => {
        expect(await codec.verify('not-a-token')).toBeNull();
        expect(await codec.verify('')).toBeNull();
    });

    it('разные секреты не проходят верификацию', async () => {
        const a = new TokenCodec('secret-aaaaaaaaaaaaaaaa');
        const b = new TokenCodec('secret-bbbbbbbbbbbbbb');
        const token = await a.issue({ tenantId: 't', userId: 'u', roles: [] });
        expect(await b.verify(token)).toBeNull();
    });
});
