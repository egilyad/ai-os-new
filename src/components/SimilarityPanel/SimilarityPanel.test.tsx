import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimilarityPanel from './SimilarityPanel';

const mockState = vi.hoisted(() => ({
    args: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../hooks/useRealAgents', () => {
    const A = [
        { id: 'alice', name: 'Alice (Pro)', role: 'agent' },
        { id: 'bob', name: 'Bob (Con)', role: 'agent' },
        { id: 'carol', name: 'Carol (Neutral)', role: 'agent' },
    ];
    return { useRealAgents: () => A };
});

vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({
        args: mockState.args,
        sessionId: mockState.args.length ? 's1' : null,
        topic: null,
        hasLiveDebate: mockState.args.length > 0,
    }),
}));

beforeEach(() => {
    mockState.args = [];
});

describe('SimilarityPanel', () => {
    it('renders header', () => {
        render(<SimilarityPanel />);
        expect(screen.getAllByText(/Similarity/i).length).toBeGreaterThan(0);
    });
    it('records', () => {
        render(<SimilarityPanel />);
        const btn = screen.getByRole('button', { name: 'Record' });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Similarity');
    });
    it('shows history after record', () => {
        render(<SimilarityPanel />);
        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        expect(document.body.textContent).toContain('History');
    });
    it('tolerates legacy live args missing content/round (no NaN)', () => {
        mockState.args = [{ id: 'a1', agentId: 'alice', agentName: 'Alice' }];
        render(<SimilarityPanel />);
        const roundInput = document.querySelector('input[type="number"]') as HTMLInputElement;
        expect(roundInput.value).toBe('2');
        expect(document.body.textContent).not.toContain('NaN');
    });
});
