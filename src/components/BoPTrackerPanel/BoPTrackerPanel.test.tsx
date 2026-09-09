import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoPTrackerPanel from './BoPTrackerPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Agent One', role: 'pro' },
        { id: 'agent-2', name: 'Agent Two', role: 'con' },
        { id: 'agent-3', name: 'Agent Three', role: 'neutral' },
    ],
}));

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
});
