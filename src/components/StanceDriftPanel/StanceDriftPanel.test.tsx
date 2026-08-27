import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StanceDriftPanel from './StanceDriftPanel';

vi.mock('../../hooks/useRealAgents', () => {
    const A = [
        { id: 'alice', name: 'Alice (Pro)', role: 'agent' },
        { id: 'bob', name: 'Bob (Con)', role: 'agent' },
        { id: 'carol', name: 'Carol (Neutral)', role: 'agent' },
    ];
    return { useRealAgents: () => A };
});

describe('StanceDriftPanel', () => {
    it('renders header', () => {
        render(<StanceDriftPanel />);
        expect(screen.getAllByText(/Stance Drift/i).length).toBeGreaterThan(0);
    });
    it('registers and shows drift', () => {
        render(<StanceDriftPanel />);
        const btn = screen.getByText(/Register/i);
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Drift events');
    });
    it('agent switch', () => {
        render(<StanceDriftPanel />);
        const select = document.querySelector('select') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'bob' } });
        expect(document.body.textContent).toContain('Penalty');
    });
});
