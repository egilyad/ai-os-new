import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'company-members-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');

describe('company members (P3-3 team mode)', () => {
    let companyId;

    before(() => {
        const org = store.createCompany({ name: 'TeamCo', mission: 'test' });
        companyId = org.id;
    });

    it('lists empty members for a fresh company', () => {
        assert.deepEqual(store.listMembers(companyId), []);
    });

    it('adds a member with a valid role', () => {
        const m = store.addMember(companyId, { name: 'Alice', role: 'admin', email: 'a@x.io' });
        assert.ok(m.id);
        assert.equal(m.name, 'Alice');
        assert.equal(m.role, 'admin');
        assert.equal(m.email, 'a@x.io');
        assert.equal(store.listMembers(companyId).length, 1);
        assert.equal(store.getMember(companyId, m.id).name, 'Alice');
    });

    it('defaults role to operator', () => {
        const m = store.addMember(companyId, { name: 'Bob' });
        assert.equal(m.role, 'operator');
    });

    it('rejects invalid roles', () => {
        assert.throws(() => store.addMember(companyId, { name: 'Eve', role: 'root' }), /role must be/);
    });

    it('rejects empty names', () => {
        assert.throws(() => store.addMember(companyId, { name: '   ' }), /name is required/);
    });

    it('returns null for unknown companies', () => {
        assert.equal(store.addMember('no-such-org', { name: 'X' }), null);
        assert.equal(store.listMembers('no-such-org'), null);
        assert.equal(store.getMember('no-such-org', 'm1'), null);
    });

    it('removes a member', () => {
        const m = store.addMember(companyId, { name: 'Carol' });
        assert.equal(store.removeMember(companyId, m.id), true);
        assert.equal(store.getMember(companyId, m.id), null);
        assert.equal(store.removeMember(companyId, m.id), false);
    });

    it('isolates members between companies', () => {
        const orgB = store.createCompany({ name: 'OtherTeam', mission: 'test' });
        const beforeA = store.listMembers(companyId).length;
        assert.equal(store.listMembers(orgB.id).length, 0);
        assert.equal(store.addMember(orgB.id, { name: 'Zoe' }).name, 'Zoe');
        assert.equal(store.listMembers(orgB.id).length, 1);
        assert.equal(store.listMembers(companyId).length, beforeA);
    });
});
