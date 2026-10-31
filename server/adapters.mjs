import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';

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

// W6-021: SSRF guard. Reject loopback and private/IP-liable targets so the
// http adapter cannot be abused to reach internal services (metadata, LAN).
function isPrivateIpLiteral(ip) {
    const host = String(ip || '').toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host === '::') return true;
    if (/^127\./.test(host)) return true;
    if (/^169\.254\./.test(host)) return true;
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    const m = host.match(/^172\.(\d{1,3})\./);
    if (m) {
        const octet = Number(m[1]);
        if (octet >= 16 && octet <= 31) return true;
    }
    return false;
}

async function assertPublicUrl(rawUrl) {
    let u;
    try {
        u = new URL(String(rawUrl || ''));
    } catch {
        throw new Error('url must be a valid http(s) URL');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new Error('url must be http(s)');
    }
    const hostname = u.hostname;
    if (isPrivateIpLiteral(hostname)) {
        throw new Error(`url host ${hostname} is not allowed (private/loopback)`);
    }
    // Hostname -> resolve all A/AAAA; refuse if any resolves private.
    let addresses;
    try {
        addresses = await dns.promises.lookup(hostname, { all: true });
    } catch {
        throw new Error(`url host ${hostname} could not be resolved`);
    }
    for (const entry of addresses) {
        if (isPrivateIpLiteral(entry.address)) {
            throw new Error(`url host ${hostname} resolves to a private address (blocked)`);
        }
    }
    return u;
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
            // W6-021: refuse private/loopback literal targets up-front.
            if (isPrivateIpLiteral(u.hostname)) {
                return { ok: false, error: `url host ${u.hostname} is not allowed (private/loopback)` };
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
            // W6-021: enforce the SSRF guard (DNS check) before fetch; redirects
            // are refused so a public URL cannot bounce into a private one.
            await assertPublicUrl(cfg.url);
            const res = await fetch(String(cfg.url), {
                method,
                headers: { 'Content-Type': 'application/json', ...(cfg?.headers || {}) },
                body: method === 'POST' ? JSON.stringify(ctx.input ?? {}) : undefined,
                signal: ctl.signal,
                redirect: 'manual',
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

// ── browser-use: web-автоматизация через внешний sidecar ──
// Включается только через ADAPTERS_ALLOW_BROWSER_USE=1 осознанно оператором.
// Gateway НЕ запускает браузер сам (node:22-alpine + cap_drop: ALL +
// read_only rootfs) — он форвардит задачу на sidecar-контейнер
// (mcr.microsoft.com/playwright/python + FastAPI, см. docker/browser-use-sidecar/).
// Sidecar исполняет task через browser-use lib и возвращает
// { screenshots, finalState, actions }. Здесь только валидация конфига,
// таймаут/abort и обрезка вывода — по образцу httpAdapter/processAdapter.
const BROWSER_USE_MAX_STEPS = 50;
const BROWSER_USE_MAX_TASK_CHARS = 8000;

function browserUseHealthUrl(sidecarUrl) {
    const base = String(sidecarUrl).replace(/\/$/, '');
    if (/\/execute\/?$/.test(base)) return `${base.replace(/\/execute\/?$/, '')}/health`;
    return `${base}/health`;
}

const browserUseAdapter = {
    typeKey: 'browser-use',
    enabled() {
        return process.env.ADAPTERS_ALLOW_BROWSER_USE === '1';
    },
    validateConfig(cfg) {
        if (!cfg || typeof cfg.sidecarUrl !== 'string' || !cfg.sidecarUrl.trim()) {
            return { ok: false, error: 'sidecarUrl is required' };
        }
        let u;
        try {
            u = new URL(String(cfg.sidecarUrl));
        } catch {
            return { ok: false, error: 'sidecarUrl must be a valid URL' };
        }
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            return { ok: false, error: 'sidecarUrl must be http(s)' };
        }
        if (u.username || u.password) {
            return { ok: false, error: 'sidecarUrl must not embed credentials' };
        }
        if (cfg.maxSteps !== undefined) {
            const n = Number(cfg.maxSteps);
            if (!Number.isFinite(n) || n < 1 || n > BROWSER_USE_MAX_STEPS) {
                return { ok: false, error: `maxSteps must be 1..${BROWSER_USE_MAX_STEPS}` };
            }
        }
        if (cfg.allowedDomains !== undefined) {
            if (!Array.isArray(cfg.allowedDomains)) {
                return { ok: false, error: 'allowedDomains must be an array of hostnames' };
            }
            for (const d of cfg.allowedDomains) {
                if (typeof d !== 'string' || !d.trim() || /[\s/:]/.test(d)) {
                    return { ok: false, error: `bad allowedDomains entry: ${String(d).slice(0, 80)}` };
                }
            }
        }
        return { ok: true };
    },
    async execute(ctx, cfg) {
        const input = ctx?.input ?? {};
        const task = typeof input.task === 'string' ? input.task : typeof input.text === 'string' ? input.text : '';
        if (!task.trim()) {
            const err = new Error('browser-use input.task is required');
            err.code = 'ADAPTER';
            throw err;
        }
        if (task.length > BROWSER_USE_MAX_TASK_CHARS) {
            const err = new Error(`browser-use task too long (${task.length} > ${BROWSER_USE_MAX_TASK_CHARS})`);
            err.code = 'ADAPTER';
            throw err;
        }
        const sidecarUrl = String(cfg.sidecarUrl).replace(/\/$/, '');
        const timeoutMs = clampTimeout(cfg?.timeoutMs ?? 90_000);
        const payload = {
            task: task.slice(0, BROWSER_USE_MAX_TASK_CHARS),
            ticketId: typeof input.ticketId === 'string' ? input.ticketId.slice(0, 120) : undefined,
            maxSteps:
                cfg.maxSteps !== undefined
                    ? Math.max(1, Math.min(BROWSER_USE_MAX_STEPS, Number(cfg.maxSteps)))
                    : undefined,
            allowedDomains: Array.isArray(cfg.allowedDomains) ? cfg.allowedDomains : undefined,
        };
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
            const res = await fetch(sidecarUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: ctl.signal,
                // Не следуем редиректам автоматически: sidecar не должен
                // уводить gateway на произвольные хосты.
                redirect: 'manual',
            });
            if (res.status >= 300 && res.status < 400) {
                const err = new Error(`browser-use sidecar refused redirect (HTTP ${res.status})`);
                err.code = 'ADAPTER';
                throw err;
            }
            const buf = Buffer.from(await res.arrayBuffer());
            const text = truncate(buf).toString('utf8');
            if (!res.ok) {
                const err = new Error(`browser-use sidecar HTTP ${res.status}: ${text.slice(0, 300)}`);
                err.code = 'ADAPTER';
                throw err;
            }
            return {
                stdout: text,
                usage: { httpStatus: res.status },
                costCents: 0,
            };
        } catch (e) {
            if (e && e.code === 'ADAPTER') throw e;
            const err = new Error(`browser-use adapter failed: ${e instanceof Error ? e.message : String(e)}`);
            err.code = 'ADAPTER';
            throw err;
        } finally {
            clearTimeout(timer);
        }
    },
    async testEnvironment(cfg) {
        if (!cfg) return { ok: false, detail: 'config required' };
        const v = browserUseAdapter.validateConfig(cfg);
        if (!v.ok) return { ok: false, detail: v.error };
        const timeoutMs = Math.min(clampTimeout(cfg?.timeoutMs), 10_000);
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
            const res = await fetch(browserUseHealthUrl(cfg.sidecarUrl), {
                signal: ctl.signal,
                redirect: 'manual',
            });
            if (!res.ok) return { ok: false, detail: `sidecar health HTTP ${res.status}` };
            return { ok: true, detail: 'sidecar reachable' };
        } catch (e) {
            return { ok: false, detail: e instanceof Error ? e.message : String(e) };
        } finally {
            clearTimeout(timer);
        }
    },
};

