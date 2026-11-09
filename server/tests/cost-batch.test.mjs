import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'cost-batch-test-'));
process.env.COMPANY_DATA_DIR = DATA;

const store = await import('../company-store.mjs');

describe('cost recording buffered flush (P1-17)', () => {
    let companyId;

    before(() => {
        const org = store.createCompany({ name: 'CostCo', mission: 'test' });
        companyId = org.id;
    });

    it('records many events and flushes them in one batch', () => {
        for (let i = 0; i < 100; i++) {
            store.recordCost({
                companyId,
                agentId: `a${i % 3}`,
                model: 'm',
                inputTokens: 10,
                outputTokens: 20,
                cents: 1,
            });
        }
        // Чтение принудительно флашит буфер — все 100 должны быть видны.
        const all = store.listCosts(companyId, { limit: 1000 });
        assert.equal(all.length, 100);
        assert.equal(store.monthSpend(companyId), 100);
    });

    it('does not duplicate events across repeated reads', () => {
        const first = store.listCosts(companyId, { limit: 1000 });
        const second = store.listCosts(companyId, { limit: 1000 });
        assert.equal(first.length, 100);
        assert.equal(second.length, 100);
        assert.deepEqual(second.map((c) => c.id), first.map((c) => c.id));
    });

    it('rejects invalid cents', () => {
        assert.throws(() => store.recordCost({ companyId, cents: -1 }), /cents must be/);
        assert.throws(() => store.recordCost({ companyId: 'nope', cents: 1 }), /company not found/);
    });
});
