import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { boot } from './helpers';

// OpenCode safe-flow (AGEMS REST + MCP): the full external agent cycle
// create -> next -> claim -> set-status -> release against a live
// sync-server, plus an MCP-server probe that surfaces the same tools.
// The MCP server is exercised over stdio (like opencode would launch it).

const SYNC_URL = 'http://localhost:3001';
const SECRET = 'e2e-test-secret';

function mcpCall(server, name, args) {
    return new Promise((resolve, reject) => {
        let buf = '';
        const onData = (d) => {
            buf += d.toString();
            let idx;
            while ((idx = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, idx).trim();
                buf = buf.slice(idx + 1);
                if (!line) continue;
                try {
                    const msg = JSON.parse(line);
                    if (msg.id === 2) {
                        server.stdout.off('data', onData);
                        resolve(msg.result);
                    }
                } catch {
                    /* skip partial */
                }
            }
        };
        server.stdout.on('data', onData);
        server.stdin.write(
            JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: { name, arguments: args },
            }) + '\n',
        );
        setTimeout(() => reject(new Error('mcp timeout')), 15000);
    });
}

test.describe('OpenCode task safe-flow', () => {
    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('full cycle via REST', async ({ request }) => {
        const headers = { Authorization: `Bearer ${SECRET}`, Origin: 'http://localhost:5199' };

        // 1. create
        const created = await request.post(`${SYNC_URL}/api/tasks`, {
            headers,
            data: { title: 'e2e task', assigneeId: 'agent-opencode' },
        });
        expect(created.status()).toBe(201);
        const task = (await created.json()).task;

        // 2. next -> claim
        const next = await request.post(`${SYNC_URL}/api/tasks/next?assigneeId=agent-opencode`, {
            headers,
        });
        expect(next.status()).toBe(200);
        const nextTask = (await next.json()).task;
        expect(nextTask.id).toBe(task.id);
        expect(nextTask.status).toBe('IN_PROGRESS');

        // 3. set status -> IN_REVIEW
        const status = await request.patch(`${SYNC_URL}/api/tasks/${task.id}/status`, {
            headers,
            data: { status: 'IN_REVIEW' },
        });
        expect(status.status()).toBe(200);
        expect((await status.json()).task.status).toBe('IN_REVIEW');

        // 4. release
        const released = await request.post(`${SYNC_URL}/api/tasks/${task.id}/release`, {
            headers,
        });
        expect(released.status()).toBe(200);
        const after = await request.get(`${SYNC_URL}/api/tasks/${task.id}`, { headers });
        expect((await after.json()).task.lockedBy).toBeUndefined();
    });

    test('rest denies mutation on another worker task', async ({ request }) => {
        const headers = { Authorization: `Bearer ${SECRET}`, Origin: 'http://localhost:5199' };
        const created = await request.post(`${SYNC_URL}/api/tasks`, {
            headers,
            data: { title: 'private', assigneeId: 'agent-a' },
        });
        const task = (await created.json()).task;

        const deny = await request.post(`${SYNC_URL}/api/tasks/${task.id}/claim`, {
            headers,
            data: { workerId: 'agent-b' },
        });
        expect(deny.status()).toBe(403);
    });

    test('MCP server exposes task tools and can create', async () => {
        const server = spawn('node', ['cli/tasks-mcp-server.mjs'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, AIOS_SYNC_URL: SYNC_URL, AIOS_SYNC_TOKEN: SECRET },
        });

        try {
            // initialize
            const init = new Promise((resolve) => {
                let buf = '';
                const onData = (d) => {
                    buf += d.toString();
                    const idx = buf.indexOf('\n');
                    if (idx >= 0) {
                        server.stdout.off('data', onData);
                        resolve(JSON.parse(buf.slice(0, idx)));
                    }
                };
                server.stdout.on('data', onData);
                server.stdin.write(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'initialize',
                        params: {
                            protocolVersion: '2024-11-05',
                            capabilities: {},
                            clientInfo: { name: 'e2e', version: '1' },
                        },
                    }) + '\n',
                );
            });
            await init;

            // tools/list
            const tools = await mcpCall(server, 'task_list', {});
            expect(tools.content[0].text).toContain('tasks');

            // task_create via MCP
            const r = await mcpCall(server, 'task_create', {
                title: 'mcp task',
                assigneeId: 'agent-opencode',
            });
            const parsed = JSON.parse(r.content[0].text);
            expect(parsed.task.title).toBe('mcp task');
        } finally {
            server.kill();
        }
    });
});
