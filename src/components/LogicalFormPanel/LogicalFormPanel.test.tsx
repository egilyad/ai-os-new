import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogicalFormPanel from './LogicalFormPanel';

describe('LogicalFormPanel', () => {
    it('renders header', () => {
        render(<LogicalFormPanel />);
        expect(screen.getAllByText(/Logical Form/i).length).toBeGreaterThan(0);
    });
    it('shows input and controls', () => {
        render(<LogicalFormPanel />);
        expect(document.body.textContent).toContain('Input text');
        expect(screen.getByRole('button', { name: /Analyze/i })).toBeTruthy();
    });
    it('analyze → shows type and premises', () => {
        render(<LogicalFormPanel />);
        fireEvent.change(screen.getByRole('textbox'), {
            target: {
                value:
                    'Because Lazard shows LCOE $24/MWh, solar is cheapest. Historical data proves deployment scales linearly. Therefore we must deploy immediately, so climate crisis will be solved.',
            },
        });
        fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
        expect(document.body.textContent).toContain('Major premise');
        expect(document.body.textContent).toContain('Conclusion');
    });
    it('enthymeme text shows hidden', () => {
        render(<LogicalFormPanel />);
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'Obviously solar is best because Lazard proves it. Therefore we should build. Clearly everyone knows this is true.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
        expect(document.body.textContent).toContain('Hidden');
    });
});
