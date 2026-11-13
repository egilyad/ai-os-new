import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASKS_FILE, handleTasksRequest, handleTasksSync } from '../tasks-router.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP = path.join(__dirname, '..', '..', 'data', 'tasks.backup.json');

const hasAuth = () => true;

function fakeReq(method, url, body) {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { authorization: 'Bearer test' };
    if (body !== undefined) {
        queueMicrotask(() => req.emit('data', Buffer.from(JSON.stringify(body))));
        queueMicrotask(() => req.emit('end'));
    }
    return req;
}

function collectRes() {
    const res = { status: 0, body: '' };
    res.writeHead = (s) => {
        res.status = s;
    };
    res.end = (d) => {
        res.body = d;
    };
    return res;
}

async function call(handler, method, url, body) {
    const res = collectRes();
    await handler(fakeReq(method, url, body), res, hasAuth);
    return { status: res.status, body: res.body ? JSON.parse(res.body) : null };
}

describe('tasks-router', () => {
    beforeEach(() => {
        if (fs.existsSync(TASKS_FILE)) {
            fs.copyFileSync(TASKS_FILE, BACKUP);
            fs.rmSync(TASKS_FILE);
        }
        fs.mkdirSync(path.dirname(TASKS_FILE), { recursive: true });
        fs.writeFileSync(TASKS_FILE, '[]', 'utf8');
    });

    afterEach(() => {
        if (fs.existsSync(BACKUP)) {
            fs.copyFileSync(BACKUP, TASKS_FILE);
            fs.rmSync(BACKUP);
        }
    });

    it('creates a task via POST', async () => {
        const { status, body } = await call(handleTasksRequest, 'POST', '/api/tasks', {
            title: 'hello',
            assigneeId: 'agent-opencode',
        });
        assert.equal(status, 201);
        assert.equal(body.task.title, 'hello');
        assert.equal(body.task.assigneeId, 'agent-opencode');
    });

    it('lists tasks via GET', async () => {
        await call(handleTasksRequest, 'POST', '/api/tasks', { title: 'one' });
        const { status, body } = await call(handleTasksRequest, 'GET', '/api/tasks');
        assert.equal(status, 200);
        assert.equal(body.tasks.length, 1);
    });

    it('next() claims a PENDING task atomically', async () => {
        await call(handleTasksRequest, 'POST', '/api/tasks', {
            title: 'job',
            assigneeId: 'agent-opencode',
        });
        const first = await call(handleTasksRequest, 'POST', '/api/tasks/next?assigneeId=agent-opencode');
        assert.equal(first.status, 200);
        assert.equal(first.body.task.status, 'IN_PROGRESS');
        const second = await call(handleTasksRequest, 'POST', '/api/tasks/next?assigneeId=agent-opencode');
        assert.equal(second.body.task, null);
    });

    it('claim conflicts with another worker', async () => {
        await call(handleTasksRequest, 'POST', '/api/tasks', { title: 'job' });
        const list = await call(handleTasksRequest, 'GET', '/api/tasks');
        const id = list.body.tasks[0].id;
        await call(handleTasksRequest, 'POST', `/api/tasks/${id}/claim`, { workerId: 'a' });
        const conflict = await call(handleTasksRequest, 'POST', `/api/tasks/${id}/claim`, {
            workerId: 'b',
        });
        assert.equal(conflict.status, 409);
    });

    it('sync replaces the mirror', async () => {
        const { status, body } = await call(handleTasksSync, 'PUT', '/api/tasks/sync', {
            tasks: [{ id: 't1', title: 'x', status: 'PENDING' }],
        });
        assert.equal(status, 200);
        assert.equal(body.count, 1);
        const list = await call(handleTasksRequest, 'GET', '/api/tasks');
        assert.equal(list.body.tasks.length, 1);
    });

    it('returns 401 without auth', async () => {
        const res = collectRes();
        await handleTasksRequest(fakeReq('GET', '/api/tasks'), res, () => false);
        assert.equal(res.status, 401);
    });
});
