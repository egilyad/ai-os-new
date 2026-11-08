import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSyncToken, verifyWsUpgradeCompany, verifyWsUpgradeCompanyHash } from '../ws-auth.mjs';

const SECRET_A = 'company-a-secret-123456';
const SECRET_B = 'company-b-secret-654321';

function resolveSecret(companyId) {
    const map = { org_a: SECRET_A, org_b: SECRET_B };
    return map[companyId] || null;
}

function makeInspector(secrets) {
    return (companyId) => {
        const secret = secrets[companyId];
        if (!secret) return { exists: false, verify: () => false };
        return {
            exists: true,
            verify: (candidate) => candidate === secret,
        };
    };
}

describe('parseSyncToken (P0-2)', () => {
    it('parses companyId:secret tokens', () => {
        assert.deepEqual(parseSyncToken('org_a:abc'), { companyId: 'org_a', secret: 'abc' });
    });

    it('rejects malformed tokens', () => {
        assert.equal(parseSyncToken('no-colon-here'), null);
        assert.equal(parseSyncToken('org_a:'), null);
        assert.equal(parseSyncToken(':secret'), null);
        assert.equal(parseSyncToken('a:b:c'), null);
        assert.equal(parseSyncToken(''), null);
        assert.equal(parseSyncToken(undefined), null);
    });
});

describe('verifyWsUpgradeCompany (P0-2)', () => {
    it('accepts a valid company token and returns the companyId', () => {
        assert.deepEqual(
            verifyWsUpgradeCompany({ protocols: `sync-token,org_a:${SECRET_A}` }, resolveSecret),
            { ok: true, protocol: 'sync-token', companyId: 'org_a' },
        );
    });

    it('rejects a token with the wrong company secret', () => {
        assert.deepEqual(
            verifyWsUpgradeCompany({ protocols: `sync-token,org_a:${SECRET_B}` }, resolveSecret),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
    });

    it('rejects tokens for unknown companies', () => {
        assert.deepEqual(
            verifyWsUpgradeCompany({ protocols: 'sync-token,org_zzz:whatever-secret' }, resolveSecret),
            { ok: false, code: 401, message: 'Unknown company' },
        );
    });

    it('rejects malformed subprotocol tokens', () => {
        assert.deepEqual(
            verifyWsUpgradeCompany({ protocols: 'sync-token,no-colon' }, resolveSecret),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompany({ protocols: 'sync-token' }, resolveSecret),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
    });

    it('supports Bearer company tokens', () => {
        assert.deepEqual(
            verifyWsUpgradeCompany({ authorization: `Bearer org_b:${SECRET_B}` }, resolveSecret),
            { ok: true, companyId: 'org_b' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompany({ authorization: `Bearer org_b:${SECRET_A}` }, resolveSecret),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompany({ authorization: 'Bearer no-colon' }, resolveSecret),
            { ok: false, code: 401, message: 'Unauthorized' },
        );
    });

    it('rejects anonymous upgrades', () => {
        assert.deepEqual(
            verifyWsUpgradeCompany({}, resolveSecret),
            { ok: false, code: 401, message: 'Unauthorized' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompany({ protocols: 'other-proto' }, resolveSecret),
            { ok: false, code: 401, message: 'Unauthorized' },
        );
    });
});

describe('verifyWsUpgradeCompanyHash (P0-2, hashed secrets)', () => {
    const inspector = makeInspector({ org_a: SECRET_A, org_b: SECRET_B });

    it('accepts a valid company token and returns the companyId', () => {
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ protocols: `sync-token,org_a:${SECRET_A}` }, inspector),
            { ok: true, protocol: 'sync-token', companyId: 'org_a' },
        );
    });

    it('rejects a token with the wrong company secret', () => {
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ protocols: `sync-token,org_a:${SECRET_B}` }, inspector),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
    });

    it('rejects tokens for unknown companies', () => {
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ protocols: 'sync-token,org_zzz:whatever-secret' }, inspector),
            { ok: false, code: 401, message: 'Unknown company' },
        );
    });

    it('rejects malformed subprotocol tokens', () => {
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ protocols: 'sync-token,no-colon' }, inspector),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ protocols: 'sync-token' }, inspector),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
    });

    it('supports Bearer company tokens', () => {
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ authorization: `Bearer org_b:${SECRET_B}` }, inspector),
            { ok: true, companyId: 'org_b' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ authorization: `Bearer org_b:${SECRET_A}` }, inspector),
            { ok: false, code: 4001, message: 'Invalid token' },
        );
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({ authorization: 'Bearer no-colon' }, inspector),
            { ok: false, code: 401, message: 'Unauthorized' },
        );
    });

    it('rejects anonymous upgrades', () => {
        assert.deepEqual(
            verifyWsUpgradeCompanyHash({}, inspector),
            { ok: false, code: 401, message: 'Unauthorized' },
        );
    });
});
