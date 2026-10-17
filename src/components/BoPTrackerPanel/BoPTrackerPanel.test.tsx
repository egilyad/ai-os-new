import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoPTrackerPanel from './BoPTrackerPanel';

const mockState = vi.hoisted(() => ({
    debateArgs: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Agent One', role: 'pro' },
        { id: 'agent-2', name: 'Agent Two', role: 'con' },
        { id: 'agent-3', name: 'Agent Three', role: 'neutral' },
    ],
}));

vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({
        args: mockState.debateArgs,
        sessionId: mockState.debateArgs.length ? 's1' : null,
        topic: null,
        hasLiveDebate: mockState.debateArgs.length > 0,
    }),
}));

beforeEach(() => {
    mockState.debateArgs = [];
});

describe('BoPTrackerPanel', () => {
    it('renders header', () => {
        render(<BoPTrackerPanel />);
        expect(screen.getAllByText(/BoP Tracker/i).length).toBeGreaterThan(0);
    });
    it('adds claim', () => {
        render(<BoPTrackerPanel />);
        const btn = screen.getByText(/Add claim/i);
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Unmet');
    });
    it('shows met ratios', () => {
        render(<BoPTrackerPanel />);
        expect(document.body.textContent).toContain('Met ratios');
    });
    it('uses real agents only (no demo data)', () => {
        render(<BoPTrackerPanel />);
        expect(screen.queryByText(/Alice/i)).toBeNull();
        expect(screen.queryByText(/Bob/i)).toBeNull();
        expect(screen.queryByText(/Carol/i)).toBeNull();
        expect(screen.getAllByText(/Agent One/).length).toBeGreaterThan(0);
    });
    it('tolerates legacy live args missing content/round (no NaN)', () => {
        mockState.debateArgs = [{ id: 'a1', agentId: 'agent-1', agentName: 'Agent One' }];
        render(<BoPTrackerPanel />);
        const roundInput = document.querySelector('input[type="number"]') as HTMLInputElement;
        expect(roundInput.value).toBe('1');
        expect(document.body.textContent).not.toContain('NaN');
    });
});
