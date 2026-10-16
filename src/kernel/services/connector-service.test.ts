import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConnectorService } from './connector-service';
import type { Connector } from '../types/domain-types';

const base: Connector = {
    id: 'c1',
    name: 'Demo',
    type: 'Custom REST',
    description: 'demo',
    color: '#3b82f6',
    status: 'disconnected',
};

const database = {
    getAllConnectors: vi.fn(() => Promise.resolve([])),
    bulkPutConnectors: vi.fn(() => Promise.resolve()),
} as never;

describe('ConnectorService.connect', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('stores an ISO timestamp, not a never-aging display string', async () => {
        const svc = new ConnectorService({ database });
        const out = await svc.connect(base);
        expect(out.status).toBe('connected');
        expect(out.lastSync).toBeDefined();
        expect(Number.isNaN(Date.parse(out.lastSync!))).toBe(false);
        expect(out.lastSync).not.toBe('Just now');
    });

    it('verifies custom endpoints with a real request', async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve({ ok: true, status: 200, statusText: 'OK', body: null }),
        );
        vi.stubGlobal('fetch', fetchMock);
        const svc = new ConnectorService({ database });
        const out = await svc.connect(base, 'https://example.com/health');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.com/health',
            expect.objectContaining({ method: 'HEAD' }),
        );
        expect(out.status).toBe('connected');
        expect(out.lastTested).toBeDefined();
    });

    it('marks auth_required when the endpoint test fails', async () => {
        vi.stubGlobal('fetch', () =>
            Promise.resolve({ ok: false, status: 401, statusText: 'Unauthorized', body: null }),
        );
        const svc = new ConnectorService({ database });
        const out = await svc.connect(base, 'https://example.com/health');
        expect(out.status).toBe('auth_required');
        expect(out.lastSync).toBeUndefined();
    });
});
