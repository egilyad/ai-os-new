import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CredibilityPanel from './CredibilityPanel';

describe('CredibilityPanel', () => {
    it('renders header', () => {
        render(<CredibilityPanel />);
        expect(screen.getAllByText(/Credibility/i).length).toBeGreaterThan(0);
    });
    it('shows scores and average', () => {
        render(<CredibilityPanel />);
        expect(document.body.textContent).toContain('Average');
        expect(document.body.textContent).toContain('Tier');
    });
    it('adds source', () => {
        render(<CredibilityPanel />);
        const input = document.querySelector('input[placeholder*="Paste source"]') as HTMLInputElement;
        expect(input).toBeDefined();
        fireEvent.change(input, { target: { value: 'https://example.com/test' } });
        const btns = screen.getAllByText(/Add/i);
        expect(btns.length).toBeGreaterThan(0);
    });
});
