import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DriftDetectorPanel from './DriftDetectorPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Agent One', role: 'pro' },
        { id: 'agent-2', name: 'Agent Two', role: 'con' },
        { id: 'agent-3', name: 'Agent Three', role: 'neutral' },
    ],
}));

describe('DriftDetectorPanel', () => {
    it('renders header', () => {
        render(<DriftDetectorPanel />);
        expect(screen.getAllByText(/Drift Detector/i).length).toBeGreaterThan(0);
    });
    it('shows history and last record sections', () => {
        render(<DriftDetectorPanel />);
        expect(document.body.textContent).toContain('History');
        expect(document.body.textContent).toContain('Last record');
    });
    it('record appends history and shows driftScore', () => {
        render(<DriftDetectorPanel />);
        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        expect(document.body.textContent).toContain('driftScore');
        expect(document.body.textContent).toContain('%');
    });
    it('uses real agents only (no demo data)', () => {
        render(<DriftDetectorPanel />);
        expect(screen.queryByText(/Alice/i)).toBeNull();
        expect(screen.queryByText(/Bob/i)).toBeNull();
        expect(screen.queryByText(/Carol/i)).toBeNull();
        expect(screen.getAllByText(/Agent One/).length).toBeGreaterThan(0);
    });
});
