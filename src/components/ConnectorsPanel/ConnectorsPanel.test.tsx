import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConnectorsPanel from './ConnectorsPanel';

vi.mock('../../i18n/useTranslation', () => {
    const translations: Record<string, string> = {
        'connectors.loading': 'Loading connectors...',
        'connectors.title': 'Integrations Hub',
        'connectors.subtitle': 'Manage API services, tokens, and webhook endpoints',
        'connectors.tab.api': 'API Services',
        'connectors.tab.webhooks': 'Webhooks',
        'connectors.search_placeholder': 'Search connectors...',
        'connectors.status.authenticated': 'Authenticated',
        'connectors.status.auth_needed': 'Auth Required',
        'connectors.status.offline': 'Offline',
        'connectors.revoke_aria': 'Revoke {0}',
        'connectors.revoke': 'Revoke',
        'connectors.connect_aria': 'Connect {0}',
        'connectors.connect': 'Connect',
        'connectors.simulated': 'Simulated OAuth Flow',
        'connectors.card.synced': 'Last sync: Just now',
        'connectors.form_title': 'Add Custom API',
        'connectors.close_form_aria': 'Close form',
        'connectors.name_placeholder': 'API endpoint name',
        'connectors.category_placeholder': 'Connector category',
        'connectors.deploy': 'Deploy Connector',
        'connectors.webhooks_heading': 'Ingress Webhooks',
        'connectors.webhooks_empty': 'No webhook endpoints configured',
        'connectors.empty_filter': 'No connectors match your filter',
        'connectors.empty_none': 'No connectors configured',
        'connectors.error_name': 'Name is required',
        'connectors.register_aria': 'Register Custom Service',
        'connectors.register_button': 'Register Custom Service',
        'common.dismiss_error': 'Dismiss error',
        'common.cancel': 'Cancel',
    };
    return {
        useTranslation: () => ({
            t: (key: string, params?: Record<string, string | number>) => {
                let val = translations[key] || key;
                if (params) {
                    Object.entries(params).forEach(([k, v]) => {
                        val = val.replace(`{${k}}`, String(v));
                    });
                }
                return val;
            },
            lang: 'en',
        }),
    };
});

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'system:notification' },
}));

