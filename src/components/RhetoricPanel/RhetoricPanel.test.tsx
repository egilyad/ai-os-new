import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RhetoricPanel from './RhetoricPanel';

describe('RhetoricPanel', () => {
    it('renders header', () => {
        render(<RhetoricPanel />);
        expect(screen.getAllByText(/Rhetoric/i).length).toBeGreaterThan(0);
    });
    it('gets device prompt', () => {
        render(<RhetoricPanel />);
        const btn = screen.getByRole('button', { name: /Get device prompt/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Rhetorical Device');
    });
    it('shows all devices', () => {
        render(<RhetoricPanel />);
        expect(document.body.textContent).toContain('All devices');
    });
});
