import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BiasProfilerPanel from './BiasProfilerPanel';

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-alpha', name: 'Alpha', role: 'pro' },
        { id: 'agent-beta', name: 'Beta', role: 'con' },
        { id: 'agent-gamma', name: 'Gamma', role: 'neutral' },
    ],
}));

describe('BiasProfilerPanel', () => {
    it('renders header', () => {
        render(<BiasProfilerPanel />);
        expect(screen.getAllByText(/Bias Profiler/i).length).toBeGreaterThan(0);
    });
    it('analyzes', () => {
        render(<BiasProfilerPanel />);
        const btn = screen.getByRole('button', { name: /Analyze/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Profile');
    });
    it('shows empty instruction when no active debate', () => {
        render(<BiasProfilerPanel />);
        expect(document.body.textContent).toContain('No active debate');
    });
});
