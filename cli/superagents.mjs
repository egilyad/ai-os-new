#!/usr/bin/env node
// M9.2: CLI superagents — onboard/doctor/db-backup/run/configure поверх headless API.
// Без зависимостей (только node ≥22). Не трогает src/ и UI.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SERVER_FILES = ['server/sync-server.mjs', 'server/company-store.mjs', 'server/heartbeat-loop.mjs', 'server/adapters.mjs'];

function args(argv) {
    const out = { _: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const k = a.slice(2);
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith('--')) {
                out[k] = next;
                i += 1;
            } else {
                out[k] = true;
            }
        } else {
            out._.push(a);
        }
    }
    return out;
}

function dataDir(cli) {
    return path.resolve(cli['data-dir'] || path.join(REPO, 'data'));
}

function fail(msg) {
    console.error('error: ' + msg);
    process.exit(1);
}

async function cmdOnboard(cli) {
    const dir = dataDir(cli);
    fs.mkdirSync(dir, { recursive: true });
    const secretFile = path.join(dir, 'sync-secret.txt');
    let secret = process.env.SYNC_SECRET || '';
    if (!secret && fs.existsSync(secretFile)) secret = fs.readFileSync(secretFile, 'utf8').trim();
    if (!secret) {
        secret = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(secretFile, secret + '\n', { mode: 0o600 });
        console.log('generated: ' + secretFile);
    } else {
        console.log('using existing secret');
    }
    const port = process.env.SYNC_PORT || '3001';
    console.log('next:');
    console.log(`  SYNC_SECRET=$(cat ${secretFile}) SYNC_PORT=${port} node server/sync-server.mjs`);
    console.log(`  node cli/superagents.mjs doctor --url http://localhost:${port}`);
}

function checkFile(f) {
    return new Promise((resolve) => {
        execFile(process.execPath, ['--check', path.join(REPO, f)], (err) => {
            resolve({ file: f, ok: !err });
        });
    });
}

async function cmdDoctor(cli) {
    let ok = true;
    const major = parseInt(process.versions.node.split('.')[0], 10);
    const nodeOk = major >= 22;
    console.log((nodeOk ? 'ok   ' : 'FAIL ') + 'node ' + process.versions.node + ' (>=22)');
    ok = ok && nodeOk;
    for (const c of await Promise.all(SERVER_FILES.map(checkFile))) {
        console.log((c.ok ? 'ok   ' : 'FAIL ') + c.file + ' syntax');
        ok = ok && c.ok;
    }
    try {
        const dir = dataDir(cli);
        fs.mkdirSync(dir, { recursive: true });
        fs.accessSync(dir, fs.constants.W_OK);
        console.log('ok   data dir writable ' + dir);
    } catch {
        console.log('FAIL data dir not writable');
        ok = false;
    }
    if (cli.url) {
        try {
            const r = await fetch(String(cli.url).replace(/\/$/, '') + '/api/health');
            const live = r.status === 200;
            console.log((live ? 'ok   ' : 'FAIL ') + 'server live ' + cli.url);
            ok = ok && live;
        } catch (e) {
            console.log('FAIL server live ' + cli.url + ' (' + e.message + ')');
            ok = false;
        }
    }
    if (!ok) process.exit(1);
    console.log('doctor: all green');
}

async function cmdBackup(cli) {
    const from = dataDir(cli);
    if (!cli.out) fail('db-backup --out <dir> is required');
    const out = path.resolve(cli.out);
    fs.mkdirSync(out, { recursive: true });
    const copied = [];
    if (fs.existsSync(from)) {
        for (const f of fs.readdirSync(from)) {
            if (!/\.json$|\.bin$/.test(f)) continue;
            fs.copyFileSync(path.join(from, f), path.join(out, f));
            copied.push(f);
        }
    }
    fs.writeFileSync(path.join(out, 'backup.json'), JSON.stringify({ at: Date.now(), files: copied }, null, 2));
    console.log(`backup: ${copied.length} files -> ${out}`);
}

async function api(url, secret, p, opts = {}) {
    const r = await fetch(url + p, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secret}`,
            Origin: 'http://localhost:5173',
            ...(opts.headers || {}),
        },
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
}

async function cmdRun(cli) {
    const url = String(cli.url || fail('run --url is required')).replace(/\/$/, '');
    const secret = String(cli.secret || process.env.SYNC_SECRET || fail('run --secret is required'));
    const company = String(cli.company || fail('run --company is required'));
    const trigger = String(cli.trigger || 'manual');
    const enq = await api(url, secret, '/api/wakeups', {
        method: 'POST',
        body: JSON.stringify({ companyId: company, agentId: cli.agent || '', trigger, ref: cli.ref || 'cli' }),
    });
    if (enq.status !== 201) fail(`enqueue -> ${enq.status} ${JSON.stringify(enq.body).slice(0, 200)}`);
    const wid = enq.body.wakeup.id;
    console.log('enqueued: ' + wid);
    if (!cli.watch) return;
    const deadline = Date.now() + 90_000;
    for (;;) {
        await new Promise((r) => setTimeout(r, 2000));
        const cur = await api(url, secret, '/api/wakeups');
        const item = (cur.body.wakeups || []).find((w) => w.id === wid);
        if (!item) fail('wakeup lost');
        console.log(`... ${item.status}`);
        if (item.status !== 'pending') {
            console.log(`${item.status}: ${item.result || ''}`);
            if (item.status !== 'done') process.exit(2);
            return;
        }
        if (Date.now() > deadline) fail('watch timeout 90s');
    }
}

async function cmdConfigure(cli) {
    const sub = cli._[0];
    if (sub !== 'budget') fail('usage: configure budget --url --secret --company <id> --cents <n|null>');
    const url = String(cli.url || fail('configure --url is required')).replace(/\/$/, '');
    const secret = String(cli.secret || process.env.SYNC_SECRET || fail('--secret is required'));
    const company = String(cli.company || fail('--company is required'));
    const cents = cli.cents === 'null' ? null : Number(cli.cents);
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) fail('--cents must be >= 0 or null');
    const r = await api(url, secret, `/api/companies/${company}/budget`, {
        method: 'PUT',
        body: JSON.stringify({ monthlyBudgetCents: cents }),
    });
    if (r.status !== 200) fail(`budget -> ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    console.log('budget: ' + JSON.stringify(r.body.budget));
}

function usage() {
    console.log(`superagents — CLI поверх headless API
  onboard [--data-dir D]                 сгенерировать secret, показать запуск
  doctor [--data-dir D] [--url U]         node/синтаксис/data/живость сервера
  db-backup --out DIR [--data-dir D]      скопировать data/*.json|*.bin
  run --url U --secret S --company C [--agent A] [--trigger T] [--watch]
  configure budget --url U --secret S --company C --cents N|null`);
}

async function main() {
    const [cmd, ...rest] = process.argv.slice(2);
    const cli = args(rest);
    if (cmd === 'onboard') return cmdOnboard(cli);
    if (cmd === 'doctor') return cmdDoctor(cli);
    if (cmd === 'db-backup') return cmdBackup(cli);
    if (cmd === 'run') return cmdRun(cli);
    if (cmd === 'configure') return cmdConfigure(cli);
    usage();
    process.exit(cmd ? 2 : 0);
}

main().catch((e) => fail(e.message));
