import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SYNC_SECRET = 'process-adapter-test-secret';
const { getAdapter } = await import('../adapters.mjs');

test('process adapter whitelists binaries', () => {
    const adapter = getAdapter('process');
    assert.equal(adapter.validateConfig({ command: 'bash', args: [] }).ok, false);
    assert.equal(adapter.validateConfig({ command: 'npm', args: [] }).ok, false);
    assert.equal(adapter.validateConfig({ command: 'node', args: ['-e', '1'] }).ok, true);
});

test('process adapter does not leak server secrets', async () => {
    const adapter = getAdapter('process');
    const res = await adapter.execute(
        { input: { text: '' } },
        {
            command: 'node',
            args: ['-e', "process.stdout.write(process.env.SYNC_SECRET ? 'leaked' : 'none')"],
        },
    );
    assert.equal(res.stdout, 'none');
});
