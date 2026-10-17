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
    it('anonymizes legacy claims without agent ids', async () => {
        debateArgsState.args = [
            { id: 'x1', agentId: undefined, content: 'Solar is great and cheap.', round: 1 },
            { id: 'x2', content: 'No way, too costly.', round: 1 },
        ] as never;
        debateArgsState.sessionId = 's1';
        debateArgsState.hasLiveDebate = true;
        try {
            render(<BlindEvalPanel />);
        fireEvent.click(await screen.findByText(/Load active debate/));
        await screen.findByText(/Claims/);
        expect(document.body.textContent).not.toContain('NaN');
        } finally {
            debateArgsState.args = [];
            debateArgsState.sessionId = null;
            debateArgsState.hasLiveDebate = false;
        }
    });
});
