import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated DATA_DIR: must be set before company-store module loads.
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'run-integrity-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');

const readRuns = () =>
    JSON.parse(fs.readFileSync(path.join(DATA, 'heartbeat-runs.json'), 'utf8')).runs;

let companyId;

function hire(name, managerId) {
    const appr = store.requestApproval(companyId, {
        kind: 'hire_agent',
        payload: managerId ? { name, managerId } : { name },
    });
    const decided = store.decideApproval(appr.id, { decision: 'approved', by: 'tester' });
    return decided.executedAgentId;
}

describe('run integrity: budget gate, status validation, reaper (P-HIGH-1/2/3)', () => {
    before(() => {
        const org = store.createCompany({ name: 'RunCo', mission: 'test', monthlyBudgetCents: 100 });
        companyId = org.id;
    });

    it('setAgentStatus validates against AGENT_STATUS', () => {
        const id = hire('Valid One');
        assert.throws(() => store.setAgentStatus(companyId, id, 'bogus'), /status must be one of/);
        const agent = store.setAgentStatus(companyId, id, 'paused');
        assert.equal(agent.status, 'paused');
    });

    it('override reassign rejects manager cycles', () => {
        const a = hire('Cycle A');
        hire('Cycle B', a);
        const appr = store.requestApproval(companyId, {
            kind: 'override',
            payload: { action: 'reassign', agentId: a, managerId: store.listAgents(companyId).find((x) => x.name === 'Cycle B').id },
        });
        assert.throws(
            () => store.decideApproval(appr.id, { decision: 'approved', by: 'tester' }),
            /cycle/,
        );
    });

    it('checkRunBudgetGate closes over-budget runs and passes funded ones', () => {
        store.recordCost({ companyId, cents: 200, model: 'test', taskId: 't1' });
        const over = store.startRun({ companyId, trigger: 'manual' });
        const gate = store.checkRunBudgetGate(over);
        assert.equal(gate.over, true);
        assert.equal(gate.scope, 'company');
        const closed = readRuns().find((r) => r.id === over.id);
        assert.equal(closed.status, 'error');
        assert.match(closed.events.at(-1).detail, /budget exhausted/);
    });

    it('reapStaleRuns closes only stale running runs, idempotently', () => {
        const fresh = store.startRun({ companyId, trigger: 'manual' });
        const stale = store.startRun({ companyId, trigger: 'manual' });
        const all = readRuns();
        all.find((r) => r.id === stale.id).createdAt -= 31 * 60 * 1000;
        fs.writeFileSync(path.join(DATA, 'heartbeat-runs.json'), JSON.stringify({ runs: all }));

        assert.equal(store.reapStaleRuns(), 1);
        const after = readRuns();
        assert.equal(after.find((r) => r.id === stale.id).status, 'error');
        assert.match(
            after.find((r) => r.id === stale.id).events.at(-1).detail,
            /stale running run/,
        );
        assert.equal(after.find((r) => r.id === fresh.id).status, 'running');
        assert.equal(store.reapStaleRuns(), 0);
    });
});
