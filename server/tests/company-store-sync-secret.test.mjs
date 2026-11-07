import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated DATA_DIR: must be set before company-store module loads.
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'company-secret-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');

describe('per-company sync secrets (P0-2)', () => {
    let companyId;

    before(() => {
        const org = store.createCompany({ name: 'SecretCo', mission: 'test' });
        companyId = org.id;
    });

    it('rejects short secrets', () => {
        assert.throws(() => store.setCompanySyncSecret(companyId, 'short'), /at least 16/);
        assert.equal(store.getCompanySyncSecretHash(companyId), null);
    });

    it('stores only a hash and verifies correctly', () => {
        const secret = 'company-secret-abcdef-123456';
        const res = store.setCompanySyncSecret(companyId, secret);
        assert.equal(res.id, companyId);
        const hash = store.getCompanySyncSecretHash(companyId);
        assert.match(hash, /^[0-9a-f]{64}$/);
        assert.ok(!fs.readFileSync(path.join(DATA, 'companies.json'), 'utf8').includes(secret));
        assert.equal(store.verifyCompanySyncSecret(companyId, secret), true);
        assert.equal(store.verifyCompanySyncSecret(companyId, 'wrong-secret-value'), false);
        assert.equal(store.verifyCompanySyncSecret(companyId, ''), false);
    });

    it('rotation invalidates the old secret', () => {
        const first = 'first-secret-value-123456';
        const second = 'second-secret-value-654321';
        store.setCompanySyncSecret(companyId, first);
        store.rotateCompanySyncSecret(companyId, second);
        assert.equal(store.verifyCompanySyncSecret(companyId, first), false);
        assert.equal(store.verifyCompanySyncSecret(companyId, second), true);
    });

    it('unknown company returns null hash and false verification', () => {
        assert.equal(store.getCompanySyncSecretHash('no-such-org'), null);
        assert.equal(store.verifyCompanySyncSecret('no-such-org', 'whatever-secret-value'), false);
    });

    it('different companies have independent secrets', () => {
        const orgB = store.createCompany({ name: 'OtherCo', mission: 'test' });
        store.setCompanySyncSecret(companyId, 'aaa-secret-value-111111');
        store.setCompanySyncSecret(orgB.id, 'bbb-secret-value-222222');
        assert.equal(store.verifyCompanySyncSecret(companyId, 'bbb-secret-value-222222'), false);
        assert.equal(store.verifyCompanySyncSecret(orgB.id, 'aaa-secret-value-111111'), false);
        assert.equal(store.verifyCompanySyncSecret(companyId, 'aaa-secret-value-111111'), true);
        assert.equal(store.verifyCompanySyncSecret(orgB.id, 'bbb-secret-value-222222'), true);
    });
});
