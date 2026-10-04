import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeEqual, verifyWsUpgrade } from '../ws-auth.mjs';

const SECRET = 'test-sync-secret-123';

describe('timingSafeEqual (T-H-6)', () => {
    it('compares equal and unequal same-length secrets', () => {
        assert.equal(timingSafeEqual(SECRET, SECRET), true);
        assert.equal(timingSafeEqual(SECRET, 'x'.repeat(SECRET.length)), false);
    });

    it('never throws on length mismatch (no short-token DoS)', () => {
        assert.equal(timingSafeEqual('short', SECRET), false);
        assert.equal(timingSafeEqual('', SECRET), false);
        assert.equal(
            timingSafeEqual('a-much-longer-token-than-the-secret', SECRET),
            false,
        );
    });
});

describe('verifyWsUpgrade (T-H-6)', () => {
    it('accepts a valid subprotocol token and selects the subprotocol', () => {
        assert.deepEqual(verifyWsUpgrade({ protocols: `sync-token,${SECRET}` }, SECRET), {
            ok: true,
            protocol: 'sync-token',
        });
    });

    it('rejects wrong and wrong-length tokens without throwing', () => {
        assert.deepEqual(
            verifyWsUpgrade({ protocols: 'sync-token,wrong' }, SECRET),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
        assert.deepEqual(
            verifyWsUpgrade({ protocols: 'sync-token,short' }, SECRET),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
    });

    it('rejects a bare subprotocol without token', () => {
        assert.deepEqual(verifyWsUpgrade({ protocols: 'sync-token' }, SECRET), {
            ok: false,
            code: 4001,
            message: 'Invalid token',
        });
    });

    it('falls back to Bearer authorization', () => {
        assert.deepEqual(verifyWsUpgrade({ authorization: `Bearer ${SECRET}` }, SECRET), {
            ok: true,
        });
        assert.deepEqual(verifyWsUpgrade({ authorization: 'Bearer nope' }, SECRET), {
            ok: false,
            code: 4001,
            message: 'Invalid token',
        });
    });

    it('rejects anonymous upgrades', () => {
        assert.deepEqual(verifyWsUpgrade({}, SECRET), {
            ok: false,
            code: 401,
            message: 'Unauthorized',
        });
        assert.deepEqual(verifyWsUpgrade({ protocols: 'other-proto' }, SECRET), {
            ok: false,
            code: 401,
            message: 'Unauthorized',
        });
    });
});
