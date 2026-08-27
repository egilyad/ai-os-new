import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PersonaMixerPanel from './PersonaMixerPanel';

describe('PersonaMixerPanel', () => {
    it('renders header', () => {
        render(<PersonaMixerPanel />);
        expect(screen.getAllByText(/Persona Mixer/i).length).toBeGreaterThan(0);
    });
    it('mixes', () => {
        render(<PersonaMixerPanel />);
        const btn = screen.getByRole('button', { name: /Mix/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('History');
    });
    it('shows history after mix', () => {
        render(<PersonaMixerPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Mix/i }));
        expect(document.body.textContent).toContain('History');
    });
});
