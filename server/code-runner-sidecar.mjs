/**
 * Code-runner sidecar — isolated command execution for agent code artifacts.
 *
 * Run: node server/code-runner-sidecar.mjs  (loopback :3102 by default)
 * API: POST /run { cmd, args?, cwd?, timeoutMs? } -> { ok, stdout, stderr, exitCode, durationMs }
 *
 * Hardening (mirrors browser-sidecar lessons):
 *  - loopback binding by default; optional bearer token for non-health requests;
 *  - Origin check (loopback only, or absent for server-to-server);
 *  - strict command allowlist — no shell, no pipe, no arbitrary binaries;
 *  - cwd confined to a dedicated sandboxed directory under the repo;
 *  - bounded timeout, bounded output, bounded concurrent runs.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const PORT = Number(process.env.CODE_RUNNER_PORT || 3102);
const HOST = process.env.CODE_RUNNER_HOST || '127.0.0.1';
const TOKEN = process.env.CODE_RUNNER_TOKEN || '';
const MAX_BODY = 64 * 1024;
const MAX_OUTPUT = 256 * 1024;
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_TIMEOUT_MS = 60_000;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK_ROOT = path.resolve(process.env.CODE_RUNNER_WORK_DIR || path.join(REPO_ROOT, '.code-runner'));
fs.mkdirSync(WORK_ROOT, { recursive: true });

// Only explicit, non-shell binaries. npm/node invocations are allowed; the
// actual project scripts run with cwd confined to WORK_ROOT.
const ALLOWED = new Map([
    ['node', process.execPath],
    ['npm', process.platform === 'win32' ? 'npm.cmd' : 'npm'],
    ['npx', process.platform === 'win32' ? 'npx.cmd' : 'npx'],
]);

function send(res, code, payload) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

function authorized(req) {
    if (TOKEN && (req.headers.authorization || '') !== `Bearer ${TOKEN}`) return false;
    const origin = req.headers.origin;
    if (origin) {
        try {
            const o = new URL(origin);
            if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(o.hostname.toLowerCase())) return false;
        } catch {
            return false;
        }
    }
    return true;
}

function resolveCwd(requested) {
    const base = path.resolve(requested || WORK_ROOT);
    // Confine: requested cwd must live under WORK_ROOT.
    if (base !== WORK_ROOT && !base.startsWith(WORK_ROOT + path.sep)) return null;
    return base;
}

let activeRuns = 0;
const MAX_CONCURRENT = 2;

async function runCommand(body) {
    const name = String(body.cmd || '').toLowerCase();
    const bin = ALLOWED.get(name);
    if (!bin) throw new Error(`command not allowed: ${name || '(empty)'} (allowed: ${[...ALLOWED.keys()].join(', ')})`);
    const args = Array.isArray(body.args) ? body.args.map((a) => String(a)) : [];
    if (args.some((a) => /[;&|`$<>]/.test(a))) throw new Error('shell metacharacters are not allowed in args');
    const cwd = resolveCwd(body.cwd);
    if (!cwd) throw new Error('cwd must stay inside the sandbox directory');
    const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1000, Number(body.timeoutMs) || DEFAULT_TIMEOUT_MS));
    if (activeRuns >= MAX_CONCURRENT) throw new Error('too many concurrent runs');
    activeRuns++;
    const startedAt = Date.now();
    try {
        return await new Promise((resolve) => {
            const child = spawn(bin, args, { cwd, shell: false, env: { ...process.env, CI: '1' } });
            let stdout = '';
            let stderr = '';
            let done = false;
            const finish = (exitCode, error) => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve({
                    ok: exitCode === 0,
                    stdout: stdout.slice(0, MAX_OUTPUT),
                    stderr: (stderr + (error ? `\n${error}` : '')).slice(0, MAX_OUTPUT),
                    exitCode,
                    durationMs: Date.now() - startedAt,
                });
            };
            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                finish(null, 'timeout');
            }, timeoutMs);
            child.stdout?.on('data', (c) => {
                if (stdout.length < MAX_OUTPUT) stdout += c.toString();
            });
            child.stderr?.on('data', (c) => {
                if (stderr.length < MAX_OUTPUT) stderr += c.toString();
            });
            child.on('error', (e) => finish(null, e.message));
            child.on('close', (code) => finish(code ?? 1));
        });
    } finally {
        activeRuns--;
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, sandbox: WORK_ROOT });
    if (req.method === 'POST' && url.pathname === '/run') {
        if (!authorized(req)) return send(res, 401, { error: 'unauthorized' });
        let raw = '';
        req.on('data', (c) => {
            raw += c;
            if (raw.length > MAX_BODY) req.destroy();
        });
        req.on('end', async () => {
            let body;
            try {
                body = JSON.parse(raw || '{}');
            } catch {
                return send(res, 400, { error: 'invalid JSON' });
            }
            try {
                return send(res, 200, await runCommand(body));
            } catch (e) {
                return send(res, 400, { error: e instanceof Error ? e.message : String(e) });
            }
        });
        return;
    }
    return send(res, 404, { error: 'not found' });
});

server.listen(PORT, HOST, () => {
    console.log(`[code-runner] listening on http://${HOST}:${PORT} sandbox=${WORK_ROOT}`);
});
