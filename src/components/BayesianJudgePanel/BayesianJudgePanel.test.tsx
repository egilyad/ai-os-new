import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BayesianJudgePanel from './BayesianJudgePanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

describe('BayesianJudgePanel', () => {
    it('renders header and controls', () => {
        render(<BayesianJudgePanel />);
        expect(screen.getAllByText(/Bayesian Judge/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /Update belief/i })).toBeDefined();
    });
    it('updates belief on slider and button', () => {
        render(<BayesianJudgePanel />);
        const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
        expect(slider).toBeDefined();
        fireEvent.change(slider, { target: { value: '0.9' } });
        const btn = screen.getByRole('button', { name: /Update belief/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('posterior');
    });
    it('resets', () => {
        render(<BayesianJudgePanel />);
        const btn = screen.getByText(/Reset/i);
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Beliefs');
    });
});
