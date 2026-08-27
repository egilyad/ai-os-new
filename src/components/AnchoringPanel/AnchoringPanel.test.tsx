import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnchoringPanel from './AnchoringPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

describe('AnchoringPanel', () => {
    it('renders header', () => {
        render(<AnchoringPanel />);
        expect(screen.getAllByText(/Anchoring/i).length).toBeGreaterThan(0);
    });
    it('adds claim', () => {
        render(<AnchoringPanel />);
        const btn = screen.getByText(/Add claim/i);
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Arguments');
    });
    it('shows anchors', () => {
        render(<AnchoringPanel />);
        expect(document.body.textContent).toContain('Anchors');
    });
});
