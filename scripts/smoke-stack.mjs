/**
 * Smoke-проверка browser/computer-стека для оператора (после деплоя).
 *
 * Проверяет БЕЗ побочных эффектов (ничего не создаёт, не исполняет):
 *   1. sidecar жив (`GET {sidecar}/health`, ждём {ok:true});
 *   2. gateway жив (`GET {gateway}/api/health`);
 *   3. адаптеры на месте (`GET {gateway}/api/adapters` с Bearer):
 *      browser-use и computer-act присутствуют; отдельно показывает
 *      включены ли kill-switch'и (ADAPTERS_ALLOW_*).
 *
 * Опционально `--probe --company <id>`: сквозной прогон execute-пути
 * через БЕЗОПАСНЫЙ echo-адаптер (создаёт run, НЕ трогает sidecar).
 * Для browser-use/computer-use проб НЕ ДЕЛАЕМ намеренно: execute
 * закрывает run и реально дёргает sidecar (дорого/сайд-эффекты).
 *
 * Usage:
 *   node scripts/smoke-stack.mjs [--sidecar URL] [--gateway URL]
 *     [--secret SYNC_SECRET] [--company ID --probe] [--timeout MS]
 * Exit: 0 — всё ок; 1 — хоть одна проверка красная; 2 — usage error.
 */
const DEFAULT_SIDECAR = 'http://localhost:3100';
const DEFAULT_GATEWAY = 'http://localhost:3001';
const DEFAULT_TIMEOUT_MS = 10_000;

export async function checkSidecarHealth(sidecarBase, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = `${String(sidecarBase).replace(/\/$/, '')}/health`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctl.signal, redirect: 'manual' });
        if (!res.ok) return { ok: false, detail: `sidecar health HTTP ${res.status}` };
        const data = (await res.json().catch(() => ({}))) ?? {};
        if (data.ok !== true) return { ok: false, detail: 'sidecar health body has no ok:true' };
        return { ok: true, detail: `sidecar ok (agent llm: ${data.agent === true ? 'configured' : 'fallback'})` };
    } catch (e) {
        return { ok: false, detail: `sidecar unreachable: ${e instanceof Error ? e.message : String(e)}` };
    } finally {
        clearTimeout(timer);
    }
}

export async function checkGatewayHealth(gatewayBase, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = `${String(gatewayBase).replace(/\/$/, '')}/api/health`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctl.signal, redirect: 'manual' });
        if (!res.ok) return { ok: false, detail: `gateway health HTTP ${res.status}` };
        return { ok: true, detail: 'gateway ok' };
    } catch (e) {
        return { ok: false, detail: `gateway unreachable: ${e instanceof Error ? e.message : String(e)}` };
    } finally {
        clearTimeout(timer);
    }
}

export async function checkGatewayAdapters(gatewayBase, secret, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = `${String(gatewayBase).replace(/\/$/, '')}/api/adapters`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            headers: secret ? { Authorization: `Bearer ${secret}` } : {},
            signal: ctl.signal,
            redirect: 'manual',
        });
        if (res.status === 401) {
            return { ok: false, detail: 'adapters: unauthorized (wrong SYNC_SECRET?)', adapters: [] };
        }
        if (!res.ok) return { ok: false, detail: `adapters HTTP ${res.status}`, adapters: [] };
        const data = (await res.json().catch(() => ({}))) ?? {};
        const adapters = Array.isArray(data.adapters) ? data.adapters : [];
        const find = (k) => adapters.find((a) => a && a.typeKey === k);
        const missing = ['browser-use', 'computer-act'].filter((k) => !find(k));
        if (missing.length > 0) {
            return { ok: false, detail: `adapters missing: ${missing.join(', ')}`, adapters };
        }
        const flags = ['browser-use', 'computer-act'].map(
            (k) => `${k}=${find(k).enabled ? 'ON' : 'off'}`,
        );
        return { ok: true, detail: `adapters ok (${flags.join(', ')})`, adapters };
    } catch (e) {
        return { ok: false, detail: `adapters unreachable: ${e instanceof Error ? e.message : String(e)}`, adapters: [] };
    } finally {
        clearTimeout(timer);
    }
}

