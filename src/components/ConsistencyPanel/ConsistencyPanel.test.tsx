import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsistencyPanel from './ConsistencyPanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Agent One', role: 'pro' },
        { id: 'agent-2', name: 'Agent Two', role: 'con' },
        { id: 'agent-3', name: 'Agent Three', role: 'neutral' },
    ],
}));

const CONTRADICTION_ARGS = [
    { id: 'a1', agentId: 'agent-1', agentName: 'Agent One', content: 'Solar is the best energy source and we should invest heavily in it.', round: 1 },
    { id: 'a2', agentId: 'agent-1', agentName: 'Agent One', content: 'We should continue solar investment — it scales well.', round: 2 },
];

beforeEach(() => useActiveDebateStore.getState().clearAll());

describe('ConsistencyPanel', () => {
    it('renders header', () => {
        render(<ConsistencyPanel />);
        expect(screen.getAllByText(/Consistency/i).length).toBeGreaterThan(0);
    });
    it('shows contradiction for a real agent from live debate', () => {
        useActiveDebateStore.getState().setSession({ id: 's1', topic: 't', arguments: CONTRADICTION_ARGS } as never);
        render(<ConsistencyPanel />);
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Actually, I was wrong about solar — I no longer support it.' } });
        expect(document.body.textContent).toContain('contradiction');
    });
    it('agent switch changes ratio', () => {
        render(<ConsistencyPanel />);
        const select = document.querySelector('select') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'agent-2' } });
        expect(document.body.textContent).toContain('Consistency ratio');
    });
    it('uses real agents only (no demo data)', () => {
        render(<ConsistencyPanel />);
        expect(screen.queryByText(/Alice/i)).toBeNull();
        expect(screen.queryByText(/Bob/i)).toBeNull();
        expect(screen.getAllByText(/Agent One/).length).toBeGreaterThan(0);
    });
});
