import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BeliefMiningPanel from './BeliefMiningPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

const { debateArgsState } = vi.hoisted(() => ({
    debateArgsState: {
        args: [] as Array<Record<string, unknown>>,
        sessionId: null as string | null,
        hasLiveDebate: false,
    },
}));

vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({
        args: debateArgsState.args,
        sessionId: debateArgsState.sessionId,
        topic: '',
        hasLiveDebate: debateArgsState.hasLiveDebate,
    }),
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
    it('tolerates legacy args without content', async () => {
        debateArgsState.args = [
            { id: 'x1', agentId: 'agent-alpha', agentName: 'Alpha', round: 1 },
        ] as never;
        debateArgsState.sessionId = 's1';
        debateArgsState.hasLiveDebate = true;
        try {
            render(<BeliefMiningPanel />);
            fireEvent.click(await screen.findByText('Load active debate (1)'));
            await screen.findByText('Mined beliefs');
            expect(document.body.textContent).not.toContain('NaN');
        } finally {
            debateArgsState.args = [];
            debateArgsState.sessionId = null;
            debateArgsState.hasLiveDebate = false;
        }
    });
});