/** Сквозной execute-путь через echo (без sidecar): создаёт run + execute. */
export async function probeEchoExecute(gatewayBase, secret, companyId, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const base = String(gatewayBase).replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
    const withTimeout = async (url, init) => {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
            return await fetch(url, { ...init, signal: ctl.signal, redirect: 'manual' });
        } finally {
            clearTimeout(timer);
        }
    };
    try {
        const runRes = await withTimeout(`${base}/api/companies/${encodeURIComponent(companyId)}/runs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ trigger: 'manual', input: { smoke: true } }),
        });
        const runBody = (await runRes.json().catch(() => ({}))) ?? {};
        if (!runRes.ok) return { ok: false, detail: `create run failed: ${runBody.error || `HTTP ${runRes.status}`}` };
        const runId = runBody.run?.id ?? runBody.id;
        if (!runId) return { ok: false, detail: 'create run: no run id' };
        const exRes = await withTimeout(`${base}/api/runs/${encodeURIComponent(runId)}/execute`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ adapter: 'echo', config: {}, input: { text: 'smoke-ok' } }),
        });
        const exBody = (await exRes.json().catch(() => ({}))) ?? {};
        if (!exRes.ok) return { ok: false, detail: `execute failed: ${exBody.error || `HTTP ${exRes.status}`}` };
        if (!String(exBody.stdout ?? '').includes('smoke-ok')) {
            return { ok: false, detail: 'execute round-trip mismatch' };
        }
        return { ok: true, detail: `execute path ok (run ${runId})` };
    } catch (e) {
        return { ok: false, detail: `probe failed: ${e instanceof Error ? e.message : String(e)}` };
    }
}

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--sidecar') out.sidecar = argv[++i];
        else if (a === '--gateway') out.gateway = argv[++i];
        else if (a === '--secret') out.secret = argv[++i];
        else if (a === '--company') out.company = argv[++i];
        else if (a === '--probe') out.probe = true;
        else if (a === '--timeout') out.timeout = Number(argv[++i]);
        else if (a === '--help' || a === '-h') out.help = true;
        else throw new Error(`unknown arg: ${a}`);
    }
    return out;
}

async function main() {
    let args;
    try {
        args = parseArgs(process.argv.slice(2));
    } catch (e) {
        console.error(`usage error: ${e instanceof Error ? e.message : String(e)}`);
        process.exitCode = 2;
        return;
    }
    if (args.help) {
        console.log('node scripts/smoke-stack.mjs [--sidecar URL] [--gateway URL] [--secret S] [--company ID --probe] [--timeout MS]');
        return;
    }
    if (args.probe && !args.company) {
        console.error('usage error: --probe needs --company <id>');
        process.exitCode = 2;
        return;
    }
    if (args.probe && !args.secret) {
        console.error('usage error: --probe needs --secret <SYNC_SECRET>');
        process.exitCode = 2;
        return;
    }
    const sidecar = args.sidecar ?? process.env.BROWSER_USE_SIDECAR_BASE ?? DEFAULT_SIDECAR;
    const gateway = args.gateway ?? process.env.SYNC_GATEWAY_URL ?? DEFAULT_GATEWAY;
    const secret = args.secret ?? process.env.SYNC_SECRET ?? '';
    const timeout = Number.isFinite(args.timeout) && args.timeout > 0 ? args.timeout : DEFAULT_TIMEOUT_MS;

    const results = [];
    results.push(['sidecar', await checkSidecarHealth(sidecar, timeout)]);
    results.push(['gateway', await checkGatewayHealth(gateway, timeout)]);
    results.push(['adapters', await checkGatewayAdapters(gateway, secret, timeout)]);
    if (args.probe) {
        results.push(['probe', await probeEchoExecute(gateway, secret, args.company, timeout)]);
    }
    let failed = 0;
    for (const [name, r] of results) {
        console.log(`${r.ok ? 'PASS' : 'FAIL'} [${name}] ${r.detail}`);
        if (!r.ok) failed++;
    }
    process.exitCode = failed > 0 ? 1 : 0;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop() ?? '');
if (isMain) {
    main().catch((e) => {
        console.error(`smoke failed: ${e instanceof Error ? e.message : String(e)}`);
        process.exitCode = 1;
    });
}
