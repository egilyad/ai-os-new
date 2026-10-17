import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BayesianJudgePanel from './BayesianJudgePanel';

type TestAgent = { id: string; name?: string; role?: string };

const { agentsState } = vi.hoisted(() => ({
    agentsState: {
        agents: [
            { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
            { id: 'agent-beta', name: 'Beta', role: 'con' },
            { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
        ] as TestAgent[],
    },
}));

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => agentsState.agents,
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
    it('falls back to agent id when a legacy agent has no name', () => {
        agentsState.agents = [{ id: 'legacy-1' }, { id: 'agent-beta', name: 'Beta' }];
        try {
            render(<BayesianJudgePanel />);
            expect(document.body.textContent).not.toContain('undefined');
            expect(document.body.textContent).toContain('legacy-1');
        } finally {
            agentsState.agents = [
                { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
                { id: 'agent-beta', name: 'Beta', role: 'con' },
                { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
            ];
        }
    });
});
