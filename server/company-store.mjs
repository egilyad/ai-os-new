import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const WAKEUPS_FILE = path.join(DATA_DIR, 'wakeups.json');
const COSTS_FILE = path.join(DATA_DIR, 'costs.json');
const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');
const RUNS_FILE = path.join(DATA_DIR, 'heartbeat-runs.json');
const APPROVALS_FILE = path.join(DATA_DIR, 'approvals.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const MAX_COST_EVENTS = 20000;
const MAX_ISSUES = 20000;
const MAX_RUNS = 5000;
const MAX_APPROVALS = 5000;
const MAX_ACTIVITY = 10000;

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
    try {
        if (!fs.existsSync(file)) return fallback;
        const raw = fs.readFileSync(file, 'utf8');
        if (!raw.trim()) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function writeJsonAtomic(file, data) {
    ensureDataDir();
    const tmp = `${file}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

function genId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export function listCompanies() {
    const db = readJson(COMPANIES_FILE, { companies: [] });
    return Array.isArray(db.companies) ? db.companies : [];
}

function saveCompanies(companies) {
    writeJsonAtomic(COMPANIES_FILE, { companies, updatedAt: Date.now() });
}

export function getCompany(id) {
    return listCompanies().find((c) => c.id === id) || null;
}

export function createCompany({ name, mission, monthlyBudgetCents }) {
    const cleanName = String(name || '').slice(0, 200).trim();
    if (!cleanName) throw new Error('name is required');
    const cleanMission = String(mission || '').slice(0, 1000);
    let budget = monthlyBudgetCents ?? null;
    if (budget !== null) {
        budget = Number(budget);
        if (!Number.isFinite(budget) || budget < 0) throw new Error('monthlyBudgetCents must be >= 0');
    }
    const t = Date.now();
    const company = {
        id: genId('org'),
        name: cleanName,
        mission: cleanMission,
        members: [],
        agents: [],
        monthlyBudgetCents: budget,
        ledger: [`Chartered: ${cleanMission.slice(0, 200)}`],
        heartbeats: 0,
        status: 'active',
        createdAt: t,
        updatedAt: t,
    };
    const all = listCompanies();
    all.push(company);
    saveCompanies(all);
    logActivity(company.id, 'company_created', cleanName);
    return company;
}

const AGENT_STATUS = ['active', 'idle', 'running', 'error', 'paused', 'terminated'];

export function listAgents(companyId) {
    const c = getCompany(companyId);
    return c ? (Array.isArray(c.agents) ? c.agents : []) : null;
}

function createsCycle(agents, agentId, managerId) {
    let cur = managerId;
    const seen = new Set([agentId]);
    while (cur) {
        if (seen.has(cur)) return true;
        seen.add(cur);
        const mgr = agents.find((a) => a.id === cur);
        if (!mgr) return false;
        cur = mgr.managerId || null;
    }
    return false;
}

export function addAgent(companyId, { name, title, managerId, monthlyBudgetCents, status }) {
    const all = listCompanies();
    const org = all.find((c) => c.id === companyId);
    if (!org) return null;
    if (org.status !== 'active') throw new Error(`Org ${companyId} is ${org.status}`);
    if (!Array.isArray(org.agents)) org.agents = [];
    const cleanName = String(name || '').slice(0, 200).trim();
    if (!cleanName) throw new Error('agent name is required');
    const cleanManager = managerId ? String(managerId) : null;
    if (cleanManager && !org.agents.some((a) => a.id === cleanManager)) {
        throw new Error('manager not found in this company');
    }
    const st = status || 'active';
    if (!AGENT_STATUS.includes(st)) throw new Error(`status must be one of ${AGENT_STATUS.join(',')}`);
    let budget = monthlyBudgetCents ?? null;
    if (budget !== null) {
        budget = Number(budget);
        if (!Number.isFinite(budget) || budget < 0) throw new Error('monthlyBudgetCents must be >= 0');
    }
    const agent = {
        id: genId('agent'),
        name: cleanName,
        title: String(title || '').slice(0, 200),
        managerId: cleanManager,
        monthlyBudgetCents: budget,
        status: st,
        createdAt: Date.now(),
    };
    if (createsCycle(org.agents, agent.id, agent.managerId)) {
        throw new Error('manager chain would create a cycle');
    }
    org.agents.push(agent);
    org.ledger.push(`Hired: ${agent.name}${agent.title ? ` (${agent.title})` : ''}`);
    if (org.ledger.length > 1000) org.ledger.splice(0, org.ledger.length - 1000);
    saveCompanies(all);
    logActivity(companyId, 'agent_hired', `${agent.name} direct`);
    return agent;
}

export function getEscalationChain(companyId, agentId) {
    const c = getCompany(companyId);
    if (!c) return null;
    const agents = Array.isArray(c.agents) ? c.agents : [];
    const byId = new Map(agents.map((a) => [a.id, a]));
    const start = byId.get(agentId);
    if (!start) return null;
    const chain = [start];
    const seen = new Set([start.id]);
    let cur = start.managerId || null;
    while (cur) {
        if (seen.has(cur)) break;
        seen.add(cur);
        const mgr = byId.get(cur);
        if (!mgr) break;
        chain.push(mgr);
        cur = mgr.managerId || null;
    }
    return chain;
}

export function heartbeatCompany(id, note) {
    const all = listCompanies();
    const org = all.find((c) => c.id === id);
    if (!org) return null;
    if (org.status !== 'active') throw new Error(`Org ${id} is ${org.status}`);
    org.heartbeats += 1;
    org.ledger.push(`#${org.heartbeats}: ${String(note || '').slice(0, 300)}`);
    if (org.ledger.length > 1000) org.ledger.splice(0, org.ledger.length - 1000);
    org.updatedAt = Date.now();
    saveCompanies(all);
    return org;
}

export function listWakeups(pendingOnly = false) {
    const db = readJson(WAKEUPS_FILE, { wakeups: [] });
    const arr = Array.isArray(db.wakeups) ? db.wakeups : [];
    return pendingOnly ? arr.filter((w) => w.status === 'pending') : arr;
}

function saveWakeups(wakeups) {
    writeJsonAtomic(WAKEUPS_FILE, { wakeups, updatedAt: Date.now() });
}

export function enqueueWakeup({ companyId, agentId, trigger, ref }) {
    const allowed = ['schedule', 'assignment', 'comment', 'manual', 'approval'];
    if (!allowed.includes(trigger)) throw new Error(`trigger must be one of ${allowed.join(',')}`);
    const item = {
        id: genId('wakeup'),
        companyId: String(companyId || ''),
        agentId: String(agentId || ''),
        trigger,
        ref: String(ref || '').slice(0, 300),
        status: 'pending',
        createdAt: Date.now(),
    };
    const all = listWakeups(false);
    all.push(item);
    if (all.length > 5000) all.splice(0, all.length - 5000);
    saveWakeups(all);
    return item;
}

export function ackWakeup(id, status = 'done', result = '') {
    const allowed = ['done', 'error', 'pending'];
    if (!allowed.includes(status)) throw new Error(`status must be one of ${allowed.join(',')}`);
    const all = listWakeups(false);
    const item = all.find((w) => w.id === id);
    if (!item) return null;
    item.status = status;
    if (result) item.result = String(result).slice(0, 500);
    item.processedAt = Date.now();
    saveWakeups(all);
    return item;
}

export function setCompanyBudget(companyId, monthlyBudgetCents) {
    const all = listCompanies();
    const org = all.find((c) => c.id === companyId);
    if (!org) return null;
    let budget = monthlyBudgetCents ?? null;
    if (budget !== null) {
        budget = Number(budget);
        if (!Number.isFinite(budget) || budget < 0) throw new Error('monthlyBudgetCents must be >= 0');
    }
    org.monthlyBudgetCents = budget;
    org.updatedAt = Date.now();
    saveCompanies(all);
    return org;
}

// ── M7.1: cost ledger (центы как первоклассная сущность) ──
function readCosts() {
    const db = readJson(COSTS_FILE, { costs: [] });
    return Array.isArray(db.costs) ? db.costs : [];
}

function saveCosts(costs) {
    writeJsonAtomic(COSTS_FILE, { costs, updatedAt: Date.now() });
}

export function monthKey(ts) {
    const d = new Date(ts);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function recordCost({ companyId, agentId, taskId, model, inputTokens, outputTokens, cents }) {
    if (!companyId || !getCompany(String(companyId))) throw new Error('company not found');
    const spend = Number(cents);
    if (!Number.isFinite(spend) || spend < 0) throw new Error('cents must be >= 0');
    const ev = {
        id: genId('cost'),
        companyId: String(companyId),
        agentId: agentId ? String(agentId) : null,
        taskId: taskId ? String(taskId).slice(0, 200) : null,
        model: model ? String(model).slice(0, 200) : null,
        inputTokens: inputTokens == null ? null : Number(inputTokens),
        outputTokens: outputTokens == null ? null : Number(outputTokens),
        cents: spend,
        month: monthKey(Date.now()),
        createdAt: Date.now(),
    };
    const all = readCosts();
    all.push(ev);
    if (all.length > MAX_COST_EVENTS) all.splice(0, all.length - MAX_COST_EVENTS);
    saveCosts(all);
    return ev;
}

export function listCosts(companyId, { agentId, limit = 100 } = {}) {
    return readCosts()
        .filter((c) => c.companyId === companyId && (!agentId || c.agentId === agentId))
        .slice(-Math.max(1, Math.min(1000, limit)));
}

export function monthSpend(companyId, agentId = null) {
    const m = monthKey(Date.now());
    return readCosts()
        .filter((c) => c.companyId === companyId && c.month === m && (!agentId || c.agentId === agentId))
        .reduce((s, c) => s + (Number(c.cents) || 0), 0);
}

export function budgetStatus(companyId, agentId = null) {
    const org = getCompany(companyId);
    if (!org) return null;
    let budget = null;
    if (agentId) {
        const agents = Array.isArray(org.agents) ? org.agents : [];
        const a = agents.find((x) => x.id === agentId);
        if (!a) return null;
        budget = a.monthlyBudgetCents ?? null;
    } else {
        budget = org.monthlyBudgetCents ?? null;
    }
    const spent = monthSpend(companyId, agentId);
    if (budget === null)
        return { budget: null, spent, remaining: null, over: false, month: monthKey(Date.now()) };
    return {
        budget,
        spent,
        remaining: budget - spent,
        over: spent >= budget,
        month: monthKey(Date.now()),
    };
}

export function isOverBudget(companyId, agentId = null) {
    // Hard-stop срабатывает на любом уровне: компания ИЛИ агент.
    const companyLevel = budgetStatus(companyId, null);
    if (!companyLevel) return { over: false, scope: null };
    if (companyLevel.over) return { over: true, scope: 'company', status: companyLevel };
    if (agentId) {
        const agentLevel = budgetStatus(companyId, agentId);
        if (agentLevel && agentLevel.over) return { over: true, scope: 'agent', status: agentLevel };
    }
    return { over: false, scope: null };
}

// ── M4.1: issues как единица работы (иерархия + atomic checkout) ──
const ISSUE_STATUS = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled'];
const ISSUE_TRANSITIONS = {
    backlog: ['todo', 'cancelled'],
    todo: ['in_progress', 'blocked', 'cancelled'],
    in_progress: ['in_review', 'blocked', 'cancelled'],
    in_review: ['done', 'in_progress', 'blocked'],
    blocked: ['todo', 'cancelled'],
    done: [],
    cancelled: [],
};

function readIssues() {
    const db = readJson(ISSUES_FILE, { issues: [] });
    return Array.isArray(db.issues) ? db.issues : [];
}

function saveIssues(issues) {
    writeJsonAtomic(ISSUES_FILE, { issues, updatedAt: Date.now() });
}

export function listIssues(companyId, { status, assigneeAgentId } = {}) {
    return readIssues().filter(
        (i) =>
            i.companyId === companyId &&
            (!status || i.status === status) &&
            (!assigneeAgentId || i.assigneeAgentId === assigneeAgentId),
    );
}

export function getIssue(companyId, issueId) {
    return readIssues().find((i) => i.companyId === companyId && i.id === issueId) || null;
}

export function createIssue(companyId, { title, parentIssueId, status, assigneeAgentId }) {
    if (!getCompany(companyId)) throw new Error('company not found');
    const cleanTitle = String(title || '').slice(0, 300).trim();
    if (!cleanTitle) throw new Error('title is required');
    const st = status || 'backlog';
    if (!ISSUE_STATUS.includes(st)) throw new Error(`status must be one of ${ISSUE_STATUS.join(',')}`);
    const cleanParent = parentIssueId ? String(parentIssueId) : null;
    if (cleanParent && !getIssue(companyId, cleanParent)) {
        throw new Error('parent issue not found in this company');
    }
    if (assigneeAgentId) {
        const agents = listAgents(companyId) || [];
        if (!agents.some((a) => a.id === String(assigneeAgentId))) {
            throw new Error('assignee not found in this company');
        }
    }
    const issue = {
        id: genId('issue'),
        companyId: String(companyId),
        parentIssueId: cleanParent,
        title: cleanTitle,
        status: st,
        assigneeAgentId: assigneeAgentId ? String(assigneeAgentId) : null,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    const all = readIssues();
    all.push(issue);
    if (all.length > MAX_ISSUES) all.splice(0, all.length - MAX_ISSUES);
    saveIssues(all);
    return issue;
}

export function getIssueTree(companyId, issueId) {
    const start = getIssue(companyId, issueId);
    if (!start) return null;
    const chain = [start];
    const seen = new Set([start.id]);
    let cur = start.parentIssueId || null;
    while (cur) {
        if (seen.has(cur)) break;
        seen.add(cur);
        const parent = getIssue(companyId, cur);
        if (!parent) break;
        chain.push(parent);
        cur = parent.parentIssueId || null;
    }
    return chain.reverse();
}

export function checkoutIssue(companyId, issueId, agentId) {
    if (!agentId) throw new Error('agentId is required');
    const agents = listAgents(companyId);
    if (!agents) throw new Error('company not found');
    if (!agents.some((a) => a.id === String(agentId))) throw new Error('agent not found in this company');
    const all = readIssues();
    const issue = all.find((i) => i.companyId === companyId && i.id === issueId);
    if (!issue) return null;
    if (issue.status === 'done' || issue.status === 'cancelled') {
        const err = new Error(`issue is ${issue.status}`);
        err.code = 'TERMINAL';
        throw err;
    }
    if (issue.assigneeAgentId && issue.assigneeAgentId !== String(agentId)) {
        const err = new Error(`issue already checked out by ${issue.assigneeAgentId}`);
        err.code = 'CONFLICT';
        throw err;
    }
    issue.assigneeAgentId = String(agentId);
    if (issue.status === 'backlog' || issue.status === 'todo' || issue.status === 'blocked') {
        issue.status = 'in_progress';
    }
    issue.version += 1;
    issue.updatedAt = Date.now();
    saveIssues(all);
    return issue;
}

export function setIssueStatus(companyId, issueId, status, agentId = null, gate = null) {
    if (!ISSUE_STATUS.includes(status)) throw new Error(`status must be one of ${ISSUE_STATUS.join(',')}`);
    // M9.1 uncertainty-gate: шаги in_review/done требуют доказательства.
    let verdict = null;
    if (status === 'in_review' || status === 'done') {
        verdict = evaluateGate(gate);
        if (verdict.verdict === 'escalate') {
            const err = new Error(`escalated: confidence ${verdict.confidence} too low, route to manager`);
            err.code = 'ESCALATE';
            err.gate = verdict;
            throw err;
        }
    }
    const all = readIssues();
    const issue = all.find((i) => i.companyId === companyId && i.id === issueId);
    if (!issue) return null;
    const allowed = ISSUE_TRANSITIONS[issue.status] || [];
    if (!allowed.includes(status)) {
        const err = new Error(`transition ${issue.status} -> ${status} not allowed`);
        err.code = 'TRANSITION';
        throw err;
    }
    if (agentId) {
        const agents = listAgents(companyId) || [];
        if (!agents.some((a) => a.id === String(agentId))) throw new Error('agent not found in this company');
        if (issue.assigneeAgentId && issue.assigneeAgentId !== String(agentId)) {
            const err = new Error(`issue already checked out by ${issue.assigneeAgentId}`);
            err.code = 'CONFLICT';
            throw err;
        }
        issue.assigneeAgentId = String(agentId);
    }
    issue.status = status;
    issue.version += 1;
    issue.updatedAt = Date.now();
    if (verdict) {
        issue.lastGate = verdict;
        if (verdict.verdict === 'verify') {
            issue.needsVerification = true;
            logActivity(companyId, 'gate_verify', `${issueId} conf=${verdict.confidence}`);
        }
    }
    saveIssues(all);
    return issue;
}

// ── M9.1: uncertainty-gated execution ──
// confidence ≥0.75 + цитата → proceed; 0.40–0.75 или нет цитат → verify;
// <0.40 → escalate (переход блокируется, задача уходит менеджеру).
export function evaluateGate(gate) {
    if (!gate || typeof gate !== 'object') {
        const err = new Error('gate required: {confidence, citations[]} for in_review/done');
        err.code = 'GATE_REQUIRED';
        throw err;
    }
    const confidence = Number(gate.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        const err = new Error('gate.confidence must be 0..1');
        err.code = 'GATE_REQUIRED';
        throw err;
    }
    const citations = Array.isArray(gate.citations) ? gate.citations.map(String).map((s) => s.slice(0, 500)) : [];
    if (confidence < 0.4) return { verdict: 'escalate', confidence, citations };
    if (confidence >= 0.75 && citations.length >= 1) return { verdict: 'proceed', confidence, citations };
    return { verdict: 'verify', confidence, citations };
}

// ── M5.1: heartbeat-протокол как исполняемое ядро (runs + events) ──
// Протокол внутри run: identity → assignments → pick → checkout → work → report.
// На сервере work = heartbeat + пометка wakeup; внешние рантаймы (M2) позже
// подключатся как исполнители шага work через тот же run-трейс.
const RUN_STEPS = ['identity', 'assignments', 'pick', 'checkout', 'work', 'report'];

function readRuns() {
    const db = readJson(RUNS_FILE, { runs: [] });
    return Array.isArray(db.runs) ? db.runs : [];
}

function saveRuns(runs) {
    writeJsonAtomic(RUNS_FILE, { runs, updatedAt: Date.now() });
}

function findRun(runs, id) {
    return runs.find((r) => r.id === id) || null;
}

export function startRun({ companyId, agentId, trigger, ref, wakeupId }) {
    if (!getCompany(String(companyId))) throw new Error('company not found');
    const run = {
        id: genId('run'),
        companyId: String(companyId),
        agentId: agentId ? String(agentId) : null,
        trigger: String(trigger || 'manual').slice(0, 50),
        ref: ref ? String(ref).slice(0, 300) : null,
        wakeupId: wakeupId || null,
        status: 'running',
        events: [{ t: Date.now(), step: 'identity', detail: 'run started' }],
        createdAt: Date.now(),
        finishedAt: null,
    };
    const all = readRuns();
    all.push(run);
    if (all.length > MAX_RUNS) all.splice(0, all.length - MAX_RUNS);
    saveRuns(all);
    return run;
}

export function appendRunEvent(runId, step, detail = '') {
    if (!RUN_STEPS.includes(step)) throw new Error(`step must be one of ${RUN_STEPS.join(',')}`);
    const all = readRuns();
    const run = findRun(all, runId);
    if (!run) return null;
    run.events.push({ t: Date.now(), step, detail: String(detail).slice(0, 500) });
    saveRuns(all);
    return run;
}

export function finishRun(runId, status = 'done', detail = '') {
    if (!['done', 'error'].includes(status)) throw new Error('status must be done|error');
    const all = readRuns();
    const run = findRun(all, runId);
    if (!run) return null;
    run.status = status;
    run.finishedAt = Date.now();
    if (detail) run.events.push({ t: Date.now(), step: 'report', detail: String(detail).slice(0, 500) });
    saveRuns(all);
    return run;
}

export function listRuns(companyId, { status, limit = 50 } = {}) {
    return readRuns()
        .filter((r) => r.companyId === companyId && (!status || r.status === status))
        .slice(-Math.max(1, Math.min(500, limit)));
}

export function getRun(runId) {
    return readRuns().find((r) => r.id === runId) || null;
}

// ── M6.1: governance — approvals + единая лента activity ──
const APPROVAL_KINDS = ['hire_agent', 'ceo_strategy', 'override'];
const APPROVAL_STATUS = ['pending', 'approved', 'rejected'];
const OVERRIDE_ACTIONS = ['pause', 'terminate', 'reassign'];

function readApprovals() {
    const db = readJson(APPROVALS_FILE, { approvals: [] });
    return Array.isArray(db.approvals) ? db.approvals : [];
}

function saveApprovals(approvals) {
    writeJsonAtomic(APPROVALS_FILE, { approvals, updatedAt: Date.now() });
}

function readActivity() {
    const db = readJson(ACTIVITY_FILE, { log: [] });
    return Array.isArray(db.log) ? db.log : [];
}

function saveActivity(log) {
    writeJsonAtomic(ACTIVITY_FILE, { log, updatedAt: Date.now() });
}

export function logActivity(companyId, type, detail = '') {
    const all = readActivity();
    all.push({
        id: genId('act'),
        companyId: String(companyId),
        type: String(type).slice(0, 100),
        detail: String(detail).slice(0, 500),
        createdAt: Date.now(),
    });
    if (all.length > MAX_ACTIVITY) all.splice(0, all.length - MAX_ACTIVITY);
    saveActivity(all);
}

export function listActivity(companyId, { limit = 100 } = {}) {
    return readActivity()
        .filter((a) => a.companyId === companyId)
        .slice(-Math.max(1, Math.min(1000, limit)));
}

export function requestApproval(companyId, { kind, payload, requesterAgentId }) {
    if (!getCompany(companyId)) throw new Error('company not found');
    if (!APPROVAL_KINDS.includes(kind)) throw new Error(`kind must be one of ${APPROVAL_KINDS.join(',')}`);
    if (!payload || typeof payload !== 'object') throw new Error('payload is required');
    if (requesterAgentId) {
        const agents = listAgents(companyId) || [];
        if (!agents.some((a) => a.id === String(requesterAgentId))) {
            throw new Error('requester not found in this company');
        }
    }
    if (kind === 'hire_agent') {
        if (!payload.name) throw new Error('payload.name is required for hire_agent');
        if (payload.managerId) {
            const agents = listAgents(companyId) || [];
            if (!agents.some((a) => a.id === String(payload.managerId))) {
                throw new Error('payload.managerId not found in this company');
            }
        }
    }
    if (kind === 'override') {
        if (!OVERRIDE_ACTIONS.includes(payload.action)) {
            throw new Error(`payload.action must be one of ${OVERRIDE_ACTIONS.join(',')}`);
        }
        if (!payload.agentId) throw new Error('payload.agentId is required for override');
        const agents = listAgents(companyId) || [];
        if (!agents.some((a) => a.id === String(payload.agentId))) {
            throw new Error('payload.agentId not found in this company');
        }
    }
    if (kind === 'ceo_strategy' && !payload.strategy) {
        throw new Error('payload.strategy is required for ceo_strategy');
    }
    const approval = {
        id: genId('appr'),
        companyId: String(companyId),
        kind,
        status: 'pending',
        payload,
        requesterAgentId: requesterAgentId ? String(requesterAgentId) : null,
        comments: [],
        executedAgentId: null,
        createdAt: Date.now(),
        decidedAt: null,
        decidedBy: null,
    };
    const all = readApprovals();
    all.push(approval);
    if (all.length > MAX_APPROVALS) all.splice(0, all.length - MAX_APPROVALS);
    saveApprovals(all);
    logActivity(companyId, 'approval_requested', `${kind} ${approval.id}`);
    return approval;
}

export function listApprovals(companyId, { status } = {}) {
    return readApprovals().filter(
        (a) => a.companyId === companyId && (!status || a.status === status),
    );
}

export function getApproval(approvalId) {
    return readApprovals().find((a) => a.id === approvalId) || null;
}

export function commentApproval(approvalId, { author, text }) {
    const clean = String(text || '').slice(0, 1000).trim();
    if (!clean) throw new Error('text is required');
    const all = readApprovals();
    const a = all.find((x) => x.id === approvalId);
    if (!a) return null;
    a.comments.push({ author: author ? String(author).slice(0, 200) : null, text: clean, createdAt: Date.now() });
    saveApprovals(all);
    return a;
}

export function setAgentStatus(companyId, agentId, status) {
    const all = listCompanies();
    const org = all.find((c) => c.id === companyId);
    if (!org) return null;
    const agent = (org.agents || []).find((a) => a.id === agentId);
    if (!agent) return null;
    agent.status = status;
    org.updatedAt = Date.now();
    saveCompanies(all);
    return agent;
}

export function decideApproval(approvalId, { decision, by, comment }) {
    if (!['approved', 'rejected'].includes(decision)) {
        throw new Error('decision must be approved|rejected');
    }
    const all = readApprovals();
    const a = all.find((x) => x.id === approvalId);
    if (!a) return null;
    if (a.status !== 'pending') {
        const err = new Error(`approval already ${a.status}`);
        err.code = 'SETTLED';
        throw err;
    }
    a.status = decision;
    a.decidedAt = Date.now();
    a.decidedBy = by ? String(by).slice(0, 200) : null;
    if (comment) {
        a.comments.push({
            author: a.decidedBy,
            text: String(comment).slice(0, 1000),
            createdAt: Date.now(),
        });
    }
    if (decision === 'approved') {
        if (a.kind === 'hire_agent') {
            const agent = addAgent(a.companyId, {
                name: a.payload.name,
                title: a.payload.title,
                managerId: a.payload.managerId,
                monthlyBudgetCents: a.payload.monthlyBudgetCents,
                status: 'active',
            });
            a.executedAgentId = agent.id;
            logActivity(a.companyId, 'agent_hired', `${agent.name} via ${a.id}`);
        } else if (a.kind === 'override') {
            const { action, agentId, managerId } = a.payload;
            if (action === 'pause') setAgentStatus(a.companyId, agentId, 'paused');
            if (action === 'terminate') setAgentStatus(a.companyId, agentId, 'terminated');
            if (action === 'reassign' && managerId) {
                const companies = listCompanies();
                const org = companies.find((c) => c.id === a.companyId);
                const agent = org?.agents?.find((x) => x.id === agentId);
                if (agent) {
                    agent.managerId = String(managerId);
                    org.updatedAt = Date.now();
                    saveCompanies(companies);
                }
            }
            logActivity(a.companyId, 'override_applied', `${action} ${agentId} via ${a.id}`);
        } else if (a.kind === 'ceo_strategy') {
            logActivity(a.companyId, 'ceo_strategy', String(a.payload.strategy).slice(0, 500));
        }
    } else {
        logActivity(a.companyId, 'approval_rejected', `${a.kind} ${a.id}`);
    }
    saveApprovals(all);
    logActivity(a.companyId, `approval_${decision}`, `${a.kind} ${a.id}`);
    return a;
}

// ── M8.1: portability — export/import манифеста с ремаппингом ID ──
const REDACT_PATTERNS = [
    /sk-[A-Za-z0-9-_]{8,}/g,
    /xox[bpas]-[A-Za-z0-9-]+/g,
    /gh[pousr]_[A-Za-z0-9_]+/g,
    /Bearer\s+[A-Za-z0-9\-._~+/=]+/gi,
    /(['"]?(api[_-]?key|secret|token|password)['"]?\s*[:=]\s*['"]?)([^'"\s,}]+)/gi,
];

export function redactSecrets(value) {
    if (typeof value === 'string') {
        let out = value;
        for (const re of REDACT_PATTERNS) {
            re.lastIndex = 0;
            out = out.replace(re, (m, prefix, _name, _val) =>
                prefix !== undefined && _val !== undefined ? `${prefix}[REDACTED]` : '[REDACTED]',
            );
        }
        return out;
    }
    if (Array.isArray(value)) return value.map(redactSecrets);
    if (value && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = redactSecrets(v);
        return out;
    }
    return value;
}

export function exportCompany(companyId) {
    const org = getCompany(companyId);
    if (!org) return null;
    const agents = Array.isArray(org.agents) ? org.agents : [];
    const issues = listIssues(companyId);
    const manifest = {
        format: 'superagents-company/1',
        exportedAt: Date.now(),
        company: {
            name: org.name,
            mission: org.mission,
            monthlyBudgetCents: org.monthlyBudgetCents ?? null,
        },
        agents: agents.map((a) => ({
            key: a.id,
            name: a.name,
            title: a.title,
            managerKey: a.managerId,
            monthlyBudgetCents: a.monthlyBudgetCents ?? null,
            status: a.status,
        })),
        issues: issues.map((i) => ({
            key: i.id,
            title: i.title,
            parentKey: i.parentIssueId,
            status: i.status,
            assigneeKey: i.assigneeAgentId,
        })),
    };
    return redactSecrets(manifest);
}

export function deleteCompany(companyId) {
    const companies = listCompanies().filter((c) => c.id !== companyId);
    saveCompanies(companies);
    saveIssues(readIssues().filter((i) => i.companyId !== companyId));
    saveWakeups(listWakeups(false).filter((w) => w.companyId !== companyId));
    saveCosts(readCosts().filter((c) => c.companyId !== companyId));
    saveRuns(readRuns().filter((r) => r.companyId !== companyId));
    saveApprovals(readApprovals().filter((a) => a.companyId !== companyId));
    saveActivity(readActivity().filter((a) => a.companyId !== companyId));
}

export function importCompany(manifest, { collision = 'rename' } = {}) {
    if (!manifest || manifest.format !== 'superagents-company/1') {
        throw new Error('unsupported manifest format');
    }
    if (!['rename', 'skip', 'overwrite'].includes(collision)) {
        throw new Error('collision must be rename|skip|overwrite');
    }
    const src = manifest.company || {};
    if (!src.name) throw new Error('manifest.company.name is required');
    const clash = listCompanies().find((c) => c.name === String(src.name));
    if (clash && collision === 'skip') return { skipped: true, companyId: clash.id };
    if (clash && collision === 'overwrite') deleteCompany(clash.id);
    let name = String(src.name);
    if (clash && collision === 'rename') {
        let n = 2;
        while (listCompanies().some((c) => c.name === `${name} (${n})`)) n += 1;
        name = `${name} (${n})`;
    }
    const org = createCompany({ name, mission: src.mission || '', monthlyBudgetCents: src.monthlyBudgetCents ?? null });
    // Проход 1: агенты без связей; проход 2: managerId по карте ключей.
    const agentMap = new Map();
    for (const a of manifest.agents || []) {
        const created = addAgent(org.id, {
            name: a.name,
            title: a.title,
            managerId: null,
            monthlyBudgetCents: a.monthlyBudgetCents ?? null,
            status: a.status && AGENT_STATUS.includes(a.status) ? a.status : 'active',
        });
        agentMap.set(a.key, created.id);
    }
    if (agentMap.size > 0) {
        const companies = listCompanies();
        const target = companies.find((c) => c.id === org.id);
        for (const a of manifest.agents || []) {
            if (a.managerKey && agentMap.has(a.managerKey)) {
                const node = target.agents.find((x) => x.id === agentMap.get(a.key));
                if (node) node.managerId = agentMap.get(a.managerKey);
            }
        }
        saveCompanies(companies);
    }
    // Проход 1: задачи без родителей/исполнителей; проход 2: связи.
    const issueMap = new Map();
    for (const i of manifest.issues || []) {
        const created = createIssue(org.id, { title: i.title, status: 'backlog' });
        issueMap.set(i.key, created.id);
    }
    if (issueMap.size > 0) {
        const all = readIssues();
        for (const i of manifest.issues || []) {
            const node = all.find((x) => x.id === issueMap.get(i.key));
            if (!node) continue;
            if (i.parentKey && issueMap.has(i.parentKey)) node.parentIssueId = issueMap.get(i.parentKey);
            if (i.assigneeKey && agentMap.has(i.assigneeKey)) node.assigneeAgentId = agentMap.get(i.assigneeKey);
            if (i.status && ISSUE_STATUS.includes(i.status) && i.status !== 'backlog') {
                node.status = i.status;
                node.version += 1;
            }
            node.updatedAt = Date.now();
        }
        saveIssues(all);
    }
    const fresh = getCompany(org.id);
    logActivity(org.id, 'company_imported', `${fresh.agents.length} agents, ${listIssues(org.id).length} issues`);
    return { skipped: false, company: fresh };
}
