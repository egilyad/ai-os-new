import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    listCompanies,
    getCompany,
    createCompany,
    heartbeatCompany,
    listWakeups,
    enqueueWakeup,
    listAgents,
    addAgent,
    getEscalationChain,
    setCompanyBudget,
    recordCost,
    listCosts,
    budgetStatus,
    isOverBudget,
    listIssues,
    getIssue,
    createIssue,
    getIssueTree,
    checkoutIssue,
    setIssueStatus,
    listRuns,
    getRun,
    startRun,
    appendRunEvent,
    finishRun,
    requestApproval,
    listApprovals,
    getApproval,
    commentApproval,
    decideApproval,
    listActivity,
    logActivity,
    exportCompany,
    importCompany,
} from './company-store.mjs';
import { listAdapters, getAdapter, parseStdout } from './adapters.mjs';
import { startHeartbeatLoop } from './heartbeat-loop.mjs';

const PORT = parseInt(process.env.SYNC_PORT || '3001', 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'shared-db.bin');

// BLD-10: SYNC_SECRET is required — fail fast at startup. No fallback to empty string.
// In Docker, pass via: docker run -e SYNC_SECRET=<strong-random-token>
const AUTH_TOKEN = process.env.SYNC_SECRET;
if (!AUTH_TOKEN) {
    console.error('[sync-server] FATAL: SYNC_SECRET environment variable is required.');
    console.error('[sync-server] Set via: SYNC_SECRET=<your-secret> node sync-server.mjs');
    process.exit(1);
}
// Expose AUTH_TOKEN for use by verifyClient (avoids shadowing duplicate declaration)
const SYNC_SECRET = AUTH_TOKEN;

const ALLOWED_ORIGINS = (process.env.SYNC_ORIGINS || 'http://localhost:5173').split(',');
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateLimits = new Map();

function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
}

function getClientIP(req) {
    // M-1: prefer x-forwarded-for behind nginx; parse leftmost IP from chain
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const leftmost = forwarded.split(',')[0].trim();
        if (leftmost) return leftmost;
    }
    return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimits.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimits.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    return true;
}

function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        // Compare against a same-length buffer to prevent length leak
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

function hasAuth(req) {
    const header = req.headers['authorization'] || '';
    if (!header.startsWith('Bearer ')) return false;
    return timingSafeEqual(header.slice(7), AUTH_TOKEN);
}

function writeJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// M1.1: SSE live-events clients (additive, WS db_changed untouched)
const sseClients = new Set();
function broadcastLive(type, payload) {
    const msg = JSON.stringify({ type, timestamp: Date.now(), ...payload });
    for (const client of wssClientsSnapshot()) {
        try {
            if (client.readyState === 1) client.send(msg);
        } catch {
            /* ignore */
        }
    }
    for (const res of sseClients) {
        try {
            res.write(`data: ${msg}\n\n`);
        } catch {
            /* ignore */
        }
    }
}
// wss defined below — snapshot helper guards TDZ via function hoisting + try
function wssClientsSnapshot() {
    try {
        return typeof wss !== 'undefined' ? wss.clients : [];
    } catch {
        return [];
    }
}

