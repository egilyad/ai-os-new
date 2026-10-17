import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./Common', () => ({
    gatewayApi: vi.fn((_base: string, _secret: string, path: string) => {
        if (path === '/api/companies') return Promise.resolve({ companies: [] });
        return Promise.resolve({});
    }),
    DEFAULT_GATEWAY_URL: 'http://localhost:3001',
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('RunsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the empty state when there are no runs', async () => {
        const Panel = (await import('./RunsPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('runs.empty')).toBeDefined();
    });

    it('renders legacy runs without timestamps', async () => {
        const { gatewayApi } = await import('./Common');
        vi.mocked(gatewayApi).mockImplementation((_base: string, _secret: string, path: string) => {
            if (path === '/api/companies') {
                return Promise.resolve({ companies: [{ id: 'c1', name: 'Acme' }] });
            }
            if (path.includes('/runs')) {
                return Promise.resolve({ runs: [{ id: 'r1', trigger: 'nightly', status: 'done' }] });
            }
            return Promise.resolve({});
        });
        const Panel = (await import('./RunsPanel')).default;
        render(<Panel />);
        await screen.findByText('Acme');
        expect(await screen.findByText('nightly')).toBeDefined();
        expect(screen.getByText('—')).toBeDefined();
        expect(screen.queryByText('Invalid Date')).toBeNull();
    });
});
