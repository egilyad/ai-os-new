import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpertWitnessPanel from './ExpertWitnessPanel';

describe('ExpertWitnessPanel', () => {
    it('renders header', () => {
        render(<ExpertWitnessPanel />);
        expect(screen.getAllByText(/Expert Witness/i).length).toBeGreaterThan(0);
    });
    it('finds expert', () => {
        render(<ExpertWitnessPanel />);
        const btn = screen.getByRole('button', { name: /Find expert/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Expert');
    });
    it('generates testimony after find', () => {
        render(<ExpertWitnessPanel />);
        fireEvent.click(screen.getByRole('button', { name: /Find expert/i }));
        const genBtn = screen.getByRole('button', { name: /Generate testimony/i });
        fireEvent.click(genBtn);
        expect(document.body.textContent).toContain('Testimony');
    });
});
