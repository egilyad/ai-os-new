import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated DATA_DIR: must be set before modules load.
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'autocycle-test-'));
process.env.COMPANY_DATA_DIR = DATA;
process.env.AUTOCYCLE_ENABLED = '1';
process.env.AUTOCYCLE_MAX_ITERATIONS = '3';

const guard = await import('../autocycle-guard.mjs');

describe('autocycle slot release (P-LOW-6)', () => {
    const company = 'comp-1';

    it('consume then release returns quota', () => {
        assert.deepEqual(guard.consumeAutocycleSlot(company), {
            allowed: true,
            used: 1,
            max: 3,
        });
        assert.equal(guard.releaseAutocycleSlot(company), 0);
        // Releasing an empty quota is a no-op, never negative.
        assert.equal(guard.releaseAutocycleSlot(company), 0);
    });

    it('exhaustion still blocks after real consumption', () => {
        guard.consumeAutocycleSlot(company);
        guard.consumeAutocycleSlot(company);
        guard.consumeAutocycleSlot(company);
        const blocked = guard.consumeAutocycleSlot(company);
        assert.equal(blocked.allowed, false);
        assert.match(blocked.reason, /exhausted/);
    });

    it('release is scoped per company', () => {
        assert.equal(guard.releaseAutocycleSlot('other-comp'), 0);
    });
});
