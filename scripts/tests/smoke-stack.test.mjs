import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
    checkSidecarHealth,
    checkGatewayHealth,
    checkGatewayAdapters,
    probeEchoExecute,
} from '../smoke-stack.mjs';

function startStub(routes) {
    const server = http.createServer((req, res) => {
        const handler = routes[`${req.method} ${req.url}`];
        if (!handler) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'not found' }));
            return;
        }
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', () => {
            const out = handler(req, raw ? JSON.parse(raw) : {});
            res.writeHead(out.status ?? 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(out.body ?? {}));
        });
    });
    return {
        server,
        base: async () => {
            await new Promise((r) => server.listen(0, '127.0.0.1', r));
            return `http://127.0.0.1:${server.address().port}`;
        },
        close: async () => new Promise((r) => server.close(r)),
    };
}

describe('smoke-stack checks', () => {
    let stubs = [];

    afterEach(async () => {
        for (const s of stubs) await s.close().catch(() => {});
        stubs = [];
    });

    it('sidecar health: ok / http-error / unreachable', async () => {
        const s = startStub({ 'GET /health': () => ({ body: { ok: true, agent: false, maxSteps: 50 } }) });
        stubs.push(s);
        const good = await checkSidecarHealth(await s.base(), 2000);
        assert.equal(good.ok, true);
        assert.match(good.detail, /fallback/);

        const s2 = startStub({ 'GET /health': () => ({ status: 500, body: {} }) });
        stubs.push(s2);
        assert.equal((await checkSidecarHealth(await s2.base(), 2000)).ok, false);

        const bad = await checkSidecarHealth('http://127.0.0.1:1', 500);
        assert.equal(bad.ok, false);
        assert.match(bad.detail, /unreachable/);
    });

    it('gateway health + adapters list (+kill-switch flags)', async () => {
        const s = startStub({
            'GET /api/health': () => ({ body: { ok: true } }),
            'GET /api/adapters': (req) => {
                if (req.headers.authorization !== 'Bearer s3') return { status: 401, body: { error: 'x' } };
                return {
                    body: {
                        adapters: [
                            { typeKey: 'echo', enabled: true },
                            { typeKey: 'browser-use', enabled: false },
                            { typeKey: 'computer-act', enabled: true },
                        ],
                    },
                };
            },
        });
        stubs.push(s);
        const base = await s.base();
        assert.equal((await checkGatewayHealth(base, 2000)).ok, true);
        const adapters = await checkGatewayAdapters(base, 's3', 2000);
        assert.equal(adapters.ok, true);
        assert.match(adapters.detail, /browser-use=off/);
        assert.match(adapters.detail, /computer-act=ON/);
        const unauth = await checkGatewayAdapters(base, 'wrong', 2000);
        assert.equal(unauth.ok, false);
        assert.match(unauth.detail, /unauthorized/);
    });

    it('adapters check fails loudly when computer-act missing (old gateway)', async () => {
        const s = startStub({
            'GET /api/adapters': () => ({ body: { adapters: [{ typeKey: 'echo', enabled: true }] } }),
        });
        stubs.push(s);
        const r = await checkGatewayAdapters(await s.base(), '', 2000);
        assert.equal(r.ok, false);
        assert.match(r.detail, /computer-act/);
    });

    it('echo probe round-trips run create + execute', async () => {
        const seen = [];
        const s = startStub({
            'POST /api/companies/co-1/runs': (req, body) => {
                seen.push(body);
                return { body: { run: { id: 'run-1' } } };
            },
            'POST /api/runs/run-1/execute': (req, body) => {
                seen.push(body);
                assert.equal(body.adapter, 'echo');
                return { body: { stdout: 'smoke-ok' } };
            },
        });
        stubs.push(s);
        const r = await probeEchoExecute(await s.base(), 's3', 'co-1', 2000);
        assert.equal(r.ok, true);
        assert.match(r.detail, /run-1/);
        assert.equal(seen.length, 2);
    });

    it('echo probe surfaces gateway errors', async () => {
        const s = startStub({
            'POST /api/companies/co-1/runs': () => ({ status: 402, body: { error: 'budget exhausted' } }),
        });
        stubs.push(s);
        const r = await probeEchoExecute(await s.base(), 's3', 'co-1', 2000);
        assert.equal(r.ok, false);
        assert.match(r.detail, /budget exhausted/);
    });
});
