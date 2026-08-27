import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MinimaxPlannerPanel from './MinimaxPlannerPanel';

describe('MinimaxPlannerPanel', () => {
    it('renders header', () => {
        render(<MinimaxPlannerPanel />);
        expect(screen.getAllByText(/Minimax Planner/i).length).toBeGreaterThan(0);
    });
    it('plans move', () => {
        render(<MinimaxPlannerPanel />);
        const btn = screen.getByRole('button', { name: /Plan move/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Best move');
    });
    it('shows candidates', () => {
        render(<MinimaxPlannerPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Plan move/i }));
        expect(document.body.textContent).toContain('Candidates');
    });
});
