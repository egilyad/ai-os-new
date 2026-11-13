#!/usr/bin/env node
/**
 * tasks-mcp-server — stdio MCP server exposing AGEMS tasks via REST.
 * Connect from opencode.jsonc:
 *   "mcp": { "aios-tasks": { "type": "local",
 *       "command": ["node", "./cli/tasks-mcp-server.mjs"],
 *       "environment": { "AIOS_SYNC_URL": "http://localhost:3001",
 *                        "AIOS_SYNC_TOKEN": "<secret>" } } }
 */

import { createInterface } from 'node:readline';

const BASE = process.env.AIOS_SYNC_URL || 'http://localhost:3001';
const TOKEN = process.env.AIOS_SYNC_TOKEN || '';

async function api(method, pathname, body) {
    const res = await fetch(`${BASE}${pathname}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

const TOOLS = [
    {
        name: 'task_list',
        description: 'List tasks from the AGEMS board.',
        inputSchema: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                assigneeId: { type: 'string' },
                projectId: { type: 'string' },
                limit: { type: 'number' },
            },
        },
    },
    {
        name: 'task_get',
        description: 'Get a single task by id.',
        inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
    {
        name: 'task_create',
        description: 'Create a task.',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                priority: { type: 'string' },
                assigneeId: { type: 'string' },
                projectId: { type: 'string' },
            },
            required: ['title'],
        },
    },
    {
        name: 'task_next',
        description: 'Atomically claim the next PENDING task for a worker.',
        inputSchema: {
            type: 'object',
            properties: { assigneeId: { type: 'string' } },
        },
    },
    {
        name: 'task_claim',
        description: 'Claim a task by id.',
        inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' }, workerId: { type: 'string' }, ttlMs: { type: 'number' } },
            required: ['id', 'workerId'],
        },
    },
    {
        name: 'task_release',
        description: 'Release a task lock.',
        inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' }, workerId: { type: 'string' } },
            required: ['id'],
        },
    },
    {
        name: 'task_set_status',
        description: 'Change task status.',
        inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' }, status: { type: 'string' } },
            required: ['id', 'status'],
        },
    },
    {
        name: 'task_delete',
        description: 'Delete a task.',
        inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id'],
        },
    },
];

function send(msg) {
    process.stdout.write(JSON.stringify(msg) + '\n');
}

async function handleCall(name, args) {
    switch (name) {
        case 'task_list': {
            const q = new URLSearchParams();
            if (args?.status) q.set('status', args.status);
            if (args?.assigneeId) q.set('assigneeId', args.assigneeId);
            if (args?.projectId) q.set('projectId', args.projectId);
            if (args?.limit) q.set('limit', String(args.limit));
            const r = await api('GET', `/api/tasks?${q.toString()}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_get': {
            const r = await api('GET', `/api/tasks/${encodeURIComponent(args.id)}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_create': {
            const r = await api('POST', '/api/tasks', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_next': {
            const q = args?.assigneeId ? `?assigneeId=${encodeURIComponent(args.assigneeId)}` : '';
            const r = await api('POST', `/api/tasks/next${q}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_claim': {
            const r = await api('POST', `/api/tasks/${encodeURIComponent(args.id)}/claim`, {
                workerId: args.workerId,
                ttlMs: args.ttlMs,
            });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_release': {
            const r = await api('POST', `/api/tasks/${encodeURIComponent(args.id)}/release`, {
                workerId: args.workerId,
            });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_set_status': {
            const r = await api('PATCH', `/api/tasks/${encodeURIComponent(args.id)}/status`, {
                status: args.status,
            });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        case 'task_delete': {
            const r = await api('DELETE', `/api/tasks/${encodeURIComponent(args.id)}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
        }
        default:
            return { isError: true, content: [{ type: 'text', text: `unknown tool: ${name}` }] };
    }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', async (line) => {
    let msg;
    try {
        msg = JSON.parse(line);
    } catch {
        return;
    }
    if (msg.method === 'initialize') {
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: { listChanged: false } },
                serverInfo: { name: 'aios-tasks', version: '1.0.0' },
            },
        });
        return;
    }
    if (msg.method === 'notifications/initialized') return;
    if (msg.method === 'tools/list') {
        send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } });
        return;
    }
    if (msg.method === 'tools/call') {
        const result = await handleCall(msg.params?.name, msg.params?.arguments);
        send({ jsonrpc: '2.0', id: msg.id, result });
        return;
    }
});
