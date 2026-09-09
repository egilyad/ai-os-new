import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JustificationPanel from './JustificationPanel';

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

const FOUR_HOPS = 'I argue that solar deployment must be immediate. Because Lazard LCOE shows $24/MWh vs $67 for coal proves it is cheapest. According to NREL 2023 study, data shows 42.5% efficiency in figures, table 2 confirms. Furthermore the IEA confirms and besides storage economics support it, in addition grid helps.';

describe('JustificationPanel', () => {
    it('renders header', () => {
        render(<JustificationPanel />);
        expect(screen.getAllByText(/Justification/i).length).toBeGreaterThan(0);
    });
    it('shows chain section', () => {
        render(<JustificationPanel />);
        expect(document.body.textContent).toContain('Chain');
    });
    it('analyze full 4 hops → valid', () => {
        render(<JustificationPanel />);
        const ta = document.querySelector('textarea') as HTMLTextAreaElement;
        fireEvent.change(ta, { target: { value: FOUR_HOPS } });
        fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
        expect(document.body.textContent).toContain('VALID');
        expect(document.body.textContent).toContain('claim');
    });
    it('only claim → missing types', () => {
        render(<JustificationPanel />);
        const ta = document.querySelector('textarea') as HTMLTextAreaElement;
        fireEvent.change(ta, { target: { value: 'I believe solar is the future.' } });
        fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
        expect(document.body.textContent).toContain('Missing');
    });
});
