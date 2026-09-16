import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntanglementPanel from './EntanglementPanel';

vi.mock('../../kernel/instances/services-core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../kernel/instances/services-core')>();
    return {
        ...actual,
        agentService: {
            getAgents: () => ([
                { id: 'agent-1', name: 'Agent One', role: 'agent' },
                { id: 'agent-2', name: 'Agent Two', role: 'agent' },
            ]),
        },
    };
});

describe('EntanglementPanel', () => {
    it('renders header', () => {
        render(<EntanglementPanel />);
        expect(screen.getAllByText(/Entanglement/i).length).toBeGreaterThan(0);
    });
    it('gets constraint', () => {
        render(<EntanglementPanel />);
        const btn = screen.getByRole('button', { name: /Get constraint/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Constraint');
    });
    it('validates response', () => {
        render(<EntanglementPanel />);
        const btn = screen.getByRole('button', { name: /Get constraint/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Validate response');
    });
});
