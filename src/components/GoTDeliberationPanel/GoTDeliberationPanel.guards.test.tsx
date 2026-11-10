import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { gotState } = vi.hoisted(() => ({
    gotState: {
        impl: async (): Promise<never> => ({} as never),
    },
}));

vi.mock('../../kernel/services/debate-runtime/got-deliberation', () => ({
    GoTDeliberation: class {
        deliberate() {
            // Legacy-shaped payload: no branches, no scores.
            return gotState.impl();
        }
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('GoTDeliberationPanel legacy guards', () => {
    it('renders a malformed result without crashing', async () => {
        const Panel = (await import('./GoTDeliberationPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: /Deliberate/i }));
        await waitFor(() => expect(screen.getByText(/Branches/)).toBeDefined());
        expect(screen.queryByText('NaN%')).toBeNull();
        expect(document.body.textContent).not.toContain('undefined');
    });

    it('shows an error banner when deliberation throws', async () => {
        gotState.impl = async () => {
            throw new Error('engine down');
        };
        const Panel = (await import('./GoTDeliberationPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: /Deliberate/i }));
        expect(await screen.findByText('engine down')).toBeDefined();
        expect(screen.getByRole('alert')).toBeDefined();
    });
});
