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

describe('CostsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the empty state when there are no costs', async () => {
        const Panel = (await import('./CostsPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('costs.empty')).toBeDefined();
    });

    it('renders legacy cost events without cents or timestamps', async () => {
        const { gatewayApi } = await import('./Common');
        vi.mocked(gatewayApi).mockImplementation((_base: string, _secret: string, path: string) => {
            if (path === '/api/companies') {
                return Promise.resolve({
                    companies: [{ id: 'c1', name: 'Acme' }],
                });
            }
            if (path.endsWith('/agents')) return Promise.resolve({ agents: [] });
            if (path.endsWith('/budget')) return Promise.resolve({ budget: null });
            if (path.includes('/costs')) {
                return Promise.resolve({ costs: [{ id: 'e1' }] });
            }
            return Promise.resolve({});
        });
        const Panel = (await import('./CostsPanel')).default;
        render(<Panel />);
        await screen.findByText('Acme');
        // Missing cents/timestamps render dashes, never undefined/Invalid Date.
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('undefined')).toBeNull();
        expect(screen.queryByText('Invalid Date')).toBeNull();
    });
});