function readJsonBody(req, limitBytes = 256 * 1024) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (c) => {
            size += c.length;
            if (size > limitBytes) {
                reject(new Error('Payload too large'));
                req.destroy();
                return;
            }
            chunks.push(c);
        });
        req.on('end', () => {
            try {
                if (chunks.length === 0) return resolve({});
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Serialize writes to the file
let writeQueue = Promise.resolve();

// H-14: Track WebSocket connection rate per IP (separate from HTTP rate limit bucket)
const WS_RATE_LIMIT_WINDOW_MS = 60_000;
const WS_RATE_LIMIT_MAX_CONNECTIONS = 10;
const wsRateLimits = new Map();

function checkWsRateLimit(ip) {
    const now = Date.now();
    const entry = wsRateLimits.get(ip);
    if (!entry || now - entry.windowStart > WS_RATE_LIMIT_WINDOW_MS) {
        wsRateLimits.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > WS_RATE_LIMIT_MAX_CONNECTIONS) {
        return false;
    }
    return true;
}

const server = http.createServer(async (req, res) => {
    const origin = req.headers['origin'] || '';
    const ip = getClientIP(req);
    // Rate limit
    if (!checkRateLimit(ip)) {
        res.writeHead(429);
        res.end('Too many requests');
        return;
    }
    // Require Origin for mutating requests (PUT, POST, DELETE)
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        if (!origin) {
            res.writeHead(403);
            res.end('Origin header required');
            return;
        }
        if (!isAllowedOrigin(origin)) {
            res.writeHead(403);
            res.end('Origin not allowed');
            return;
        }
    } else if (origin && !isAllowedOrigin(origin)) {
        res.writeHead(403);
        res.end('Origin not allowed');
        return;
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/api/health') {
        writeJson(res, 200, { status: 'ok', timestamp: Date.now() });
        return;
    }

    if (req.url === '/api/db') {
        if (!hasAuth(req)) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
        }

        if (req.method === 'GET') {
            try {
                if (fs.existsSync(DB_FILE)) {
                    const data = fs.readFileSync(DB_FILE);
                    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
                    res.end(data);
                } else {
                    res.writeHead(404);
                    res.end('No DB yet');
                }
            } catch (err) {
                // C-8: Never expose raw Error objects — sanitize before sending to client
                console.error('[sync-server] GET /db error:', err);
                res.writeHead(500);
                res.end('Internal server error');
            }
            return;
        }

        if (req.method === 'PUT') {
            if (req.headers['content-type'] !== 'application/octet-stream') {
                writeJson(res, 400, { error: 'Content-Type must be application/octet-stream' });
                return;
            }
            let contentLength = 0;
            req.on('data', (chunk) => {
                contentLength += chunk.length;
                if (contentLength > 50 * 1024 * 1024) {
                    req.destroy(new Error('Payload too large'));
                }
            });
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
                writeQueue = writeQueue.then(() => {
                    try {
                        const tmpFile = DB_FILE + '.tmp.' + Date.now();
                        fs.writeFileSync(tmpFile, Buffer.concat(chunks));
                        fs.renameSync(tmpFile, DB_FILE);
                        const msg = JSON.stringify({ type: 'db_changed', timestamp: Date.now() });
                        for (const client of wss.clients) {
                            if (client.readyState === 1) {
                                client.send(msg);
                            }
                        }
                        writeJson(res, 200, { status: 'ok' });
                    } catch (err) {
                        // C-8: Never expose raw Error objects to client
                        console.error('[sync-server] PUT /db error:', err);
                        writeJson(res, 500, { error: 'Internal server error' });
                    }
                });
            });
            return;
        }
    }

    // REST API: Debate-as-a-Service
    if (req.method === 'GET' && req.url === '/api/debates') {
        writeJson(res, 200, { debates: [], message: 'Debate-as-a-Service API enabled' });
        return;
    }

    // M1.1: Company Gateway (additive — старые /api/db и /api/health не тронуты)
    try {
        const parsed = new URL(req.url || '/', 'http://localhost');
        const pathname = parsed.pathname;

        if (req.method === 'GET' && pathname === '/api/live-events') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            });
            res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
            sseClients.add(res);
            req.on('close', () => sseClients.delete(res));
            return;
        }

        if (pathname === '/api/companies' && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (req.method === 'GET') {
                writeJson(res, 200, { companies: listCompanies() });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const company = createCompany(body);
                broadcastLive('company_created', { companyId: company.id });
                writeJson(res, 201, { company });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const companyHeartbeat = pathname.match(/^\/api\/companies\/([^/]+)\/heartbeat$/);
        if (companyHeartbeat && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                // M7.1 hard-stop: при исчерпанном бюджете heartbeat не исполняется.
                const gate = isOverBudget(companyHeartbeat[1], body.agentId || null);
                if (gate.over) {
                    writeJson(res, 402, { error: 'budget exhausted', scope: gate.scope, budget: gate.status });
                    return;
                }
                const company = heartbeatCompany(companyHeartbeat[1], body.note || '');
                if (!company) {
                    writeJson(res, 404, { error: 'Company not found' });
                    return;
                }
                broadcastLive('company_heartbeat', {
                    companyId: company.id,
                    heartbeats: company.heartbeats,
                });
                writeJson(res, 200, { company });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const companyOne = pathname.match(/^\/api\/companies\/([^/]+)$/);
        if (companyOne && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const company = getCompany(companyOne[1]);
            if (!company) {
                writeJson(res, 404, { error: 'Company not found' });
                return;
            }
            writeJson(res, 200, { company });
            return;
        }

        if (pathname === '/api/wakeups' && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (req.method === 'GET') {
                const pendingOnly = parsed.searchParams.get('pending') === '1';
                writeJson(res, 200, { wakeups: listWakeups(pendingOnly) });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const wakeup = enqueueWakeup(body);
                broadcastLive('wakeup_enqueued', { wakeupId: wakeup.id, trigger: wakeup.trigger });
                writeJson(res, 201, { wakeup });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        // M3.1: org chart — агенты с managerId + цепочка эскалации
        const agentsRoute = pathname.match(/^\/api\/companies\/([^/]+)\/agents$/);
        if (agentsRoute && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (req.method === 'GET') {
                const agents = listAgents(agentsRoute[1]);
                if (!agents) {
                    writeJson(res, 404, { error: 'Company not found' });
                    return;
                }
                writeJson(res, 200, { agents });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const agent = addAgent(agentsRoute[1], body);
                if (!agent) {
                    writeJson(res, 404, { error: 'Company not found' });
                    return;
                }
                broadcastLive('agent_hired', { companyId: agentsRoute[1], agentId: agent.id });
                writeJson(res, 201, { agent });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const chainRoute = pathname.match(/^\/api\/companies\/([^/]+)\/agents\/([^/]+)\/chain$/);
        if (chainRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const chain = getEscalationChain(chainRoute[1], chainRoute[2]);
            if (!chain) {
                writeJson(res, 404, { error: 'Company or agent not found' });
                return;
            }
            writeJson(res, 200, { chain });
            return;
        }

        // M7.1: cost ledger + бюджеты
        const costsRoute = pathname.match(/^\/api\/companies\/([^/]+)\/costs$/);
        if (costsRoute && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (req.method === 'GET') {
                if (!getCompany(costsRoute[1])) {
                    writeJson(res, 404, { error: 'Company not found' });
                    return;
                }
                writeJson(res, 200, {
                    costs: listCosts(costsRoute[1], {
                        agentId: parsed.searchParams.get('agentId') || undefined,
                        limit: parseInt(parsed.searchParams.get('limit') || '100', 10),
                    }),
                });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const ev = recordCost({ ...body, companyId: costsRoute[1] });
                broadcastLive('cost_recorded', {
                    companyId: costsRoute[1],
                    agentId: ev.agentId,
                    cents: ev.cents,
                });
                writeJson(res, 201, { cost: ev });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const budgetRoute = pathname.match(/^\/api\/companies\/([^/]+)\/budget$/);
        if (budgetRoute && (req.method === 'GET' || req.method === 'PUT')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (req.method === 'GET') {
                const st = budgetStatus(
                    budgetRoute[1],
                    parsed.searchParams.get('agentId') || null,
                );
                if (!st && !getCompany(budgetRoute[1])) {
                    writeJson(res, 404, { error: 'Company or agent not found' });
                    return;
                }
                if (!st) {
                    writeJson(res, 404, { error: 'Company or agent not found' });
                    return;
                }
                writeJson(res, 200, { budget: st });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const org = setCompanyBudget(budgetRoute[1], body.monthlyBudgetCents ?? null);
                if (!org) {
                    writeJson(res, 404, { error: 'Company not found' });
                    return;
                }
                broadcastLive('budget_updated', {
                    companyId: budgetRoute[1],
                    monthlyBudgetCents: org.monthlyBudgetCents,
                });
                writeJson(res, 200, {
                    company: org,
                    budget: budgetStatus(budgetRoute[1], null),
                });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        // M4.1: issues — иерархия + atomic checkout
        const issuesRoute = pathname.match(/^\/api\/companies\/([^/]+)\/issues$/);
        if (issuesRoute && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (!getCompany(issuesRoute[1])) {
                writeJson(res, 404, { error: 'Company not found' });
                return;
            }
            if (req.method === 'GET') {
                writeJson(res, 200, {
                    issues: listIssues(issuesRoute[1], {
                        status: parsed.searchParams.get('status') || undefined,
                        assigneeAgentId: parsed.searchParams.get('assignee') || undefined,
                    }),
                });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const issue = createIssue(issuesRoute[1], body);
                broadcastLive('issue_created', { companyId: issuesRoute[1], issueId: issue.id });
                writeJson(res, 201, { issue });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const treeRoute = pathname.match(/^\/api\/companies\/([^/]+)\/issues\/([^/]+)\/tree$/);
        if (treeRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const tree = getIssueTree(treeRoute[1], treeRoute[2]);
            if (!tree) {
                writeJson(res, 404, { error: 'Company or issue not found' });
                return;
            }
            writeJson(res, 200, { tree });
            return;
        }

        const checkoutRoute = pathname.match(/^\/api\/companies\/([^/]+)\/issues\/([^/]+)\/checkout$/);
        if (checkoutRoute && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const issue = checkoutIssue(checkoutRoute[1], checkoutRoute[2], body.agentId);
                if (!issue) {
                    writeJson(res, 404, { error: 'Company or issue not found' });
                    return;
                }
                broadcastLive('issue_checkout', {
                    companyId: checkoutRoute[1],
                    issueId: issue.id,
                    agentId: issue.assigneeAgentId,
                });
                writeJson(res, 200, { issue });
            } catch (e) {
                const code = e instanceof Error ? e.code : undefined;
                if (code === 'CONFLICT') {
                    writeJson(res, 409, { error: e.message });
                    return;
                }
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const issueStatusRoute = pathname.match(/^\/api\/companies\/([^/]+)\/issues\/([^/]+)\/status$/);
        if (issueStatusRoute && (req.method === 'POST' || req.method === 'PUT')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const issue = setIssueStatus(
                    issueStatusRoute[1],
                    issueStatusRoute[2],
                    body.status,
                    body.agentId || null,
                    body.gate !== undefined ? body.gate : null,
                );
                if (!issue) {
                    writeJson(res, 404, { error: 'Company or issue not found' });
                    return;
                }
                broadcastLive('issue_status', {
                    companyId: issueStatusRoute[1],
                    issueId: issue.id,
                    status: issue.status,
                });
                writeJson(res, 200, { issue, gate: issue.lastGate || null });
            } catch (e) {
                const code = e instanceof Error ? e.code : undefined;
                if (code === 'CONFLICT') {
                    writeJson(res, 409, { error: e.message });
                    return;
                }
                if (code === 'ESCALATE') {
                    // 422 + цепочка эскалации исполнителя для маршрутизации менеджеру.
                    const cur = getIssue(issueStatusRoute[1], issueStatusRoute[2]);
                    const chain = cur?.assigneeAgentId
                        ? getEscalationChain(issueStatusRoute[1], cur.assigneeAgentId)
                        : null;
                    logActivity(issueStatusRoute[1], 'gate_escalate', `${issueStatusRoute[2]} conf=${e.gate?.confidence}`);
                    writeJson(res, 422, {
                        error: e.message,
                        gate: e.gate || null,
                        chain: (chain || []).map((a) => ({ id: a.id, name: a.name })),
                    });
                    return;
                }
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const issueOneRoute = pathname.match(/^\/api\/companies\/([^/]+)\/issues\/([^/]+)$/);
        if (issueOneRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const issue = getIssue(issueOneRoute[1], issueOneRoute[2]);
            if (!issue) {
                writeJson(res, 404, { error: 'Company or issue not found' });
                return;
            }
            writeJson(res, 200, { issue });
            return;
        }

        // M5.1: runs — трейс исполнения heartbeat-протокола
        const runsRoute = pathname.match(/^\/api\/companies\/([^/]+)\/runs$/);
        if (runsRoute && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (!getCompany(runsRoute[1])) {
                writeJson(res, 404, { error: 'Company not found' });
                return;
            }
            if (req.method === 'GET') {
                writeJson(res, 200, {
                    runs: listRuns(runsRoute[1], {
                        status: parsed.searchParams.get('status') || undefined,
                        limit: parseInt(parsed.searchParams.get('limit') || '50', 10),
                    }),
                });
                return;
            }
            // POST: открыть run для внешнего рантайма (M2). Триггеры те же 5.
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            const trigger = body.trigger || 'manual';
            if (!['schedule', 'assignment', 'comment', 'manual', 'approval'].includes(trigger)) {
                writeJson(res, 400, { error: 'trigger must be schedule|assignment|comment|manual|approval' });
                return;
            }
            if (body.agentId) {
                const agents = listAgents(runsRoute[1]) || [];
                if (!agents.some((a) => a.id === String(body.agentId))) {
                    writeJson(res, 400, { error: 'agent not found in this company' });
                    return;
                }
            }
            // Фаза 0: hard-stop распространяется на research/debate-раны.
            try {
                const gate = isOverBudget(runsRoute[1], body.agentId || null);
                if (gate.over) {
                    writeJson(res, 402, { error: 'budget exhausted', scope: gate.scope, budget: gate.status });
                    return;
                }
            } catch {
                /* gate best-effort */
            }
            try {
                const run = startRun({
                    companyId: runsRoute[1],
                    agentId: body.agentId || null,
                    trigger,
                    ref: body.ref || null,
                    wakeupId: null,
                });
                broadcastLive('run_started', { companyId: runsRoute[1], runId: run.id });
                writeJson(res, 201, { run });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const runOneRoute = pathname.match(/^\/api\/runs\/([^/]+)$/);
        if (runOneRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const run = getRun(runOneRoute[1]);
            if (!run) {
                writeJson(res, 404, { error: 'Run not found' });
                return;
            }
            writeJson(res, 200, { run });
            return;
        }

        // M6.1: governance — approvals + activity
        const approvalsRoute = pathname.match(/^\/api\/companies\/([^/]+)\/approvals$/);
        if (approvalsRoute && (req.method === 'GET' || req.method === 'POST')) {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (!getCompany(approvalsRoute[1])) {
                writeJson(res, 404, { error: 'Company not found' });
                return;
            }
            if (req.method === 'GET') {
                writeJson(res, 200, {
                    approvals: listApprovals(approvalsRoute[1], {
                        status: parsed.searchParams.get('status') || undefined,
                    }),
                });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const approval = requestApproval(approvalsRoute[1], body);
                broadcastLive('approval_requested', {
                    companyId: approvalsRoute[1],
                    approvalId: approval.id,
                    kind: approval.kind,
                });
                writeJson(res, 201, { approval });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const approvalOneRoute = pathname.match(/^\/api\/approvals\/([^/]+)$/);
        if (approvalOneRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const approval = getApproval(approvalOneRoute[1]);
            if (!approval) {
                writeJson(res, 404, { error: 'Approval not found' });
                return;
            }
            writeJson(res, 200, { approval });
            return;
        }

        const approvalCommentRoute = pathname.match(/^\/api\/approvals\/([^/]+)\/comments$/);
        if (approvalCommentRoute && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const approval = commentApproval(approvalCommentRoute[1], body);
                if (!approval) {
                    writeJson(res, 404, { error: 'Approval not found' });
                    return;
                }
                writeJson(res, 201, { approval });
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const approvalDecideRoute = pathname.match(/^\/api\/approvals\/([^/]+)\/decide$/);
        if (approvalDecideRoute && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const approval = decideApproval(approvalDecideRoute[1], body);
                if (!approval) {
                    writeJson(res, 404, { error: 'Approval not found' });
                    return;
                }
                broadcastLive('approval_decided', {
                    companyId: approval.companyId,
                    approvalId: approval.id,
                    status: approval.status,
                });
                writeJson(res, 200, { approval });
            } catch (e) {
                const code = e instanceof Error ? e.code : undefined;
                if (code === 'SETTLED') {
                    writeJson(res, 409, { error: e.message });
                    return;
                }
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const activityRoute = pathname.match(/^\/api\/companies\/([^/]+)\/activity$/);
        if (activityRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            if (!getCompany(activityRoute[1])) {
                writeJson(res, 404, { error: 'Company not found' });
                return;
            }
            writeJson(res, 200, {
                activity: listActivity(activityRoute[1], {
                    limit: parseInt(parsed.searchParams.get('limit') || '100', 10),
                }),
            });
            return;
        }

        // M8.1: portability — export/import манифеста
        const exportRoute = pathname.match(/^\/api\/companies\/([^/]+)\/export$/);
        if (exportRoute && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const manifest = exportCompany(exportRoute[1]);
            if (!manifest) {
                writeJson(res, 404, { error: 'Company not found' });
                return;
            }
            broadcastLive('company_exported', { companyId: exportRoute[1] });
            writeJson(res, 200, { manifest });
            return;
        }

        if (pathname === '/api/companies/import' && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const result = importCompany(body.manifest, { collision: body.collision || 'rename' });
                if (!result.skipped) {
                    broadcastLive('company_imported', { companyId: result.company.id });
                    writeJson(res, 201, result);
                } else {
                    writeJson(res, 200, result);
                }
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        // M2.1: Adapter SDK — внешние рантаймы поверх run-трейса
        if (pathname === '/api/adapters' && req.method === 'GET') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            writeJson(res, 200, { adapters: listAdapters() });
            return;
        }

        const adapterTestRoute = pathname.match(/^\/api\/adapters\/([^/]+)\/test$/);
        if (adapterTestRoute && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const adapter = getAdapter(adapterTestRoute[1]);
            if (!adapter) {
                writeJson(res, 404, { error: 'Adapter not found' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            try {
                const result = await adapter.testEnvironment(body.config);
                writeJson(res, 200, result);
            } catch (e) {
                writeJson(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
            }
            return;
        }

        const executeRoute = pathname.match(/^\/api\/runs\/([^/]+)\/execute$/);
        if (executeRoute && req.method === 'POST') {
            if (!hasAuth(req)) {
                writeJson(res, 401, { error: 'Unauthorized' });
                return;
            }
            const body = await readJsonBody(req).catch(() => null);
            if (!body) {
                writeJson(res, 400, { error: 'Invalid JSON' });
                return;
            }
            const run = getRun(executeRoute[1]);
            if (!run) {
                writeJson(res, 404, { error: 'Run not found' });
                return;
            }
            if (run.status !== 'running') {
                writeJson(res, 400, { error: `run is ${run.status}, execute needs running run` });
                return;
            }
            const adapter = getAdapter(body.adapter);
            if (!adapter) {
                writeJson(res, 404, { error: 'Adapter not found' });
                return;
            }
            if (!adapter.enabled()) {
                writeJson(res, 403, {
                    error: `adapter '${adapter.typeKey}' is disabled`,
                });
                return;
            }
            const config = body.config || {};
            const check = adapter.validateConfig ? adapter.validateConfig(config) : { ok: true };
            if (!check.ok) {
                writeJson(res, 400, { error: check.error || 'invalid config' });
                return;
            }
            try {
                const result = await adapter.execute({ input: body.input ?? {}, run }, config);
                const transcript = parseStdout(result.stdout || '');
                appendRunEvent(run.id, 'work', `adapter=${adapter.typeKey} lines=${transcript.length}`);
                finishRun(run.id, 'done', `adapter=${adapter.typeKey} ok`);
                broadcastLive('run_executed', { runId: run.id, adapter: adapter.typeKey });
                writeJson(res, 200, {
                    stdout: result.stdout || '',
                    transcript,
                    usage: result.usage || null,
                });
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                try {
                    finishRun(run.id, 'error', msg.slice(0, 500));
                } catch {
                    /* ignore */
                }
                const code = e instanceof Error ? e.code : undefined;
                writeJson(res, code === 'ADAPTER' ? 502 : 500, { error: msg });
            }
            return;
        }
    } catch (err) {
        console.error('[sync-server] M1.1 gateway error:', err);
        writeJson(res, 500, { error: 'Internal server error' });
        return;
    }

    writeJson(res, 404, { error: 'Not found' });
});

// SYNC_SECRET is already validated at startup (above) — guard is unreachable.
const wss = new WebSocketServer({
    server,
    verifyClient: (info, callback) => {
        // H-14: Rate limit WebSocket connections per IP
        const wsIp = getClientIP(info.req);
        if (!checkWsRateLimit(wsIp)) {
            callback(false, 429, 'Too many connections');
            return;
        }
        // L-9: Check origin BEFORE token check — never reveal token validity to unauthorized origins
        const wsOrigin = info.origin || info.req.headers['origin'] || '';
        if (wsOrigin && !isAllowedOrigin(wsOrigin)) {
            callback(false, 403, 'Origin not allowed');
            return;
        }

        // SECURITY FIX: Check Sec-WebSocket-Protocol header first (preferred), then Authorization, then query param (deprecated fallback)
        // Sec-WebSocket-Protocol: first value is subprotocol name, second (if any) is the token
        const protocols = info.req.headers['sec-websocket-protocol'];
        if (protocols) {
            const parts = protocols.split(',').map((p) => p.trim());
            // Format: "sync-token,<token>" or just "sync-token" without token
            if (parts[0] === 'sync-token' && parts[1]) {
                if (timingSafeEqual(parts[1], SYNC_SECRET)) {
                    callback(true);
                    return;
                }
                callback(false, 4001, 'Invalid token');
                return;
            }
            // If no token provided, reject (no anonymous connections)
            if (parts[0] === 'sync-token' && !parts[1]) {
                callback(false, 4001, 'Authentication required');
                return;
            }
        }
        // Fallback: Authorization header for HTTP API clients
        const auth = info.req.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) {
            if (timingSafeEqual(auth.slice(7), SYNC_SECRET)) {
                callback(true);
                return;
            }
            callback(false, 4001, 'Invalid token');
            return;
        }
        // P1-16: ?token= query param removed — use Sec-WebSocket-Protocol or Authorization header only
        callback(false, 401, 'Unauthorized');
    },
});

wss.on('connection', (ws) => {
    const clientIp = ws._socket?.remoteAddress || 'unknown';
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
    const id = `${clientIp}-${Date.now()}`;
    ws.on('close', (code, reason) => {
        console.log(`[sync-server] WS disconnect: ${id} code=${code} reason=${reason || 'none'}`);
    });
    ws.on('error', (err) => {
        console.error(`[sync-server] WS error: ${id} ${err.message}`);
    });
});

// Clean up disconnected clients every 30s
setInterval(() => {
    for (const client of wss.clients) {
        if (client.readyState !== 1) {
            try {
                client.terminate();
            } catch {
                /* ignore */
            }
        }
    }
}, 30_000);

server.listen(PORT, () => {
    console.log(`[SyncServer] running on http://localhost:${PORT}`);
    console.log(`[SyncServer] storing DB at ${DB_FILE}`);
    // M1.2: heartbeat-loop — обрабатывает pending wakeups в heartbeat'ы.
    // Отключается через HEARTBEAT_LOOP=0. Без pending-очереди — no-op.
    if (process.env.HEARTBEAT_LOOP !== '0') {
        startHeartbeatLoop({
            onEvent: (e) => broadcastLive(e.type, e),
        });
        console.log('[SyncServer] heartbeat-loop enabled');
    } else {
        console.log('[SyncServer] heartbeat-loop disabled (HEARTBEAT_LOOP=0)');
    }
});
