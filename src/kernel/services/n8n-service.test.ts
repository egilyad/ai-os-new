import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = { content: string };
const rows: Row[] = [];

vi.mock('./database-service', () => ({
    getDexieDb: () => ({
        agentMemory: {
            // Mirrors the Dexie chain used in the service:
            // where().equals().toArray().
            where: () => ({
                equals: () => ({
                    toArray: async () => rows,
                }),
            }),
            add: async (row: Row) => {
                rows.push(row);
            },
        },
    }),
}));

import { n8nService } from './n8n-service';

describe('N8NService config validation (C-3)', () => {
    beforeEach(() => {
        rows.length = 0;
        vi.unstubAllGlobals();
    });

    it('setConfig rejects dangerous URLs without touching memory', async () => {
        for (const url of [
            'javascript:alert(1)',
            'http://169.254.169.254/latest/meta-data/',
            'http://127.0.0.1:5678/',
            'https://user:pass@n8n.example.com/',
            'not a url',
        ]) {
            await expect(n8nService.setConfig('a1', url, 'k')).rejects.toThrow(
                /invalid n8n url/i,
            );
        }
        expect(rows).toHaveLength(0);
    });

    it('setConfig accepts public https and LAN http', async () => {
        await n8nService.setConfig('a1', 'https://n8n.example.com/', 'k1');
        await n8nService.setConfig('a1', 'http://192.168.1.10:5678/', 'k2');
        expect(rows).toHaveLength(2);
    });

    it('trigger never fetches a poisoned stored URL (falls back to older valid row)', async () => {
        rows.push({
            content: JSON.stringify({
                kind: 'n8n',
                n8nApiUrl: 'https://n8n.example.com/',
                n8nApiKey: 'good-key',
            }),
        });
        rows.push({
            content: JSON.stringify({
                kind: 'n8n',
                n8nApiUrl: 'http://169.254.169.254/',
                n8nApiKey: 'evil-key',
            }),
        });
        const fetchMock = vi.fn(
            async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({}) }),
        );
        vi.stubGlobal('fetch', fetchMock);
        await n8nService.trigger('a1', 'wf1', { x: 1 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const calledUrl = String(fetchMock.mock.calls[0]?.[0] ?? '');
        expect(calledUrl).toContain('n8n.example.com');
        expect(calledUrl).not.toContain('169.254');
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            headers: expect.objectContaining({ 'X-N8N-API-KEY': 'good-key' }),
        });
    });

    it('trigger throws instead of fetching when only a poisoned row exists', async () => {
        rows.push({
            content: JSON.stringify({
                kind: 'n8n',
                n8nApiUrl: 'http://127.0.0.1:5678/',
                n8nApiKey: 'k',
            }),
        });
        const fetchMock = vi.fn(
            async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({}) }),
        );
        vi.stubGlobal('fetch', fetchMock);
        await expect(n8nService.trigger('a1', 'wf1', {})).rejects.toThrow(/no n8n url/i);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('skips rows with non-string urls', async () => {
        rows.push({ content: JSON.stringify({ kind: 'n8n', n8nApiUrl: 42 }) });
        const fetchMock = vi.fn(
            async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({}) }),
        );
        vi.stubGlobal('fetch', fetchMock);
        await expect(n8nService.trigger('a1', 'wf1', {})).rejects.toThrow(/no n8n url/i);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
