import { test, expect } from '@playwright/test';
import WebSocket from 'ws';
import { boot } from './helpers';

// Sync data-flow (T-H-7): auth + broadcast against a live sync-server
// (second webServer in playwright.config.ts, test-only secret).
// Covers: bad token -> 401, valid PUT -> 200, PUT -> WS db_changed
// broadcast (the P-MED-1 path end to end).

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