// ── computer-act: одно CUA-действие через sidecar /act ──
// Пара к browser-use, но action-level (для ComputerUseLoopService):
// loop выполняет до 30 ходов, каждый — отдельным gateway run'ом
// (endpoint /execute закрывает run после каждого вызова).
// Kill-switch: ADAPTERS_ALLOW_COMPUTER_ACT=1.
// sidecarUrl берётся из конфига запроса, иначе из env gateway
// BROWSER_USE_ACT_URL (в compose — docker-имя sidecar; локально —
// http://localhost:3100/act), иначе запрос невалиден.
const COMPUTER_ACT_ACTIONS = new Set([
    'screenshot',
    'mouse_move',
    'left_click',
    'right_click',
    'middle_click',
    'double_click',
    'triple_click',
    'left_click_drag',
    'left_mouse_down',
    'left_mouse_up',
    'scroll',
    'type',
    'key',
    'hold_key',
    'wait',
    'goto',
    'go_forward',
    'go_back',
]);

function computerActHealthUrl(actUrl) {
    const base = String(actUrl).replace(/\/$/, '');
    if (/\/act\/?$/.test(base)) return `${base.replace(/\/act\/?$/, '')}/health`;
    return `${base}/health`;
}

function resolveActUrl(cfg) {
    const raw = typeof cfg?.sidecarUrl === 'string' && cfg.sidecarUrl.trim()
        ? cfg.sidecarUrl
        : process.env.BROWSER_USE_ACT_URL || '';
    return String(raw).trim().replace(/\/$/, '');
}

