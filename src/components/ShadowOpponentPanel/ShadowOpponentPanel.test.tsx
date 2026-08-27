import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShadowOpponentPanel from './ShadowOpponentPanel';

vi.mock('../../hooks/useRealAgents', () => {
    const A = [
        { id: 'alice', name: 'Alice (Pro)', role: 'agent' },
        { id: 'bob', name: 'Bob (Con)', role: 'agent' },
        { id: 'carol', name: 'Carol (Neutral)', role: 'agent' },
    ];
    return { useRealAgents: () => A };
});

describe('ShadowOpponentPanel', () => {
    it('renders header', () => {
        render(<ShadowOpponentPanel />);
        expect(screen.getAllByText(/Shadow Opponent/i).length).toBeGreaterThan(0);
    });
    it('shows draft and history sections', () => {
        render(<ShadowOpponentPanel />);
        expect(document.body.textContent).toContain('Draft');
        expect(document.body.textContent).toContain('History');
    });
    it('strengthens draft with mock adapter', async () => {
        render(<ShadowOpponentPanel />);
        const ta = document.querySelector('textarea') as HTMLTextAreaElement;
        fireEvent.change(ta, { target: { value: 'Solar energy is the most cost-effective solution for decarbonization and scales well across grids everywhere.' } });
        fireEvent.click(screen.getByRole('button', { name: /Strengthen/i }));
        await waitFor(() => expect(document.body.textContent).toContain('CRITIQUE'), { timeout: 3000 });
        expect(document.body.textContent).toContain('STRENGTHENED');
    });
    it('short draft shows error', async () => {
        render(<ShadowOpponentPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Strengthen/i }));
        await waitFor(() => expect(document.body.textContent).toContain('too short'), { timeout: 2000 });
    });
});
