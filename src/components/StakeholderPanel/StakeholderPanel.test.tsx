import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StakeholderPanel from './StakeholderPanel';

describe('StakeholderPanel', () => {
    it('renders header', () => {
        render(<StakeholderPanel />);
        expect(screen.getAllByText(/Stakeholder/i).length).toBeGreaterThan(0);
    });
    it('analyzes', () => {
        render(<StakeholderPanel />);
        const btn = screen.getByText(/Analyze/i);
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Stakeholders');
    });
    it('shows empty state when no topic', () => {
        render(<StakeholderPanel />);
        expect(document.body.textContent).toContain('No stakeholders');
    });
});
