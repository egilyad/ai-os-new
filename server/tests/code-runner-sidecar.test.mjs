import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 3198;

function post(body, headers = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request(
            {
                host: '127.0.0.1',
                port: PORT,
                path: '/run',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
            },
            (res) => {
                let raw = '';
                res.on('data', (c) => (raw += c));
                res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
            },
        );
        req.on('error', reject);
        req.end(data);
    });
}

describe('code-runner sidecar', () => {
    let child;

    before(async () => {
        child = spawn(process.execPath, ['server/code-runner-sidecar.mjs'], {
            cwd: REPO,
            env: {
                ...process.env,
                CODE_RUNNER_PORT: String(PORT),
                SYNC_SECRET: 'sidecar-test-secret-do-not-leak',
            },
            stdio: 'ignore',
        });
        for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 200));
            const alive = await new Promise((resolve) => {
                const req = http.get({ host: '127.0.0.1', port: PORT, path: '/health' }, (r) => {
                    r.resume();
                    resolve(r.statusCode === 200);
                });
                req.on('error', () => resolve(false));
                req.setTimeout(300, () => {
                    req.destroy();
                    resolve(false);
                });
            });
            if (alive) return;
        }
        throw new Error('code-runner sidecar did not start');
    });

    after(() => child?.kill());

    it('health responds', async () => {
        const res = await new Promise((resolve, reject) => {
            http.get({ host: '127.0.0.1', port: PORT, path: '/health' }, (r) => {
                let raw = '';
                r.on('data', (c) => (raw += c));
                r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(raw) }));
            }).on('error', reject);
        });
        assert.equal(res.status, 200);
    });

    it('runs an allowed command inside the sandbox', async () => {
        const res = await post({ cmd: 'node', args: ['-e', 'console.log(1+1)'] });
        assert.equal(res.status, 200);
        assert.equal(res.body.exitCode, 0);
        assert.match(res.body.stdout, /2/);
    });

    it('rejects disallowed commands', async () => {
        const res = await post({ cmd: 'bash', args: ['-c', 'echo hi'] });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /not allowed/);
    });

    it('rejects npm/npx even though they are on PATH', async () => {
        for (const cmd of ['npm', 'npx']) {
            const res = await post({ cmd, args: ['-v'] });
            assert.equal(res.status, 400);
            assert.match(res.body.error, /not allowed/);
        }
    });

    it('does not expose server secrets to spawned code', async () => {
        const res = await post({
            cmd: 'node',
            args: ['-e', "process.stdout.write(process.env.SYNC_SECRET ? 'leaked' : 'none')"],
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.stdout, 'none');
    });

    it('rejects cwd outside the sandbox', async () => {
        const res = await post({ cmd: 'node', args: ['-e', 'console.log(1)'], cwd: 'C:\\' });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /sandbox/);
    });

    it('rejects cross-origin requests', async () => {
        const res = await post({ cmd: 'node', args: ['-e', '1'] }, { Origin: 'https://evil.example' });
        assert.equal(res.status, 401);
    });
});
