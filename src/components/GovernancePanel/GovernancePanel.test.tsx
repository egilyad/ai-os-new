import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../kernel/instances/services-extras', () => ({
    governanceService: {
        rolesOf: vi.fn(async () => [{ role: 'observer' }]),
        assignRole: vi.fn(async () => {}),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('GovernancePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lists roles on mount', async () => {
        const Panel = (await import('./GovernancePanel')).default;
        render(<Panel />);
        expect(await screen.findByText('observer')).toBeDefined();
    });

    it('shows a confirmation after assigning a role', async () => {
        const { governanceService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./GovernancePanel')).default;
        render(<Panel />);
        await screen.findByText('observer');
        fireEvent.click(screen.getByRole('button', { name: 'governance.assign' }));
        await waitFor(() => expect(governanceService.assignRole).toHaveBeenCalled());
        expect(await screen.findByText('governance.assigned')).toBeDefined();
    });

    it('shows an error when assigning fails', async () => {
        const { governanceService } = await import('../../kernel/instances/services-extras');
        vi.mocked(governanceService.assignRole).mockRejectedValueOnce(new Error('denied'));
        const Panel = (await import('./GovernancePanel')).default;
        render(<Panel />);
        await screen.findByText('observer');
        fireEvent.click(screen.getByRole('button', { name: 'governance.assign' }));
        expect(await screen.findByText('governance.assign_failed')).toBeDefined();
    });

    it('shows a load error instead of a misleading empty list', async () => {
        const { governanceService } = await import('../../kernel/instances/services-extras');
        vi.mocked(governanceService.rolesOf).mockRejectedValueOnce(new Error('db down'));
        const Panel = (await import('./GovernancePanel')).default;
        render(<Panel />);
        expect(await screen.findByText('governance.error_load')).toBeDefined();
        expect(screen.queryByText('governance.empty_roles')).toBeNull();
    });
});
