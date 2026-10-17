import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InsightBusPanel from './InsightBusPanel';

const mockState = vi.hoisted(() => ({
    args: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({
        args: mockState.args,
        sessionId: mockState.args.length ? 's1' : null,
        topic: null,
        hasLiveDebate: mockState.args.length > 0,
    }),
}));

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

beforeEach(() => {
    mockState.args = [];
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
    it('tolerates legacy live args missing content/round', () => {
        mockState.args = [
            { id: 'a1', agentId: 'agent-1', agentName: 'Agent One' },
            { id: 'a2', agentId: 'agent-2', agentName: 'Agent Two' },
        ];
        render(<InsightBusPanel />);
        expect(document.body.textContent).not.toContain('undefined');
        expect(document.body.textContent).not.toContain('NaN');
    });
});
