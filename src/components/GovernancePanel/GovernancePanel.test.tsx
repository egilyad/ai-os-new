import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { governanceService } = vi.hoisted(() => ({
    governanceService: {
        rolesOf: vi.fn(async () => [{ role: 'observer' }]),
        assignRole: vi.fn(async () => {}),
    },
}));

vi.mock('../../kernel/instances/services-extras', () => ({ governanceService }));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../hooks/useAutoClearError', () => ({
    useAutoClearError: () => vi.fn(),
}));

describe('GovernancePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lists roles on mount', async () => {
        const Panel = (await import('./GovernancePanel')).default;
        render(<MemoryRouter><Panel /></MemoryRouter>);
        expect(await screen.findByText('observer')).toBeDefined();
    });

    it('shows a confirmation after assigning a role', async () => {
        const Panel = (await import('./GovernancePanel')).default;
        render(<MemoryRouter><Panel /></MemoryRouter>);
        await screen.findByText('observer');
        fireEvent.click(screen.getByRole('button', { name: 'governance.assign' }));
        await waitFor(() => expect(governanceService.assignRole).toHaveBeenCalled());
        expect(await screen.findByText('governance.assigned')).toBeDefined();
    });

    it('shows an error when assigning fails', async () => {
        governanceService.assignRole.mockImplementationOnce(() => Promise.reject(new Error('denied')));
        const Panel = (await import('./GovernancePanel')).default;
        render(<MemoryRouter><Panel /></MemoryRouter>);
        await screen.findByText('observer');
        fireEvent.click(screen.getByRole('button', { name: 'governance.assign' }));
        await waitFor(() => expect(governanceService.assignRole).toHaveBeenCalledTimes(1));
        expect(screen.queryByText('governance.assigned')).toBeNull();
    });

    it('shows a load error instead of a misleading empty list', async () => {
        const { governanceService } = await import('../../kernel/instances/services-extras');
        vi.mocked(governanceService.rolesOf).mockRejectedValueOnce(new Error('db down'));
        const Panel = (await import('./GovernancePanel')).default;
        render(<MemoryRouter><Panel /></MemoryRouter>);
        expect(await screen.findByText('governance.error_load')).toBeDefined();
        expect(screen.queryByText('governance.empty_roles')).toBeNull();
    });
});
