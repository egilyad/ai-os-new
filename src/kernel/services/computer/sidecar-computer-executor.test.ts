/**
 * SidecarComputerExecutor tests (Phase 71) — транспорт к sidecar `/act`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { SidecarComputerExecutor, DEFAULT_ACT_URL } from './sidecar-computer-executor';

describe('SidecarComputerExecutor (phase71)', () => {
    const realFetch = globalThis.fetch;

    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
        vi.unstubAllGlobals();
    });

    it('uses default act URL and posts action + ticketId', async () => {
        const seen: Array<{ url: string; init?: RequestInit }> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                seen.push({ url, init });
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ screenshot: 'iVBOR', output: 'clicked' }),
                };
            }) as unknown as typeof fetch,
        );
        const ex = new SidecarComputerExecutor();
        expect(ex.actUrl()).toBe(DEFAULT_ACT_URL);
        const res = await ex.execute({ action: 'left_click', coordinate: [10, 20] }, { ticketId: 'sbx-1' });
        expect(res.screenshotBase64).toBe('iVBOR');
        expect(res.output).toBe('clicked');
        assert.equal(seen.length, 1);
        expect(seen[0].url).toBe(DEFAULT_ACT_URL);
        const body = JSON.parse(String(seen[0].init?.body)) as Record<string, unknown>;
        expect(body).toMatchObject({ action: 'left_click', coordinate: [10, 20], ticketId: 'sbx-1' });
        expect(seen[0].init?.redirect).toBe('manual');
    });

    it('honors configured actUrl (trailing slash trimmed)', () => {
        const ex = new SidecarComputerExecutor({ getConfig: () => ({ actUrl: 'http://sidecar:3100/act/' }) });
        expect(ex.actUrl()).toBe('http://sidecar:3100/act');
    });

    it('refuses redirects and surfaces actuator errors', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: true, status: 302, json: async () => ({}) })) as unknown as typeof fetch,
        );
        const ex = new SidecarComputerExecutor();
        await expect(ex.execute({ action: 'screenshot' }, {})).rejects.toThrow(/redirect/);

        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: false,
                status: 502,
                json: async () => ({ error: 'playwright crashed' }),
            })) as unknown as typeof fetch,
        );
        await expect(ex.execute({ action: 'screenshot' }, {})).rejects.toThrow(/playwright crashed/);
    });

    it('routes to gateway when no direct URL but gateway triple set', async () => {
        const calls: Array<{ url: string; body: unknown }> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
                calls.push({ url, body });
                if (url.endsWith('/runs')) return { ok: true, status: 200, json: async () => ({ run: { id: 'run-7' } }) };
                expect((body['adapter'] as string)).toBe('computer-act');
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ stdout: JSON.stringify({ screenshot: 'gw-shot', output: 'ok' }) }),
                };
            }) as unknown as typeof fetch,
        );
        const ex = new SidecarComputerExecutor({
            getConfig: () => ({ gatewayUrl: 'https://gw.example.com', gatewaySecret: 's3', companyId: 'co-9' }),
        });
        expect(ex.describeRoute()).toBe('gateway');
        const res = await ex.execute({ action: 'screenshot' }, { ticketId: 't1' });
        expect(res.screenshotBase64).toBe('gw-shot');
        expect(calls).toHaveLength(2);
        expect(calls[0]?.url).toContain('/api/companies/co-9/runs');
        expect(calls[1]?.url).toContain('/api/runs/run-7/execute');
        const execBody = calls[1]?.body as Record<string, unknown>;
        expect(execBody['input']).toMatchObject({ action: 'screenshot', ticketId: 't1' });
    });

    it('describeRoute prefers explicit direct URL over gateway', () => {
        const both = new SidecarComputerExecutor({
            getConfig: () => ({ actUrl: 'http://x/act', gatewayUrl: 'https://g', gatewaySecret: 's', companyId: 'c' }),
        });
        expect(both.describeRoute()).toBe('direct');
        const none = new SidecarComputerExecutor({ getConfig: () => ({}) });
        expect(none.describeRoute()).toBe('direct-default');
    });

    it('passes through action-level error without throwing', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                status: 200,
                json: async () => ({ error: 'click missed', screenshot: 'shot' }),
            })) as unknown as typeof fetch,
        );
        const ex = new SidecarComputerExecutor();
        const res = await ex.execute({ action: 'left_click', coordinate: [5, 5] }, {});
        expect(res.error).toBe('click missed');
        expect(res.screenshotBase64).toBe('shot');
    });
});
