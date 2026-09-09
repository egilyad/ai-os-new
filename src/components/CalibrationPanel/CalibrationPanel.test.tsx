import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalibrationPanel from './CalibrationPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Agent One', role: 'pro' },
        { id: 'agent-2', name: 'Agent Two', role: 'con' },
        { id: 'agent-3', name: 'Agent Three', role: 'neutral' },
    ],
}));

describe('CalibrationPanel', () => {
    it('renders header', () => {
        render(<CalibrationPanel />);
        expect(screen.getAllByText(/Calibration/i).length).toBeGreaterThan(0);
    });
    it('scores and shows violations', () => {
        render(<CalibrationPanel />);
        expect(document.body.textContent).toContain('heuristic');
        expect(document.body.textContent).toContain('Violations');
    });
    it('uses real agents only (no demo data)', () => {
        render(<CalibrationPanel />);
        expect(screen.queryByText(/Alice/i)).toBeNull();
        expect(screen.queryByText(/Bob/i)).toBeNull();
        expect(screen.queryByText(/Carol/i)).toBeNull();
        expect(screen.getByText('Agent One')).toBeTruthy();
    });
});
