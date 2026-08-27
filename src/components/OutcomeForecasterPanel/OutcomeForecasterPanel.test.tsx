import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OutcomeForecasterPanel from './OutcomeForecasterPanel';

describe('OutcomeForecasterPanel', () => {
    it('renders header', () => {
        render(<OutcomeForecasterPanel />);
        expect(screen.getAllByText(/Outcome Forecaster/i).length).toBeGreaterThan(0);
    });
    it('forecasts', () => {
        render(<OutcomeForecasterPanel />);
        const btn = screen.getByRole('button', { name: /Forecast/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Recommended');
    });
    it('shows variants after forecast', () => {
        render(<OutcomeForecasterPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Forecast/i }));
        expect(document.body.textContent).toContain('All variants');
    });
});
