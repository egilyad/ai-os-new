import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const adapters = await import('../adapters.mjs');

function withEnv(vars, fn) {
    const prev = {};
    return async () => {
        for (const [k, v] of Object.entries(vars)) {
            prev[k] = process.env[k];
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
        try {
            await fn();
        } finally {
            for (const k of Object.keys(vars)) {
                if (prev[k] === undefined) delete process.env[k];
                else process.env[k] = prev[k];
            }
        }
    };
}

describe('computer-act adapter (loop gateway mode)', () => {
    let prevFetch;

    beforeEach(() => {
        prevFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = prevFetch;
    });

    it('is disabled by default (kill-switch)', async () => {
        await withEnv({ ADAPTERS_ALLOW_COMPUTER_ACT: undefined }, async () => {
            const a = adapters.getAdapter('computer-act');
            assert.ok(a, 'adapter registered');
            assert.equal(a.enabled(), false);
        })();
    });

    it('enables via ADAPTERS_ALLOW_COMPUTER_ACT=1', async () => {
        await withEnv({ ADAPTERS_ALLOW_COMPUTER_ACT: '1' }, async () => {
            assert.equal(adapters.getAdapter('computer-act').enabled(), true);
        })();
    });

    it('validateConfig: sidecarUrl from config or gateway env', async () => {
        await withEnv({ BROWSER_USE_ACT_URL: undefined }, async () => {
            const a = adapters.getAdapter('computer-act');
            assert.deepEqual(a.validateConfig({}).ok, false);
            assert.deepEqual(a.validateConfig({ sidecarUrl: 'ftp://x/act' }).ok, false);
            assert.deepEqual(a.validateConfig({ sidecarUrl: 'https://u:p@x/act' }).ok, false);
            assert.deepEqual(a.validateConfig({ sidecarUrl: 'http://localhost:3100/act' }).ok, true);
            assert.deepEqual(
                a.validateConfig({ sidecarUrl: 'http://localhost:3100/act', allowedDomains: 'x' }).ok,
                false,
            );
        })();
        await withEnv({ BROWSER_USE_ACT_URL: 'http://browser-use-sidecar:3100/act' }, async () => {
            const a = adapters.getAdapter('computer-act');
            assert.deepEqual(a.validateConfig({}).ok, true);
        })();
    });

    it('execute: POSTs action to sidecar and returns stdout', async () => {
        const a = adapters.getAdapter('computer-act');
        let seen = null;
        globalThis.fetch = async (url, init) => {
            seen = { url, init };
            return {
                ok: true,
                status: 200,
                arrayBuffer: async () => Buffer.from(JSON.stringify({ screenshot: 'shot', output: 'clicked' })),
            };
        };
        const out = await a.execute(
            { input: { action: 'left_click', coordinate: [10, 20], ticketId: 'sbx-1' }, run: {} },
            { sidecarUrl: 'http://localhost:3100/act' },
        );
        assert.ok(out.stdout.includes('clicked'));
        assert.equal(seen.url, 'http://localhost:3100/act');
        const body = JSON.parse(seen.init.body);
        assert.equal(body.action, 'left_click');
        assert.deepEqual(body.coordinate, [10, 20]);
        assert.equal(body.ticketId, 'sbx-1');
        assert.equal(seen.init.redirect, 'manual');
    });

    it('execute: rejects missing/unknown action and redirects', async () => {
        const a = adapters.getAdapter('computer-act');
        const cfg = { sidecarUrl: 'http://localhost:3100/act' };
        await assert.rejects(() => a.execute({ input: {}, run: {} }, cfg), /action is required/);
        await assert.rejects(() => a.execute({ input: { action: 'rm -rf' }, run: {} }, cfg), /unknown action/);
        globalThis.fetch = async () => ({ ok: true, status: 302, arrayBuffer: async () => Buffer.from('') });
        await assert.rejects(
            () => a.execute({ input: { action: 'screenshot' }, run: {} }, cfg),
            /redirect/,
        );
    });

    it('execute: works against a real local HTTP actuator stub', async () => {
        const a = adapters.getAdapter('computer-act');
        const server = http.createServer((req, res) => {
            let raw = '';
            req.on('data', (c) => (raw += c));
            req.on('end', () => {
                const payload = JSON.parse(raw);
                assert.equal(payload.action, 'screenshot');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ screenshot: 'iVBOR', output: 'shot' }));
            });
        });
        await new Promise((r) => server.listen(0, '127.0.0.1', r));
        const port = server.address().port;
        try {
            const out = await a.execute(
                { input: { action: 'screenshot' }, run: {} },
                { sidecarUrl: `http://127.0.0.1:${port}/act` },
            );
            assert.ok(out.stdout.includes('iVBOR'));
        } finally {
            await new Promise((r) => server.close(r));
        }
    });
});
