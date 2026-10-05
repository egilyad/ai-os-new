import { test, expect } from '@playwright/test';
import WebSocket from 'ws';
import { boot } from './helpers';

// Sync data-flow (T-H-7): auth + broadcast against a live sync-server
// (second webServer in playwright.config.ts, test-only secret).
// Covers: bad token -> 401, valid PUT -> 200, PUT -> WS db_changed
// broadcast (the P-MED-1 path end to end), plus negative paths:
// disallowed Origin -> 403, wrong content-type -> 400, >50MB -> 413.
//
// T-H-7 remainder (documented, not worked around): chat-driven security
// flows are not e2e-coverable through the UI — there is no affordance to
// force a tool call, an n8n trigger, a primary-provider failure, or an
// SSRF URL from chat. They stay covered at unit level, all in CI gates:
//   fallback path ......... src/llm/decorators/fallback-decorator.test.ts
//   httpGuard/SSRF ........ src/kernel/utils/network.test.ts
//   tool runner ........... src/kernel/services/parity/tool-runner-service.test.ts
//   sandbox ............... sandbox-interpreter.test.ts, code-sandbox-service.test.ts
//   n8n trigger ........... src/kernel/services/n8n-service.test.ts

const SYNC_URL = 'http://localhost:3001';
const SECRET = 'e2e-test-secret';
// page.request runs in Node (no implicit Origin); the server requires one
// on mutating requests.
const ORIGIN_HEADERS = { Origin: 'http://localhost:5199' };

test.describe('AI-OS Data Sync', () => {
    test.beforeEach(async ({ page }) => {
        await boot(page);
    });

    test('PUT /api/db rejects a bad token with 401', async ({ request }) => {
        const res = await request.put(`${SYNC_URL}/api/db`, {
            headers: {
                ...ORIGIN_HEADERS,
                'Content-Type': 'application/octet-stream',
                Authorization: 'Bearer wrong-secret',
            },
            data: Buffer.from('{"x":1}'),
        });
        expect(res.status()).toBe(401);
    });

    test('PUT /api/db from a disallowed Origin is rejected with 403', async ({ request }) => {
        const res = await request.put(`${SYNC_URL}/api/db`, {
            headers: {
                Origin: 'http://evil.example',
                'Content-Type': 'application/octet-stream',
                Authorization: `Bearer ${SECRET}`,
            },
            data: Buffer.from('{"x":1}'),
        });
        expect(res.status()).toBe(403);
    });

    test('PUT /api/db with a wrong content-type is rejected with 400', async ({
        request,
    }) => {
        const res = await request.put(`${SYNC_URL}/api/db`, {
            headers: {
                ...ORIGIN_HEADERS,
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SECRET}`,
            },
            data: Buffer.from('{"x":1}'),
        });
        expect(res.status()).toBe(400);
    });

    test('PUT /api/db over 50MB is rejected with 413', async ({ request }) => {
        const res = await request.put(`${SYNC_URL}/api/db`, {
            headers: {
                ...ORIGIN_HEADERS,
                'Content-Type': 'application/octet-stream',
                Authorization: `Bearer ${SECRET}`,
            },
            data: Buffer.alloc(51 * 1024 * 1024, 0x61),
            timeout: 120000,
        });
        expect(res.status()).toBe(413);
    });

    test('valid PUT persists and broadcasts db_changed over WS', async ({ page, request }) => {
        // NOTE: opened from Node, not from the page — the app CSP does not
        // allow ws://localhost:3001 from page context.
        const msgs: string[] = [];
        const ws = new WebSocket('ws://localhost:3001/', ['sync-token', SECRET]);
        // Attach synchronously: the greeting can arrive in the same tick as open.
        ws.on('message', (data) => msgs.push(String(data)));
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('WS open timeout')), 15000);
            ws.on('open', () => {
                clearTimeout(timer);
                resolve();
            });
            ws.on('error', (e) => {
                clearTimeout(timer);
                reject(e);
            });
        });
        // Server greets with {type:'connected'} on handshake.
        await expect
            .poll(() => msgs.some((m) => m.includes('connected')), { timeout: 15000 })
            .toBe(true);
        // T-H-6: server echoes the negotiated subprotocol.
        expect(ws.protocol).toBe('sync-token');

        const res = await request.put(`${SYNC_URL}/api/db`, {
            headers: {
                ...ORIGIN_HEADERS,
                'Content-Type': 'application/octet-stream',
                Authorization: `Bearer ${SECRET}`,
            },
            data: Buffer.from(JSON.stringify({ e2e: 'sync-write', at: Date.now() })),
        });
        if (res.status() !== 200) {
            console.log('DIAG PUT', res.status(), (await res.text()).slice(0, 300));
        }
        expect(res.status()).toBe(200);
        expect(await res.json()).toMatchObject({ status: 'ok' });

        await expect
            .poll(() => msgs.some((m) => m.includes('db_changed')), { timeout: 15000 })
            .toBe(true);
        ws.close();
    });
});
