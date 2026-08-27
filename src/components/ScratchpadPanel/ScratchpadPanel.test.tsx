import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScratchpadPanel from './ScratchpadPanel';

describe('ScratchpadPanel', () => {
    it('renders header', () => {
        render(<ScratchpadPanel />);
        expect(screen.getAllByText(/Scratchpad/i).length).toBeGreaterThan(0);
    });
    it('analyzes', () => {
        render(<ScratchpadPanel />);
        const btn = screen.getByRole('button', { name: /Analyze/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Tactical focus');
    });
    it('shows history', () => {
        render(<ScratchpadPanel />);
        expect(document.body.textContent).toContain('History');
    });
});