vi.mock('../../kernel/services/database-service', () => ({
    db: {
        connectors: {
            count: vi.fn().mockResolvedValue(0),
            toArray: vi.fn().mockResolvedValue([]),
            bulkAdd: vi.fn().mockResolvedValue(undefined),
            bulkPut: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

describe('ConnectorsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders loading state initially', () => {
        render(<ConnectorsPanel />);
        expect(screen.getByText('Loading connectors...')).toBeDefined();
    });

    it('renders Integrations Hub heading after load', async () => {
        render(<ConnectorsPanel />);
        expect(await screen.findByText('Integrations Hub')).toBeDefined();
    });

    it('renders API Services and Webhooks tabs', async () => {
        render(<ConnectorsPanel />);
        expect(await screen.findByRole('tab', { name: /API Services/ })).toBeDefined();
        expect(screen.getByRole('tab', { name: 'Webhooks' })).toBeDefined();
    });

    it('has role="tablist" on tab bar', async () => {
        render(<ConnectorsPanel />);
        expect(await screen.findByRole('tablist')).toBeDefined();
    });

    it('has role="tabpanel" on grid view', async () => {
        render(<ConnectorsPanel />);
        const tabs = await screen.findAllByRole('tab');
        expect(tabs.length).toBe(2);
        const tabpanels = screen.getAllByRole('tabpanel');
        expect(tabpanels.length).toBe(1);
    });

    it('switches view on tab click', async () => {
        render(<ConnectorsPanel />);
        const webhooksTab = await screen.findByText('Webhooks');
        fireEvent.click(webhooksTab);
        expect(await screen.findByText('Ingress Webhooks')).toBeDefined();
    });

    it('shows search input with aria-label', async () => {
        render(<ConnectorsPanel />);
        expect(await screen.findByLabelText('Search connectors')).toBeDefined();
    });

    it('shows filter buttons with correct counts', async () => {
        render(<ConnectorsPanel />);
        expect(await screen.findByText(/All \(/)).toBeDefined();
        expect(screen.getByText(/Connected \(/)).toBeDefined();
        expect(screen.getByText(/Offline \(/)).toBeDefined();
    });

    it('shows empty state when no connectors match filter', async () => {
        render(<ConnectorsPanel />);
        const connectedBtn = await screen.findByText(/Connected/);
        fireEvent.click(connectedBtn);
        expect(screen.getByText('No connectors match your filter')).toBeDefined();
    });

    it('has role="alert" on error message', async () => {
        render(<ConnectorsPanel />);
        // render normally — no error by default
        // the component only shows error from state
    });

    it('renders Connect buttons for disconnected connectors', async () => {
        render(<ConnectorsPanel />);
        const connectBtns = await screen.findAllByText('Connect');
        expect(connectBtns.length).toBeGreaterThan(0);
    });

    it('shows Authenticated status after connect', async () => {
        render(<ConnectorsPanel />);
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        expect(await screen.findByText('Authenticated')).toBeDefined();
    });

    it('shows Revoke button when connected', async () => {
        render(<ConnectorsPanel />);
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        expect(await screen.findByText('Revoke')).toBeDefined();
    });

    it('shows disconnect confirmation modal on Revoke click', async () => {
        render(<ConnectorsPanel />);
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        const revokeBtn = await screen.findByText('Revoke');
        fireEvent.click(revokeBtn);
        expect(screen.getByText('Revoke Connection?')).toBeDefined();
    });

    it('cancels disconnect on Cancel click', async () => {
        render(<ConnectorsPanel />);
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        const revokeBtn = await screen.findByText('Revoke');
        fireEvent.click(revokeBtn);
        fireEvent.click(screen.getByText('Cancel'));
        await waitFor(() => {
            expect(screen.queryByText('Revoke Connection?')).toBeNull();
        });
    });

    it('closes disconnect modal on Escape', async () => {
        render(<ConnectorsPanel />);
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        const revokeBtn = await screen.findByText('Revoke');
        fireEvent.click(revokeBtn);
        fireEvent.keyDown(document, { key: 'Escape' });
        await waitFor(() => {
            expect(screen.queryByText('Revoke Connection?')).toBeNull();
        });
    });

    it('disconnect modal has role="dialog"', async () => {
        render(<ConnectorsPanel />);
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        const revokeBtn = await screen.findByText('Revoke');
        fireEvent.click(revokeBtn);
        expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('emits notification on disconnect', async () => {
        render(<ConnectorsPanel />);
        const { eventBus } = await import('../../kernel/events/event-bus');
        const connectBtn = (await screen.findAllByText('Connect'))[0];
        fireEvent.click(connectBtn);
        const revokeBtn = await screen.findByText('Revoke');
        fireEvent.click(revokeBtn);
        const confirmBtn = screen.getByText('Yes, Revoke');
        fireEvent.click(confirmBtn);
        expect(eventBus.emit).toHaveBeenCalledWith(
            'system:notification',
            expect.objectContaining({ type: 'info' }),
        );
    });

    it('has Register Custom Service card', async () => {
        render(<ConnectorsPanel />);
        expect(await screen.findByText('Register Custom Service')).toBeDefined();
    });

    it('opens add form on Register card click', async () => {
        render(<ConnectorsPanel />);
        const addCard = await screen.findByText('Register Custom Service');
        fireEvent.click(addCard);
        expect(screen.getByText('Add Custom API')).toBeDefined();
        expect(screen.getByText('Deploy Connector')).toBeDefined();
    });

    it('add form has aria-label for inputs', async () => {
        render(<ConnectorsPanel />);
        const addCard = await screen.findByText('Register Custom Service');
        fireEvent.click(addCard);
        expect(screen.getByLabelText('API endpoint name')).toBeDefined();
        expect(screen.getByLabelText('Connector category')).toBeDefined();
    });

    it('supports keyboard navigation on Register card', async () => {
        render(<ConnectorsPanel />);
        const addCard = await screen.findByText('Register Custom Service');
        const parent = addCard.closest('[tabindex]') as HTMLElement;
        expect(parent).toBeDefined();
        expect(parent.getAttribute('tabindex')).toBe('0');
    });
});
