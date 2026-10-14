import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolRunnerService } from './tool-runner-service';

function makeService() {
    return new ToolRunnerService({
        events: { emit: vi.fn() } as never,
        llm: {} as never,
    });
}

describe('http.fetch SSRF guard (C-4)', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        'http://127.0.0.1:3001/api/db',
        'http://localhost:3001/api/db',
        'http://10.0.0.5/admin',
        'http://192.168.1.1/',
        'http://172.16.0.1/',
        'http://0.0.0.0/',
        'http://[::1]/',
        'http://[::ffff:127.0.0.1]/',
        'http://169.254.169.254/latest/meta-data/',
        'http://100.64.0.1/',
        'http://0177.0.0.1:3001/api/db',
        'http://2130706433/api/db',
        'http://0x7f.0.0.1/api/db',
        'http://user:pass@192.168.1.1/',
        'ftp://example.com/file',
        'javascript:alert(1)',
        'not a url',
    ])('blocks %s without fetching', async (url) => {
        const fetchMock = vi.fn(async () => {
            throw new Error('fetch must not be called');
        });
        vi.stubGlobal('fetch', fetchMock);
        const svc = makeService();
        await expect(svc.callTool('agent1', 'http.fetch', { url })).rejects.toThrow(
            /private\/local hosts are blocked|only http\(s\)|invalid url|credentials embedded/i,
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('allows public https URLs', async () => {
        const fetchMock = vi.fn(
            async (_url: string, _init?: RequestInit) => ({
                ok: true,
                text: async () => 'hello-public',
            }),
        );
        vi.stubGlobal('fetch', fetchMock);
        const svc = makeService();
        const out = await svc.callTool('agent1', 'http.fetch', {
            url: 'https://example.com/data',
        });
        expect(out).toContain('hello-public');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe('callTool P1 durable trail', () => {
    function makeTrailedService(deps: Record<string, unknown> = {}) {
        const trail: unknown[] = [];
        const svc = new ToolRunnerService({
            events: { emit: vi.fn() } as never,
            llm: {} as never,
            toolTrail: {
                record: async (entry: unknown) => {
                    trail.push(entry);
                },
            },
            ...deps,
        } as never);
        return { svc, trail: trail as Array<Record<string, unknown>> };
    }

    it('records governance denials without breaking the throw', async () => {
        const { svc, trail } = makeTrailedService({
            governance: { check: async () => false },
        });
        svc.addTool({ name: 't', description: 't', run: async () => 'never' });
        await expect(svc.callTool('agent1', 't', {})).rejects.toThrow(/denied for .* by policy/);
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('denied');
        expect(trail[0]!['reason']).toMatch(/denied for .* by policy/);
        expect(trail[0]!['link']).toMatchObject({ agentId: 'agent1' });
    });

    it('records unknown tools as errors', async () => {
        const { svc, trail } = makeTrailedService();
        await expect(svc.callTool('agent1', 'nope', {})).rejects.toThrow(/unknown tool/i);
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('error');
    });

    it('records successes with agent linkage', async () => {
        const { svc, trail } = makeTrailedService();
        svc.addTool({ name: 'echo', description: 'echo', run: async (a) => `hi:${String((a as Record<string, unknown>)['x'])}` });
        const out = await svc.callTool('agent9', 'echo', { x: 1 });
        expect(out).toBe('hi:1');
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('success');
        expect(trail[0]!['link']).toMatchObject({ agentId: 'agent9' });
    });

    it('records run failures and still throws', async () => {
        const { svc, trail } = makeTrailedService();
        svc.addTool({
            name: 'boom',
            description: 'boom',
            run: async () => {
                throw new Error('kaput');
            },
        });
        await expect(svc.callTool('agent1', 'boom', {})).rejects.toThrow(/failed: kaput/);
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('error');
        expect(trail[0]!['reason']).toMatch(/kaput/);
    });
});
