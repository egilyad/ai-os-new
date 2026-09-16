import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BeliefMiningPanel from './BeliefMiningPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

describe('BeliefMiningPanel', () => {
    it('renders header', () => {
        render(<BeliefMiningPanel />);
        expect(screen.getAllByText(/Belief Mining/i).length).toBeGreaterThan(0);
    });
    it('shows mined beliefs', () => {
        render(<BeliefMiningPanel />);
        expect(document.body.textContent).toContain('Mined beliefs');
    });
    it('shows conflicts', () => {
        render(<BeliefMiningPanel />);
        expect(document.body.textContent).toContain('Conflicts');
    });
});
