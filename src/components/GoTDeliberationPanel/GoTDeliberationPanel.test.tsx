import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoTDeliberationPanel from './GoTDeliberationPanel';

describe('GoTDeliberationPanel', () => {
    it('renders header', () => {
        render(<GoTDeliberationPanel />);
        expect(screen.getAllByText(/GoT Deliberation/i).length).toBeGreaterThan(0);
    });
    it('deliberates', async () => {
        render(<GoTDeliberationPanel />);
        const btn = screen.getByRole('button', { name: /Deliberate/i });
        fireEvent.click(btn);
        // wait for async
        await new Promise(r => setTimeout(r, 100));
        expect(document.body.textContent).toContain('Branches');
    });
    it('shows topic input', () => {
        render(<GoTDeliberationPanel />);
        expect(document.body.textContent).toContain('Topic');
    });
});
