import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InsightBusPanel from './InsightBusPanel';

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

describe('InsightBusPanel', () => {
    it('renders header', () => {
        render(<InsightBusPanel />);
        expect(screen.getAllByText(/Insight Bus/i).length).toBeGreaterThan(0);
    });
    it('ingests round', () => {
        render(<InsightBusPanel />);
        const contentInput = Array.from(document.querySelectorAll('input')).find(
            (i) => i.getAttribute('type') !== 'number',
        ) as HTMLInputElement;
        fireEvent.change(contentInput, { target: { value: 'Solar is cheap, however nuclear is needed for baseload.' } });
        fireEvent.click(screen.getByRole('button', { name: /Ingest round/i }));
        expect(document.body.textContent).toContain('contradiction');
    });
    it('clear works', () => {
        render(<InsightBusPanel />);
        const btn = screen.getByRole('button', { name: /Clear/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Active insights');
    });
});
