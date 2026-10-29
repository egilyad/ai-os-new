/**
 * BrowserUseService tests (Phase 70) — executor wiring over governance layers.
 * Verifies: task validation, sensitive-pattern block, direct-sidecar POST,
 * gateway 2-step flow, not-configured error. No real network (fetch stubbed).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserUseService } from './browser-use-service';

function fakeBus() {
    return { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never;
}

function jsonResponse(body: unknown, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
        json: async () => body,
    } as Response;
}

describe('BrowserUseService (phase70)', () => {
    const realFetch = globalThis.fetch;

    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
        vi.unstubAllGlobals();
    });

    it('throws when neither sidecar nor gateway is configured', async () => {
        // Явный пустой конфиг: фолбэк НЕ применяется (пусто значит пусто).
        const svc = new BrowserUseService({ events: fakeBus(), getConfig: () => ({}) });
        expect(svc.isConfigured()).toBe(false);
        await expect(svc.execute('open https://example.com')).rejects.toThrow(/not configured/);
        await svc.destroy();
    });

    it('defaults to localhost sidecar when nothing is stored', async () => {
        const svc = new BrowserUseService({ events: fakeBus() });
        expect(svc.isConfigured()).toBe(true);
        expect(svc.describe()).toContain('http://localhost:3100/execute');
        await svc.destroy();
    });

    it('large screenshots survive transport intact (no truncation breakage)', async () => {
        const big = 'iVBOR'.repeat(20000); // 100K chars of screenshot
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                status: 200,
                text: async () =>
                    JSON.stringify({
                        screenshot: big,
                        actions: [{ goto: 'https://example.com' }],
                        finalState: { url: 'https://example.com', title: 'Example', mode: 'x' },
                    }),
            })),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        const res = await svc.execute('open https://example.com');
        expect(res.screenshot).toBe(big);
        expect(res.finalState).toMatchObject({ title: 'Example' });
        await svc.destroy();
    });

    it('recovers screenshot from JSON with surrounding noise', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                status: 200,
                text: async () =>
                    `prefix-noise {"screenshot": "iVBORw0K", "finalState": {}} trailing`,
            })),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        const res = await svc.execute('open https://example.com');
        expect(res.screenshot).toBe('iVBORw0K');
        await svc.destroy();
    });

    it('unreachable sidecar fails with a runnable hint, not bare fetch error', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('fetch failed');
            }),
        );
        const svc = new BrowserUseService({ events: fakeBus() });
        await expect(svc.execute('open https://example.com')).rejects.toThrow(/is it running/);
        await svc.destroy();
    });

    it('blocks sensitive patterns in task (harness policy reuse)', async () => {
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        await expect(svc.execute('type my password 123 into the form')).rejects.toThrow(
            /sensitive/,
        );
        await expect(svc.execute('   ')).rejects.toThrow(/task is required/);
        await svc.destroy();
    });

    it('POSTs task to sidecar and parses JSON result', async () => {
        const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
            expect(body['task']).toContain('example.com');
            expect(body['maxSteps']).toBe(15);
            return jsonResponse({
                screenshot: 'iVBORw0KGgo=',
                actions: ['goto'],
                finalState: 'done',
            });
        });
        vi.stubGlobal('fetch', fetchMock);
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        expect(svc.isConfigured()).toBe(true);
        const res = await svc.execute('open https://example.com and screenshot', {
            ticketId: 'sbx-1',
        });
        expect(res.ok).toBe(true);
        expect(res.via).toBe('sidecar');
        expect(res.screenshot).toBe('iVBORw0KGgo=');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('http://localhost:3100/execute');
        expect(init.redirect).toBe('manual');
        await svc.destroy();
    });

    it('sidecar HTTP error surfaces as throw', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => jsonResponse('timeout', 500)),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        await expect(svc.execute('open https://example.com')).rejects.toThrow(/HTTP 500/);
        await svc.destroy();
    });

    it('gateway mode: creates run then executes with browser-use adapter', async () => {
        const calls: Array<{ url: string; body: unknown }> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
                calls.push({ url, body });
                if (url.endsWith('/runs')) return jsonResponse({ run: { id: 'run-1' } });
                expect(body['adapter'] as string).toBe('browser-use');
                return jsonResponse({
                    stdout: JSON.stringify({ screenshot: 'iVBOR', actions: [] }),
                });
            }),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({
                gatewayUrl: 'http://localhost:3001',
                gatewaySecret: 's3cr3t',
                companyId: 'co-1',
            }),
        });
        const res = await svc.execute('open https://example.com');
        expect(res.via).toBe('gateway');
        expect(res.screenshot).toBe('iVBOR');
        expect(calls).toHaveLength(2);
        expect(calls[0]?.url).toContain('/api/companies/co-1/runs');
        expect(calls[1]?.url).toContain('/api/runs/run-1/execute');
        await svc.destroy();
    });

    it('clamps maxSteps to 1..50', async () => {
        let seenMax = 0;
        vi.stubGlobal(
            'fetch',
            vi.fn(async (_url: string, init?: RequestInit) => {
                seenMax = (JSON.parse(String(init?.body)) as { maxSteps: number }).maxSteps;
                return jsonResponse({ ok: true });
            }),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        await svc.execute('open https://example.com', { maxSteps: 999 });
        expect(seenMax).toBe(50);
        await svc.destroy();
    });

    it('act: POSTs to /act with action+params and parses output/screenshot', async () => {
        const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
            expect(body['action']).toBe('click_selector');
            expect(body['selector']).toBe('#buy');
            return jsonResponse({ output: 'clicked selector #buy', screenshot: 'iVBOR=' });
        });
        vi.stubGlobal('fetch', fetchMock);
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        const res = await svc.act('click_selector', { selector: '#buy' });
        expect(res.ok).toBe(true);
        expect(res.via).toBe('sidecar');
        expect(res.output).toBe('clicked selector #buy');
        expect(res.screenshot).toBe('iVBOR=');
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('http://localhost:3100/act');
        expect(init.redirect).toBe('manual');
        await svc.destroy();
    });

    it('act: schema extraction forwards schema object', async () => {
        const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
            expect(body['action']).toBe('extract_schema');
            expect((body['schema'] as Record<string, string>)['price']).toBe('#price');
            return jsonResponse({ output: '{"price":"990 ₽"}' });
        });
        vi.stubGlobal('fetch', fetchMock);
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        const res = await svc.act('extract_schema', { schema: { price: '#price' } });
        expect(res.output).toContain('990 ₽');
        await svc.destroy();
    });

    it('act: unreachable sidecar fails with runnable hint', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('fetch failed');
            }),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        await expect(svc.act('click_selector', { selector: '#buy' })).rejects.toThrow(
            /npm run browser:sidecar/,
        );
        await svc.destroy();
    });

    it('act: sidecar error field surfaces', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => jsonResponse({ error: 'selector not found' }, 500)),
        );
        const svc = new BrowserUseService({
            events: fakeBus(),
            getConfig: () => ({ sidecarUrl: 'http://localhost:3100/execute' }),
        });
        await expect(svc.act('extract_text_selector', { selector: '#x' })).rejects.toThrow(
            /selector not found/,
        );
        await svc.destroy();
    });

    it('act: throws when no sidecar configured', async () => {
        const svc = new BrowserUseService({ events: fakeBus(), getConfig: () => ({}) });
        await expect(svc.act('click_selector', { selector: '#buy' })).rejects.toThrow(
            /not configured/,
        );
        await svc.destroy();
    });
});
