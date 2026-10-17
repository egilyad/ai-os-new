import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [{ id: 'a1', name: 'Agent One', role: 'pro' }],
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

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('AnchoringPanel', () => {
    beforeEach(() => {
        debateArgsState.args = [];
        debateArgsState.sessionId = null;
        debateArgsState.hasLiveDebate = false;
        vi.clearAllMocks();
    });

    it('renders the anchoring header', async () => {
        const { AnchoringPanel } = await import('./AnchoringPanel');
        render(<AnchoringPanel />);
        expect(screen.getAllByText(/Anchoring/i).length).toBeGreaterThan(0);
    });

    it('tolerates legacy args without content', async () => {
        debateArgsState.args = [
            { id: 'x1', agentId: 'a1', agentName: 'Agent One', round: 1 },
        ] as never;
        debateArgsState.sessionId = 's1';
        debateArgsState.hasLiveDebate = true;
        const { AnchoringPanel } = await import('./AnchoringPanel');
        render(<AnchoringPanel />);
        fireEvent.click(await screen.findByText(/Load active debate/));
        expect(await screen.findByText(/Arguments/)).toBeDefined();
        expect(document.body.textContent).not.toContain('NaN');
    });
});
