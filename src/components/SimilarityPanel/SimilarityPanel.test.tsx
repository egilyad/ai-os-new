import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimilarityPanel from './SimilarityPanel';

vi.mock('../../hooks/useRealAgents', () => {
    const A = [
        { id: 'alice', name: 'Alice (Pro)', role: 'agent' },
        { id: 'bob', name: 'Bob (Con)', role: 'agent' },
        { id: 'carol', name: 'Carol (Neutral)', role: 'agent' },
    ];
    return { useRealAgents: () => A };
});

describe('SimilarityPanel', () => {
    it('renders header', () => {
        render(<SimilarityPanel />);
        expect(screen.getAllByText(/Similarity/i).length).toBeGreaterThan(0);
    });
    it('records', () => {
        render(<SimilarityPanel />);
        const btn = screen.getByRole('button', { name: 'Record' });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Similarity');
    });
    it('shows history after record', () => {
        render(<SimilarityPanel />);
        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        expect(document.body.textContent).toContain('History');
    });
});
