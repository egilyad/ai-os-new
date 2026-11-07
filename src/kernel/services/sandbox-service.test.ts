import { describe, it, expect, vi, afterEach } from 'vitest';
import { SandboxService } from './sandbox-service';

function makeService() {
    return new SandboxService({ toolService: { execute: vi.fn() } });
}

function jsonResponse(body: string, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => body,
        body: null,
    } as unknown as Response;
}

describe('SandboxService.fetchUrl', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects non-https URLs before any fetch', async () => {
        const svc = makeService();
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(svc.fetchUrl('http://example.com')).rejects.toThrow(/URL rejected/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects private/local hosts (SSRF guard)', async () => {
        const svc = makeService();
        vi.stubGlobal('fetch', vi.fn());
        await expect(svc.fetchUrl('https://localhost:8080/x')).rejects.toThrow(/URL rejected/);
        await expect(svc.fetchUrl('https://127.0.0.1/x')).rejects.toThrow(/URL rejected/);
    });

    it('fetches an allowed https URL', async () => {
        const svc = makeService();
        const fetchMock = vi.fn(async () => jsonResponse('hello world'));
        vi.stubGlobal('fetch', fetchMock);
        await expect(svc.fetchUrl('https://api.example.com/data')).resolves.toBe('hello world');
    });

    it('throws on non-2xx responses', async () => {
        const svc = makeService();
        vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('oops', 500)));
        await expect(svc.fetchUrl('https://api.example.com/data')).rejects.toThrow(/HTTP 500/);
    });
});
