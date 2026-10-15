import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import VotePanelSection from './VotePanelSection';

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        debateHumanService: { recordHumanVote: vi.fn(), removeHumanVote: vi.fn(), getHumanVotes: () => [] },
        debateService: { getActiveDebateSession: () => null },
    };
});

vi.mock('../../kernel/services/agent-identity', () => ({
    resolveAgentIdentity: (id: string) => ({ displayName: id }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

function renderPanel(participants: string[]) {
    const setShowVotePanel = vi.fn();
    render(
        <VotePanelSection
            showVotePanel={2}
            sessionStatus="active"
            getRoundParticipants={() => participants}
            getAgentLabel={(id: string) => id}
            humanVotes={[]}
            setHumanVotes={vi.fn()}
            setShowVotePanel={setShowVotePanel}
        />,
    );
    return { setShowVotePanel };
}

describe('VotePanelSection empty round (Zone 2)', () => {
    it('shows a waiting state with Dismiss instead of a stuck banner', () => {
        const { setShowVotePanel } = renderPanel([]);
        expect(screen.getByText('Waiting for arguments…')).toBeDefined();
        fireEvent.click(screen.getByText('Dismiss'));
        expect(setShowVotePanel).toHaveBeenCalledWith(null);
    });

    it('renders vote buttons when participants arrive', () => {
        renderPanel(['a1', 'a2']);
        expect(screen.getByRole('button', { name: /a1/ })).toBeDefined();
        expect(screen.getByRole('button', { name: /a2/ })).toBeDefined();
        expect(screen.queryByText('Waiting for arguments…')).toBeNull();
    });
});
