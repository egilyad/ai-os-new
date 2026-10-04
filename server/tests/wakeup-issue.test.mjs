import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated DATA_DIR: must be set before company-store module loads.
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'wakeup-issue-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');

const WAKEUPS_FILE = path.join(DATA, 'wakeups.json');
const readWakeups = () => JSON.parse(fs.readFileSync(WAKEUPS_FILE, 'utf8')).wakeups;
const tmpFiles = () =>
    fs.readdirSync(DATA).filter((f) => f.includes('.tmp.'));

let companyId;
let agentId;

describe('wakeup eviction and issue matrix (P-MED-3/4/5)', () => {
    before(() => {
        const org = store.createCompany({ name: 'WICo', mission: 'test', monthlyBudgetCents: 100000 });
        companyId = org.id;
        const appr = store.requestApproval(companyId, {
            kind: 'hire_agent',
            payload: { name: 'WI Agent' },
        });
        agentId = store.decideApproval(appr.id, { decision: 'approved', by: 'tester' }).executedAgentId;
    });

    it('evicts acked wakeups before pending ones (P-MED-4)', () => {
        const wakeups = [];
        for (let i = 0; i < 4999; i++) {
            wakeups.push({
                id: `done-${i}`,
                companyId,
                agentId,
                trigger: 'manual',
                ref: '',
                status: 'done',
                createdAt: Date.now() - i,
            });
        }
        wakeups.push({
            id: 'pending-keep',
            companyId,
            agentId,
            trigger: 'manual',
            ref: '',
            status: 'pending',
            createdAt: Date.now(),
        });
        fs.writeFileSync(WAKEUPS_FILE, JSON.stringify({ wakeups }));
        const added = store.enqueueWakeup({ companyId, agentId, trigger: 'manual', ref: '' });
        const after = readWakeups();
        assert.equal(after.length, 5000);
        const ids = new Set(after.map((w) => w.id));
        assert.ok(ids.has('pending-keep'), 'oldest pending must survive');
        assert.ok(ids.has(added.id), 'new item must survive');
        assert.ok(!ids.has('done-0'), 'oldest acked must be evicted first');
    });

    it('backlog -> in_progress is a legal transition (P-MED-3)', () => {
        const issue = store.createIssue(companyId, { title: 'WI-1' });
        assert.equal(issue.status, 'backlog');
        const moved = store.setIssueStatus(companyId, issue.id, 'in_progress');
        assert.equal(moved.status, 'in_progress');
    });

    it('checkoutIssue still claims and starts work', () => {
        const issue = store.createIssue(companyId, { title: 'WI-2' });
        const claimed = store.checkoutIssue(companyId, issue.id, agentId);
        assert.equal(claimed.status, 'in_progress');
        assert.equal(claimed.assigneeAgentId, agentId);
    });

    it('writes leave no tmp orphans behind (P-MED-5)', () => {
        store.logActivity(companyId, 'test', 'tmp-scan');
        store.startRun({ companyId, trigger: 'manual' });
        assert.deepEqual(tmpFiles(), []);
    });
});
