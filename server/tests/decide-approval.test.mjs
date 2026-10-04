import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated DATA_DIR: must be set before company-store module loads.
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'company-store-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');

const readApprovals = () =>
    JSON.parse(fs.readFileSync(path.join(DATA, 'approvals.json'), 'utf8')).approvals;
const writeApprovals = (approvals) =>
    fs.writeFileSync(path.join(DATA, 'approvals.json'), JSON.stringify({ approvals }));
const readCompanies = () =>
    JSON.parse(fs.readFileSync(path.join(DATA, 'companies.json'), 'utf8')).companies;
const writeCompanies = (companies) =>
    fs.writeFileSync(path.join(DATA, 'companies.json'), JSON.stringify({ companies }));

let companyId;

describe('decideApproval atomicity (C-5)', () => {
    before(() => {
        const org = store.createCompany({ name: 'TestCo', mission: 'test', monthlyBudgetCents: 1000 });
        companyId = org.id;
    });

    it('approving hire_agent persists decision, marker and exactly one agent', () => {
        const appr = store.requestApproval(companyId, {
            kind: 'hire_agent',
            payload: { name: 'Agent One' },
        });
        const decided = store.decideApproval(appr.id, { decision: 'approved', by: 'tester' });
        assert.equal(decided.status, 'approved');
        assert.ok(typeof decided.executedAt === 'number');
        assert.ok(decided.executedAgentId);
        const agents = store.listAgents(companyId);
        assert.equal(agents.length, 1);
        assert.equal(agents[0].id, decided.executedAgentId);
    });

    it('double approval throws SETTLED instead of duplicating', () => {
        const appr = store.requestApproval(companyId, {
            kind: 'hire_agent',
            payload: { name: 'Agent Two' },
        });
        store.decideApproval(appr.id, { decision: 'approved', by: 'tester' });
        assert.throws(
            () => store.decideApproval(appr.id, { decision: 'approved', by: 'tester' }),
            /already approved/,
        );
        const agents = store.listAgents(companyId).filter((a) => a.name === 'Agent Two');
        assert.equal(agents.length, 1);
    });

    it('crash between decision and effects recovers without duplicating', () => {
        const appr = store.requestApproval(companyId, {
            kind: 'hire_agent',
            payload: { name: 'Agent Crash' },
        });
        store.decideApproval(appr.id, { decision: 'approved', by: 'tester' });
        // Simulate crash after decision-persist, before any side-effect:
        // approved record, no markers, no agent on disk.
        const approvals = readApprovals();
        const rec = approvals.find((x) => x.id === appr.id);
        rec.executedAt = null;
        rec.executedAgentId = null;
        writeApprovals(approvals);
        const companies = readCompanies();
        const org = companies.find((c) => c.id === companyId);
        org.agents = org.agents.filter((a) => a.name !== 'Agent Crash');
        writeCompanies(companies);

        assert.equal(store.recoverApprovals(), 1);
        const agents = store.listAgents(companyId).filter((a) => a.name === 'Agent Crash');
        assert.equal(agents.length, 1);
        const after = readApprovals().find((x) => x.id === appr.id);
        assert.ok(typeof after.executedAt === 'number');

        // Second recovery pass is a no-op.
        assert.equal(store.recoverApprovals(), 0);
        assert.equal(
            store.listAgents(companyId).filter((a) => a.name === 'Agent Crash').length,
            1,
        );
    });

    it('crash after agent checkpoint does not re-hire', () => {
        const appr = store.requestApproval(companyId, {
            kind: 'hire_agent',
            payload: { name: 'Agent Checkpoint' },
        });
        store.decideApproval(appr.id, { decision: 'approved', by: 'tester' });
        // Simulate crash after the executedAgentId checkpoint but before
        // the final executedAt mark.
        const approvals = readApprovals();
        const rec = approvals.find((x) => x.id === appr.id);
        assert.ok(rec.executedAgentId);
        rec.executedAt = null;
        writeApprovals(approvals);
        const before = store.listAgents(companyId).length;

        assert.equal(store.recoverApprovals(), 1);
        assert.equal(store.listAgents(companyId).length, before);
        const after = readApprovals().find((x) => x.id === appr.id);
        assert.ok(typeof after.executedAt === 'number');
    });
});
