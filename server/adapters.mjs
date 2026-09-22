import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const MAX_OUTPUT_BYTES = 256 * 1024;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 30_000;

function clampTimeout(v) {
    const n = Number(v ?? DEFAULT_TIMEOUT_MS);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMEOUT_MS;
    return Math.min(n, MAX_TIMEOUT_MS);
}

function truncate(buf) {
    if (buf.length > MAX_OUTPUT_BYTES) return buf.subarray(0, MAX_OUTPUT_BYTES);
    return buf;
}

function parseStdout(raw) {
    // Транскрипт для run-viewer: построчные записи с сохранением порядка.
    return String(raw)
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line, i, arr) => !(line === '' && (i === 0 || arr[i - 1] === '')))
        .map((line) => ({ line }));
}

// ── echo: тестовый двойник, всегда включён ──
const echoAdapter = {
    typeKey: 'echo',
    enabled() {
        return true;
    },
    validateConfig() {
        return { ok: true };
    },
    async execute(ctx) {
        const text = String(ctx.input?.text ?? ctx.input ?? '');
        return { stdout: text.slice(0, MAX_OUTPUT_BYTES), usage: null, costCents: 0 };
    },
    async testEnvironment() {
        return { ok: true, detail: 'echo always available' };
    },
};

// ── http: вебхук на внешний рантайм ──
const httpAdapter = {
    typeKey: 'http',
    enabled() {
        return true;
    },
    validateConfig(cfg) {
        try {
            const u = new URL(String(cfg?.url || ''));
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                return { ok: false, error: 'url must be http(s)' };
            }
        } catch {
            return { ok: false, error: 'url is required and must be valid' };
        }
        const m = String(cfg?.method || 'POST').toUpperCase();
        if (m !== 'GET' && m !== 'POST') return { ok: false, error: 'method must be GET|POST' };
        return { ok: true };
    },
    async execute(ctx, cfg) {
        const timeoutMs = clampTimeout(cfg?.timeoutMs);
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
            const method = String(cfg?.method || 'POST').toUpperCase();
            const res = await fetch(String(cfg.url), {
                method,
                headers: { 'Content-Type': 'application/json', ...(cfg?.headers || {}) },
                body: method === 'POST' ? JSON.stringify(ctx.input ?? {}) : undefined,
                signal: ctl.signal,
            });
            const buf = Buffer.from(await res.arrayBuffer());
            return {
                stdout: truncate(buf).toString('utf8'),
                usage: { httpStatus: res.status },
                costCents: 0,
            };
        } catch (e) {
            const err = new Error(`http adapter failed: ${e instanceof Error ? e.message : String(e)}`);
            err.code = 'ADAPTER';
            throw err;
        } finally {
            clearTimeout(timer);
        }
    },
    async testEnvironment(cfg) {
        if (!cfg) return { ok: false, detail: 'config required' };
        const v = httpAdapter.validateConfig(cfg);
        return v.ok ? { ok: true, detail: 'config valid' } : { ok: false, detail: v.error };
    },
};

// ── process: shell-исполнение, ВЫКЛЮЧЕН по умолчанию ──
// Включается только через ADAPTERS_ALLOW_PROCESS=1 осознанно оператором:
// адаптер запускает произвольные бинарники (как paperclip'овский process).
// Ограничения: без shell, cwd принудительно DATA_DIR, лимит времени/вывода.
const processAdapter = {
    typeKey: 'process',
    enabled() {
        return process.env.ADAPTERS_ALLOW_PROCESS === '1';
    },
    validateConfig(cfg) {
        if (!cfg || typeof cfg.command !== 'string' || !cfg.command.trim()) {
            return { ok: false, error: 'command is required' };
        }
        if (cfg.args !== undefined && !Array.isArray(cfg.args)) {
            return { ok: false, error: 'args must be an array' };
        }
        return { ok: true };
    },
    async execute(ctx, cfg) {
        const timeoutMs = clampTimeout(cfg?.timeoutMs);
        const args = Array.isArray(cfg?.args) ? cfg.args.map(String) : [];
        const inputText = typeof ctx.input?.text === 'string' ? ctx.input.text : '';
        return new Promise((resolve, reject) => {
            let child;
            try {
                child = spawn(String(cfg.command), args, {
                    cwd: DATA_DIR,
                    shell: false,
                    timeout: timeoutMs,
                    stdio: ['pipe', 'pipe', 'pipe'],
                });
            } catch (e) {
                const err = new Error(`process spawn failed: ${e instanceof Error ? e.message : String(e)}`);
                err.code = 'ADAPTER';
                reject(err);
                return;
            }
            const chunks = [];
            let size = 0;
            let killed = false;
            const timer = setTimeout(() => {
                killed = true;
                try {
                    child.kill('SIGKILL');
                } catch {
                    /* ignore */
                }
            }, timeoutMs);
            child.stdout.on('data', (c) => {
                size += c.length;
                if (size <= MAX_OUTPUT_BYTES * 2) chunks.push(c);
            });
            child.stderr.on('data', (c) => {
                size += c.length;
                if (size <= MAX_OUTPUT_BYTES * 2) chunks.push(c);
            });
            child.on('error', (e) => {
                clearTimeout(timer);
                const err = new Error(`process failed: ${e.message}`);
                err.code = 'ADAPTER';
                reject(err);
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                const raw = truncate(Buffer.concat(chunks)).toString('utf8');
                if (killed) {
                    const err = new Error(`process timeout after ${timeoutMs}ms`);
                    err.code = 'ADAPTER';
                    reject(err);
                    return;
                }
                resolve({ stdout: raw, usage: { exitCode: code }, costCents: 0 });
            });
            try {
                if (inputText) child.stdin.write(inputText.slice(0, MAX_OUTPUT_BYTES));
                child.stdin.end();
            } catch {
                /* ignore */
            }
        });
    },
    async testEnvironment() {
        return processAdapter.enabled()
            ? { ok: true, detail: 'process adapter enabled' }
            : { ok: false, detail: 'set ADAPTERS_ALLOW_PROCESS=1 to enable' };
    },
};

const REGISTRY = new Map([
    ['echo', echoAdapter],
    ['http', httpAdapter],
    ['process', processAdapter],
]);

export function listAdapters() {
    return [...REGISTRY.values()].map((a) => ({ typeKey: a.typeKey, enabled: a.enabled() }));
}

export function getAdapter(typeKey) {
    return REGISTRY.get(String(typeKey)) || null;
}

export { parseStdout };
