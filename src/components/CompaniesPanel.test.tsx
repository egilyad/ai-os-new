import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./Common', () => ({
    gatewayApi: vi.fn(() => Promise.resolve({ companies: [] })),
    DEFAULT_GATEWAY_URL: 'http://localhost:3001',
}));

const { frontierState } = vi.hoisted(() => ({
    frontierState: {
        orgs: [] as Array<{ id: string; name: string; mission?: string }>,
        refresh: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('../stores/frontierStore', () => ({
    useFrontierStore: (selector?: (s: typeof frontierState) => unknown) =>
        selector ? selector(frontierState) : frontierState,
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('CompaniesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        frontierState.orgs = [];
    });

    it('shows the empty state when the gateway has no companies', async () => {
        const Panel = (await import('./CompaniesPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('companies.empty')).toBeDefined();
    });

    it('falls back to local orgs with an honest banner on gateway failure', async () => {
        const { gatewayApi } = await import('./Common');
        vi.mocked(gatewayApi).mockRejectedValueOnce(new Error('connection refused'));
        const Panel = (await import('./CompaniesPanel')).default;
        render(<Panel />);
        // Banner text is split across text nodes — match by pattern.
        const banners = await screen.findAllByText(/companies\.no_gateway/);
        expect(banners.length).toBeGreaterThanOrEqual(1);
        expect((await screen.findAllByText(/companies\.local_fallback/)).length).toBeGreaterThanOrEqual(1);
    });

    it('renders fallback orgs without a mission', async () => {
        const { gatewayApi } = await import('./Common');
        vi.mocked(gatewayApi).mockRejectedValueOnce(new Error('down'));
        frontierState.orgs = [{ id: 'o1', name: 'Legacy Org' }];
        const Panel = (await import('./CompaniesPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Legacy Org')).toBeDefined();
        expect(screen.queryByText('undefined')).toBeNull();
    });
});
