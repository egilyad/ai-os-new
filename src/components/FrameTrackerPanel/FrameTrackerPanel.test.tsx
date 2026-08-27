import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FrameTrackerPanel from './FrameTrackerPanel';

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

describe('FrameTrackerPanel', () => {
    it('renders header', () => {
        render(<FrameTrackerPanel />);
        expect(screen.getAllByText(/Frame Tracker/i).length).toBeGreaterThan(0);
    });
    it('registers frame on button', () => {
        render(<FrameTrackerPanel />);
        const contentInput = document.querySelector('input:not([type="number"])') as HTMLInputElement;
        fireEvent.change(contentInput, { target: { value: 'We face a climate crisis — urgent emergency, irreversible disaster if we do not act now.' } });
        fireEvent.click(screen.getByRole('button', { name: /Register frame/i }));
        expect(document.body.textContent).toContain('crisis');
    });
    it('clear works', () => {
        render(<FrameTrackerPanel />);
        const clearBtn = screen.getByRole('button', { name: /Clear/i });
        fireEvent.click(clearBtn);
        expect(document.body.textContent).toContain('Frames');
    });
});
