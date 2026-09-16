import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlindEvalPanel from './BlindEvalPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

describe('BlindEvalPanel', () => {
    it('renders header', () => {
        render(<BlindEvalPanel />);
        expect(screen.getAllByText(/Blind Eval/i).length).toBeGreaterThan(0);
    });
    it('toggles blind/open', () => {
        render(<BlindEvalPanel />);
        const blindBtn = screen.getByRole('button', { name: /Blind/i });
        const openBtn = screen.getByRole('button', { name: /Open/i });
        fireEvent.click(openBtn);
        expect(document.body.textContent).toContain('Open');
        fireEvent.click(blindBtn);
        expect(document.body.textContent).toContain('Blind');
    });
    it('shows scores', () => {
        render(<BlindEvalPanel />);
        expect(document.body.textContent).toContain('Blind scores');
        expect(document.body.textContent).toContain('argQ');
    });
});
