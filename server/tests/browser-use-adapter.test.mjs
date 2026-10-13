import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const adapters = await import('../adapters.mjs');

function withEnv(key, value, fn) {
    const prev = process.env[key];
    return async () => {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
        try {
            await fn();
        } finally {
            if (prev === undefined) delete process.env[key];
            else process.env[key] = prev;
        }
    };
}

describe('browser-use adapter (phase70)', () => {
    let prevFetch;

    beforeEach(() => {
        prevFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = prevFetch;
    });

    it('is disabled by default (kill-switch)', async () => {
        await withEnv('ADAPTERS_ALLOW_BROWSER_USE', undefined, async () => {
            const a = adapters.getAdapter('browser-use');
            assert.ok(a, 'adapter registered');
            assert.equal(a.enabled(), false);
        })();
    });

    it('enables via ADAPTERS_ALLOW_BROWSER_USE=1', async () => {
        await withEnv('ADAPTERS_ALLOW_BROWSER_USE', '1', async () => {
            const a = adapters.getAdapter('browser-use');
            assert.equal(a.enabled(), true);
        })();
    });

    it('validateConfig: requires sidecarUrl, http(s), no creds', () => {
        const a = adapters.getAdapter('browser-use');
        assert.deepEqual(a.validateConfig({}).ok, false);
        assert.deepEqual(a.validateConfig({ sidecarUrl: 'ftp://x/y' }).ok, false);
        assert.deepEqual(a.validateConfig({ sidecarUrl: 'https://user:pass@x/' }).ok, false);
        assert.deepEqual(a.validateConfig({ sidecarUrl: 'http://localhost:3100/execute' }).ok, true);
        assert.deepEqual(
            a.validateConfig({ sidecarUrl: 'http://localhost:3100/execute', maxSteps: 99 }).ok,
            false,
        );
        assert.deepEqual(
            a.validateConfig({ sidecarUrl: 'http://localhost:3100/execute', maxSteps: 10 }).ok,
            true,
        );
        assert.deepEqual(
            a.validateConfig({ sidecarUrl: 'http://localhost:3100/execute', allowedDomains: 'x' }).ok,
            false,
        );
        assert.deepEqual(
            a.validateConfig({ sidecarUrl: 'http://localhost:3100/execute', allowedDomains: ['example.com'] }).ok,
            true,
        );
    });

    it('execute: POSTs task to sidecar and returns stdout', async () => {
        const a = adapters.getAdapter('browser-use');
        let seen = null;
        globalThis.fetch = async (url, init) => {
            seen = { url, init };
            return {
                ok: true,
                status: 200,
                arrayBuffer: async () =>
                    Buffer.from(JSON.stringify({ screenshot: 'iVBORw0KGgo=', actions: ['goto'] })),
            };
        };
        const out = await a.execute(
            { input: { task: 'open https://example.com and screenshot', ticketId: 'sbx-1' }, run: {} },
            { sidecarUrl: 'http://localhost:3100/execute', maxSteps: 5 },
        );
        assert.ok(out.stdout.includes('iVBORw0KGgo='));
        assert.equal(seen.url, 'http://localhost:3100/execute');
        const body = JSON.parse(seen.init.body);
        assert.equal(body.task, 'open https://example.com and screenshot');
        assert.equal(body.ticketId, 'sbx-1');
        assert.equal(body.maxSteps, 5);
        assert.equal(seen.init.redirect, 'manual');
    });

    it('execute: rejects empty task and redirects', async () => {
        const a = adapters.getAdapter('browser-use');
        await assert.rejects(
            () => a.execute({ input: {}, run: {} }, { sidecarUrl: 'http://localhost:3100/execute' }),
            /task is required/,
        );
        globalThis.fetch = async () => ({ ok: true, status: 302, arrayBuffer: async () => Buffer.from('') });
        await assert.rejects(
            () =>
                a.execute({ input: { task: 'hi' }, run: {} }, { sidecarUrl: 'http://localhost:3100/execute' }),
            /redirect/,
        );
    });

    it('execute: works against a real local HTTP sidecar stub', async () => {
        const a = adapters.getAdapter('browser-use');
        const server = http.createServer((req, res) => {
            let raw = '';
            req.on('data', (c) => (raw += c));
            req.on('end', () => {
                const payload = JSON.parse(raw);
                assert.ok(payload.task.includes('example.com'));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ screenshot: 'iVBORw0KGgo=', finalState: 'ok' }));
            });
        });
        await new Promise((r) => server.listen(0, '127.0.0.1', r));
        const port = server.address().port;
        try {
            const out = await a.execute(
                { input: { task: 'goto https://example.com' }, run: {} },
                { sidecarUrl: `http://127.0.0.1:${port}/execute` },
            );
            assert.ok(out.stdout.includes('finalState'));
        } finally {
            await new Promise((r) => server.close(r));
        }
    });
});
