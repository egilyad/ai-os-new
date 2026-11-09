import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'heartbeat-batch-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');
const { processPendingWakeups } = await import('../heartbeat-loop.mjs');

describe('heartbeat batch processing (P1-17)', () => {
    let companyId;

    before(() => {
        const org = store.createCompany({ name: 'BatchCo', mission: 'test' });
        companyId = org.id;
    });

    it('processes at most `batch` wakeups per tick', () => {
        for (let i = 0; i < 12; i++) {
            store.enqueueWakeup({ companyId, agentId: `a${i}`, trigger: 'manual', ref: `r${i}` });
        }
        const events = [];
        const results = processPendingWakeups({ batch: 5, onEvent: (e) => events.push(e) });
        assert.equal(results.length, 5);
        assert.ok(results.every((r) => r.ok === true));
        assert.equal(events.filter((e) => e.type === 'wakeup_done').length, 5);
        assert.equal(store.listWakeups(true).length, 7);
    });

    it('processes the remaining pending wakeups on the next tick', () => {
        const results = processPendingWakeups({ batch: 5 });
        assert.equal(results.length, 5);
        assert.equal(store.listWakeups(true).length, 2);
    });

    it('flushes the tail and leaves nothing pending', () => {
        const results = processPendingWakeups({ batch: 5 });
        assert.equal(results.length, 2);
        assert.equal(store.listWakeups(true).length, 0);
        assert.equal(store.listWakeups(false).length, 12);
    });

    it('reports failures without stalling the rest of the batch', () => {
        store.enqueueWakeup({ companyId: 'no-such-org', agentId: 'x', trigger: 'manual' });
        store.enqueueWakeup({ companyId, agentId: 'ok', trigger: 'manual' });
        const results = processPendingWakeups({ batch: 5 });
        assert.equal(results.length, 2);
        assert.equal(results[0].ok, false);
        assert.equal(results[1].ok, true);
        assert.equal(store.listWakeups(true).length, 0);
    });
});
