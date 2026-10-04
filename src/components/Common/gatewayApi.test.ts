import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveGatewayPolicy, gatewayApi } from './gatewayApi';

describe('resolveGatewayPolicy (C-7)', () => {
    it('allows loopback http and public https', () => {
        expect(resolveGatewayPolicy('http://localhost:3001')).toEqual({ allowed: true });
        expect(resolveGatewayPolicy('http://127.0.0.1:3001')).toEqual({ allowed: true });
        expect(resolveGatewayPolicy('https://gateway.example.com')).toEqual({ allowed: true });
    });

    it('blocks plaintext http to non-loopback hosts', () => {
        expect(resolveGatewayPolicy('http://192.168.1.10:3001').allowed).toBe(false);
        expect(resolveGatewayPolicy('http://gateway.example.com').allowed).toBe(false);
    });

    it('blocks non-http schemes, creds and garbage', () => {
        expect(resolveGatewayPolicy('ftp://gateway.example.com/').allowed).toBe(false);
        expect(resolveGatewayPolicy('https://user:pass@gateway.example.com/').allowed).toBe(false);
        expect(resolveGatewayPolicy('not a url').allowed).toBe(false);
    });

    it('enforces the pinned origin when configured', () => {
        const pinned = 'https://gateway.example.com';
        expect(resolveGatewayPolicy('https://gateway.example.com/api', pinned)).toEqual({
            allowed: true,
        });
        const swapped = resolveGatewayPolicy('https://attacker.example/api', pinned);
        expect(swapped.allowed).toBe(false);
        if (!swapped.allowed) {
            expect(swapped.reason).toMatch(/not pinned/);
        }
        // Pinning compares origins, not prefixes.
        expect(
            resolveGatewayPolicy('https://gateway.example.com.evil.com/', pinned).allowed,
        ).toBe(false);
    });
});

describe('gatewayApi enforcement (C-7)', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('throws before fetch on plaintext non-loopback base', async () => {
        const fetchMock = vi.fn(async () => {
            throw new Error('fetch must not be called');
        });
        vi.stubGlobal('fetch', fetchMock);
        await expect(gatewayApi('http://192.168.1.10:3001', 's3cr3t', '/api/companies')).rejects.toThrow(
            /gateway blocked/i,
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends Bearer on allowed bases', async () => {
        const fetchMock = vi.fn(
            async (_url: string, _init?: RequestInit) => ({
                ok: true,
                json: async () => ({ companies: [] }),
            }),
        );
        vi.stubGlobal('fetch', fetchMock);
        await gatewayApi('http://localhost:3001', 's3cr3t', '/api/companies');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
        expect((init?.headers as Record<string, string>)?.['Authorization']).toBe(
            'Bearer s3cr3t',
        );
    });

    it('refuses swapped origin when VITE_COMPANY_GATEWAY_URL is pinned', async () => {
        vi.stubEnv('VITE_COMPANY_GATEWAY_URL', 'https://gateway.example.com');
        const fetchMock = vi.fn(async () => {
            throw new Error('fetch must not be called');
        });
        vi.stubGlobal('fetch', fetchMock);
        await expect(
            gatewayApi('https://attacker.example', 's3cr3t', '/api/companies'),
        ).rejects.toThrow(/not pinned/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
