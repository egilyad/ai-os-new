import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const listByTaskMock = vi.fn();
const createMock = vi.fn();
const setEnabledMock = vi.fn();
const deleteMock = vi.fn();
const fireMock = vi.fn();

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => {
        const labels: Record<string, string> = {
            'tasks.loading': 'Loading tasks...',
            'tasks.triggers.title': 'Triggers',
            'tasks.triggers.create': 'Add trigger',
            'tasks.triggers.empty': 'No triggers',
            'tasks.triggers.slug_placeholder': 'Trigger slug...',
            'tasks.triggers.kind': 'Kind',
            'tasks.triggers.kind.webhook': 'Webhook',
            'tasks.triggers.kind.gmail': 'Gmail',
            'tasks.triggers.kind.n8n': 'n8n',
            'tasks.triggers.auth': 'Auth',
            'tasks.triggers.auth.none': 'None',
            'tasks.triggers.auth.hmac': 'HMAC',
            'tasks.triggers.auth.bearer': 'Bearer',
            'tasks.triggers.secret_placeholder': 'Secret...',
            'tasks.triggers.enabled': 'Enabled',
            'tasks.triggers.disabled': 'Disabled',
            'tasks.triggers.enable': 'Enable',
            'tasks.triggers.disable': 'Disable',
            'tasks.triggers.fire': 'Fire',
            'tasks.triggers.delete': 'Delete',
            'tasks.triggers.firing_count': '{count} fires',
            'tasks.triggers.error_load': 'Failed to load triggers',
            'tasks.triggers.error_create': 'Failed to create trigger',
            'tasks.triggers.error_update': 'Failed to update trigger',
            'tasks.triggers.error_delete': 'Failed to delete trigger',
            'tasks.triggers.error_fire': 'Failed to fire trigger',
        };
        return {
            t: (key: string, params?: Record<string, string | number>) => {
                let s = labels[key] || key;
                if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
                return s;
            },
        };
    },
}));

vi.mock('../../kernel/instances/services-extras', () => ({
    taskTriggerService: {
        listByTask: (...args: unknown[]) => listByTaskMock(...args),
        create: (...args: unknown[]) => createMock(...args),
        setEnabled: (...args: unknown[]) => setEnabledMock(...args),
        delete: (...args: unknown[]) => deleteMock(...args),
        fire: (...args: unknown[]) => fireMock(...args),
    },
}));

vi.mock('../../kernel/services/task-trigger-service', () => ({
    TaskTriggerService: { hmacHex: vi.fn(() => 'sig') },
}));

describe('TaskTriggerPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listByTaskMock.mockResolvedValue([
            { id: 'tr1', taskId: 't1', slug: 'hook-one', kind: 'webhook', authKind: 'none', enabled: true, firingCount: 2, createdAt: 1, updatedAt: 1 },
            { id: 'tr2', taskId: 't1', slug: 'gmail-poll', kind: 'gmail', authKind: 'hmac', authSecretEnc: 'sec', enabled: false, firingCount: 0, createdAt: 2, updatedAt: 2 },
        ]);
        createMock.mockResolvedValue({ id: 'tr3', slug: 'new-hook' });
        setEnabledMock.mockResolvedValue({});
        fireMock.mockResolvedValue({});
    });

    it('renders triggers and firing counts', async () => {
        const TaskTriggerPanel = (await import('./TaskTriggerPanel')).default;
        render(<TaskTriggerPanel taskId="t1" />);
        expect(await screen.findByText('hook-one')).toBeDefined();
        expect(screen.getByText('gmail-poll')).toBeDefined();
        expect(screen.getByText('2 fires')).toBeDefined();
    });

    it('creates a trigger through the service', async () => {
        const TaskTriggerPanel = (await import('./TaskTriggerPanel')).default;
        render(<TaskTriggerPanel taskId="t1" />);
        await screen.findByText('hook-one');
        fireEvent.change(screen.getByLabelText('Trigger slug...'), { target: { value: 'my-new' } });
        fireEvent.click(screen.getByText('Add trigger'));
        await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ taskId: 't1', slug: 'my-new' })));
    });

    it('toggles enabled and fires a trigger', async () => {
        const TaskTriggerPanel = (await import('./TaskTriggerPanel')).default;
        render(<TaskTriggerPanel taskId="t1" />);
        await screen.findByText('hook-one');
        fireEvent.click(screen.getByText('Disable'));
        await waitFor(() => expect(setEnabledMock).toHaveBeenCalledWith('tr1', false));
        fireEvent.click(screen.getAllByText('Fire')[0]);
        await waitFor(() => expect(fireMock).toHaveBeenCalled());
    });

    it('deletes a trigger', async () => {
        const TaskTriggerPanel = (await import('./TaskTriggerPanel')).default;
        render(<TaskTriggerPanel taskId="t1" />);
        await screen.findByText('hook-one');
        fireEvent.click(screen.getAllByText('Delete')[0]);
        await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('tr1'));
    });
});
