import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AlertsTab from './SettingsPanel/AlertsTab';
import type { WebhookConfig } from '../kernel/instances';

const removeWebhook = vi.hoisted(() => vi.fn());

vi.mock('../kernel/instances', () => ({
    rootLogger: { child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }) },
    notificationWebhookService: {
        getWebhooks: vi.fn(() => []),
        removeWebhook,
        updateWebhook: vi.fn(),
    },
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));

const webhook = {
    id: 'wh-1',
    name: 'Ops',
    url: 'https://example.com/hook',
    provider: 'generic',
    events: ['alert'],
    enabled: true,
} as unknown as WebhookConfig;

describe('AlertsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires confirmation before deleting a webhook', async () => {
        render(
            <AlertsTab
                webhooks={[webhook]}
                setWebhooks={vi.fn()}
                webhookForm={{ name: '', url: '', provider: 'generic', events: [] }}
                setWebhookForm={vi.fn()}
                eventOptions={[]}
                providerOptions={[]}
            />,
        );
        fireEvent.click(screen.getByText('settings.webhooks_remove'));
        expect(screen.getByText('Delete webhook')).toBeDefined();
        expect(removeWebhook).not.toHaveBeenCalled();
        fireEvent.click(within(screen.getByRole('dialog')).getByText('Delete'));
        await waitFor(() => expect(removeWebhook).toHaveBeenCalledWith('wh-1'));
    });
});