const computerActAdapter = {
    typeKey: 'computer-act',
    enabled() {
        return process.env.ADAPTERS_ALLOW_COMPUTER_ACT === '1';
    },
    validateConfig(cfg) {
        const sidecarUrl = resolveActUrl(cfg);
        if (!sidecarUrl) {
            return { ok: false, error: 'sidecarUrl is required (or BROWSER_USE_ACT_URL on gateway)' };
        }
        let u;
        try {
            u = new URL(sidecarUrl);
        } catch {
            return { ok: false, error: 'sidecarUrl must be a valid URL' };
        }
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            return { ok: false, error: 'sidecarUrl must be http(s)' };
        }
        if (u.username || u.password) {
            return { ok: false, error: 'sidecarUrl must not embed credentials' };
        }
        if (cfg?.allowedDomains !== undefined) {
            if (!Array.isArray(cfg.allowedDomains)) {
                return { ok: false, error: 'allowedDomains must be an array of hostnames' };
            }
            for (const d of cfg.allowedDomains) {
                if (typeof d !== 'string' || !d.trim() || /[\s/:]/.test(d)) {
                    return { ok: false, error: `bad allowedDomains entry: ${String(d).slice(0, 80)}` };
                }
            }
        }
        return { ok: true };
    },
    async execute(ctx, cfg) {
        const input = ctx?.input ?? {};
        const action = typeof input.action === 'string' ? input.action.trim().toLowerCase() : '';
        if (!action) {
            const err = new Error('computer-act input.action is required');
            err.code = 'ADAPTER';
            throw err;
        }
        // Defense in depth: шлюз знает допустимый набор (дубль sidecar,
        // чтобы послабление там не открыло произвольный passthrough здесь).
        if (!COMPUTER_ACT_ACTIONS.has(action)) {
            const err = new Error(`computer-act unknown action: ${action.slice(0, 64)}`);
            err.code = 'ADAPTER';
            throw err;
        }
        const sidecarUrl = resolveActUrl(cfg);
        const timeoutMs = clampTimeout(cfg?.timeoutMs ?? 60_000);
        const { action: _drop, ticketId: _dropTicket, ...params } = input;
        const payload = {
            action,
            ...params,
            ticketId: typeof input.ticketId === 'string' ? input.ticketId.slice(0, 120) : undefined,
            allowedDomains: Array.isArray(cfg?.allowedDomains) ? cfg.allowedDomains : undefined,
        };
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
            const res = await fetch(sidecarUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: ctl.signal,
                redirect: 'manual',
            });
            if (res.status >= 300 && res.status < 400) {
                const err = new Error(`computer-act sidecar refused redirect (HTTP ${res.status})`);
                err.code = 'ADAPTER';
                throw err;
            }
            const buf = Buffer.from(await res.arrayBuffer());
            const text = truncate(buf).toString('utf8');
            if (!res.ok) {
                const err = new Error(`computer-act sidecar HTTP ${res.status}: ${text.slice(0, 300)}`);
                err.code = 'ADAPTER';
                throw err;
            }
            return {
                stdout: text,
                usage: { httpStatus: res.status },
                costCents: 0,
            };
        } catch (e) {
            if (e && e.code === 'ADAPTER') throw e;
            const err = new Error(`computer-act adapter failed: ${e instanceof Error ? e.message : String(e)}`);
            err.code = 'ADAPTER';
            throw err;
        } finally {
            clearTimeout(timer);
        }
    },
    async testEnvironment(cfg) {
        if (!cfg && !process.env.BROWSER_USE_ACT_URL) return { ok: false, detail: 'config required' };
        const v = computerActAdapter.validateConfig(cfg ?? {});
        if (!v.ok) return { ok: false, detail: v.error };
        const timeoutMs = Math.min(clampTimeout(cfg?.timeoutMs), 10_000);
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
            const res = await fetch(computerActHealthUrl(resolveActUrl(cfg ?? {})), {
                signal: ctl.signal,
                redirect: 'manual',
            });
            if (!res.ok) return { ok: false, detail: `sidecar health HTTP ${res.status}` };
            return { ok: true, detail: 'sidecar reachable' };
        } catch (e) {
            return { ok: false, detail: e instanceof Error ? e.message : String(e) };
        } finally {
            clearTimeout(timer);
        }
    },
};

const REGISTRY = new Map([
    ['echo', echoAdapter],
    ['http', httpAdapter],
    ['process', processAdapter],
    ['browser-use', browserUseAdapter],
    ['computer-act', computerActAdapter],
]);

export function listAdapters() {
    return [...REGISTRY.values()].map((a) => ({ typeKey: a.typeKey, enabled: a.enabled() }));
}

export function getAdapter(typeKey) {
    return REGISTRY.get(String(typeKey)) || null;
}

export { parseStdout };
