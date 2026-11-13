import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TASKS_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

export function readTasks() {
    try {
        if (!fs.existsSync(TASKS_FILE)) return [];
        const raw = fs.readFileSync(TASKS_FILE, 'utf8');
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function writeTasks(tasks) {
    fs.mkdirSync(path.dirname(TASKS_FILE), { recursive: true });
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

function parseBody(req, limitBytes = 512 * 1024) {
    return new Promise((resolve) => {
        const chunks = [];
        let total = 0;
        req.on('data', (c) => {
            total += c.length;
            if (total > limitBytes) {
                resolve(null);
                req.destroy();
                return;
            }
            chunks.push(c);
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch {
                resolve(null);
            }
        });
        req.on('error', () => resolve(null));
    });
}

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

/**
 * Per-task authorization (M2.4): a worker may only act on tasks assigned
 * to it, or on unassigned tasks. Deny otherwise.
 */
function canActOnTask(task, actor) {
    if (!actor) return false;
    if (!task.assigneeId) return true;
    return task.assigneeId === actor;
}

/**
 * Mounts /api/tasks REST router. Returns true if the request was handled.
 * Auth: requires a valid sync secret token (Authorization: Bearer <token>).
 */
export async function handleTasksRequest(req, res, hasAuth) {
    let parsed;
    try {
        parsed = new URL(req.url || '/', 'http://localhost');
    } catch {
        return false;
    }
    const pathname = parsed.pathname;
    if (!pathname.startsWith('/api/tasks')) return false;

    if (!hasAuth(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
    }

    const parts = pathname.slice('/api/tasks'.length).split('/').filter(Boolean);

    if (req.method === 'GET' && parts.length === 0) {
        const tasks = readTasks();
        const status = parsed.searchParams.get('status');
        const assigneeId = parsed.searchParams.get('assigneeId');
        const projectId = parsed.searchParams.get('projectId');
        const limit = parseInt(parsed.searchParams.get('limit') || '100', 10);
        let filtered = tasks;
        if (status) filtered = filtered.filter((t) => t.status === status);
        if (assigneeId) filtered = filtered.filter((t) => t.assigneeId === assigneeId);
        if (projectId) filtered = filtered.filter((t) => t.projectId === projectId);
        sendJson(res, 200, { tasks: filtered.slice(0, limit) });
        return true;
    }

    if (req.method === 'GET' && parts.length === 1) {
        const task = readTasks().find((t) => t.id === parts[0]);
        if (!task) {
            sendJson(res, 404, { error: 'Not found' });
        } else {
            sendJson(res, 200, { task });
        }
        return true;
    }

    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'next') {
        const tasks = readTasks();
        const assigneeId = parsed.searchParams.get('assigneeId') || req.headers['x-assignee-id'];
        let candidate = tasks.filter(
            (t) => t.status === 'PENDING' && (!assigneeId || t.assigneeId === assigneeId),
        );
        candidate.sort((a, b) => b.priorityOrder - a.priorityOrder || a.createdAt - b.createdAt);
        if (candidate.length === 0) {
            sendJson(res, 200, { task: null });
            return true;
        }
        const picked = candidate[0];
        const now = Date.now();
        picked.status = 'IN_PROGRESS';
        picked.lockedBy = assigneeId || 'external';
        picked.lockedUntil = now + 60_000;
        picked.updatedAt = now;
        writeTasks(tasks);
        sendJson(res, 200, { task: picked });
        return true;
    }

    if (req.method === 'POST' && parts.length === 0) {
        const body = await parseBody(req);
        if (!body || typeof body.title !== 'string') {
            sendJson(res, 400, { error: 'title is required' });
            return true;
        }
        const tasks = readTasks();
        const now = Date.now();
        const task = {
            id: `task-${crypto.randomUUID()}`,
            title: body.title.slice(0, 200),
            description: body.description?.slice(0, 2000),
            type: body.type || 'ONE_TIME',
            status: body.status || 'PENDING',
            priority: body.priority || 'MEDIUM',
            assigneeId: body.assigneeId,
            creatorId: body.creatorId || 'external',
            projectId: body.projectId,
            labels: body.labels || [],
            createdAt: now,
            updatedAt: now,
        };
        tasks.push(task);
        writeTasks(tasks);
        sendJson(res, 201, { task });
        return true;
    }

    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'claim') {
        const tasks = readTasks();
        const task = tasks.find((t) => t.id === parts[0]);
        if (!task) {
            sendJson(res, 404, { error: 'Not found' });
            return true;
        }
        const body = await parseBody(req);
        const workerId = body?.workerId || 'external';
        if (!canActOnTask(task, workerId)) {
            sendJson(res, 403, { error: 'Not allowed on this task' });
            return true;
        }
        const now = Date.now();
        if (task.lockedBy && task.lockedUntil && task.lockedUntil > now && task.lockedBy !== workerId) {
            sendJson(res, 409, { error: 'Locked by another worker' });
            return true;
        }
        task.lockedBy = workerId;
        task.lockedUntil = now + (body?.ttlMs || 60_000);
        task.updatedAt = now;
        writeTasks(tasks);
        sendJson(res, 200, { task });
        return true;
    }

    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'release') {
        const tasks = readTasks();
        const task = tasks.find((t) => t.id === parts[0]);
        if (!task) {
            sendJson(res, 404, { error: 'Not found' });
            return true;
        }
        task.lockedBy = undefined;
        task.lockedUntil = undefined;
        task.updatedAt = Date.now();
        writeTasks(tasks);
        sendJson(res, 200, { task });
        return true;
    }

    if (req.method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
        const tasks = readTasks();
        const task = tasks.find((t) => t.id === parts[0]);
        if (!task) {
            sendJson(res, 404, { error: 'Not found' });
            return true;
        }
        const body = await parseBody(req);
        if (!body || typeof body.status !== 'string') {
            sendJson(res, 400, { error: 'status is required' });
            return true;
        }
        const prev = task.status;
        task.status = body.status;
        task.updatedAt = Date.now();
        writeTasks(tasks);
        sendJson(res, 200, { task, prev });
        return true;
    }

    if (req.method === 'DELETE' && parts.length === 1) {
        const tasks = readTasks();
        const idx = tasks.findIndex((t) => t.id === parts[0]);
        if (idx === -1) {
            sendJson(res, 404, { error: 'Not found' });
            return true;
        }
        tasks.splice(idx, 1);
        writeTasks(tasks);
        sendJson(res, 200, { status: 'ok' });
        return true;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return true;
}

export async function handleTasksSync(req, res, hasAuth) {
    if (req.method !== 'PUT' || req.url !== '/api/tasks/sync') return false;
    if (!hasAuth(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
    }
    const body = await parseBody(req, 5 * 1024 * 1024);
    if (!body || !Array.isArray(body.tasks)) {
        sendJson(res, 400, { error: 'tasks array is required' });
        return true;
    }
    writeTasks(body.tasks);
    sendJson(res, 200, { status: 'ok', count: body.tasks.length });
    return true;
}
