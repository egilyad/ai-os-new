import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ConfigHistoryView from './ConfigHistoryView';

const restoreById = vi.hoisted(() => vi.fn(() => true));

vi.mock('../kernel/instances', () => ({
    snapshotService: {
        getRecent: vi.fn(() => [
            {
                id: 'snap-1',
                label: 'before',
                createdAt: 1,
                runtime: {
                    kernel: { providers: {}, totalRequests: 0, estimatedCost: 0 },
                },
            },
        ]),
        restoreById,
        capture: vi.fn(),
    },
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
    EVENTS: { SNAPSHOT_CAPTURED: 'snapshot:captured', NOTIFICATION: 'notification' },
}));

describe('ConfigHistoryView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        restoreById.mockReturnValue(true);
    });

    it('requires confirmation before rollback', async () => {
        render(<ConfigHistoryView />);
        fireEvent.click(await screen.findByText('Rollback'));
        expect(screen.getByText('Rollback configuration')).toBeDefined();
        expect(restoreById).not.toHaveBeenCalled();
        fireEvent.click(within(screen.getByRole('dialog')).getByText('Rollback'));
        await waitFor(() => expect(restoreById).toHaveBeenCalledWith('snap-1'));
    });
});
