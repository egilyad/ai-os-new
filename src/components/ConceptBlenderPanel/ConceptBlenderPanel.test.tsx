import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConceptBlenderPanel from './ConceptBlenderPanel';
import { useActiveDebateStore } from '../../stores/activeDebateStore';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Agent One', role: 'pro' },
        { id: 'agent-2', name: 'Agent Two', role: 'con' },
        { id: 'agent-3', name: 'Agent Three', role: 'neutral' },
    ],
}));

const DEADLOCK_ARGS = [
    { id: 'a1', agentId: 'agent-1', agentName: 'Agent One', content: 'We need efficiency at all costs — you ignore the economics.', round: 1 },
    { id: 'a2', agentId: 'agent-2', agentName: 'Agent Two', content: 'As I already said, equity is fundamental, you ignore my point.', round: 1 },
    { id: 'a3', agentId: 'agent-1', agentName: 'Agent One', content: 'This is circular — you keep repeating equity.', round: 2 },
    { id: 'a4', agentId: 'agent-2', agentName: 'Agent Two', content: 'It is completely wrong — irreconcilable worldviews.', round: 2 },
    { id: 'a5', agentId: 'agent-1', agentName: 'Agent One', content: 'You are straw-manning me, apples and oranges.', round: 3 },
    { id: 'a6', agentId: 'agent-2', agentName: 'Agent Two', content: 'You are straw-manning me again, not addressing equity.', round: 3 },
];

beforeEach(() => useActiveDebateStore.getState().clearAll());

describe('ConceptBlenderPanel', () => {
    it('renders header', () => {
        render(<ConceptBlenderPanel />);
        expect(screen.getAllByText(/Concept Blender/i).length).toBeGreaterThan(0);
    });
    it('detects deadlock from live debate', () => {
        useActiveDebateStore.getState().setSession({ id: 's1', topic: 't', arguments: DEADLOCK_ARGS } as never);
        render(<ConceptBlenderPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Detect deadlock/i }));
        expect(document.body.textContent).toContain('DEADLOCK');
    });
    it('generates blend from deadlock', () => {
        useActiveDebateStore.getState().setSession({ id: 's1', topic: 't', arguments: DEADLOCK_ARGS } as never);
        render(<ConceptBlenderPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Detect deadlock/i }));
        fireEvent.click(screen.getByRole('button', { name: /Generate blend/i }));
        expect(document.body.textContent).toContain('Blends');
    });
    it('uses real agents only (no demo data)', () => {
        render(<ConceptBlenderPanel />);
        expect(screen.queryByText(/Alice/i)).toBeNull();
        expect(screen.queryByText(/Bob/i)).toBeNull();
        expect(screen.getByText('Agent One')).toBeTruthy();
    });
});
