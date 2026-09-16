import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IncentiveDetectorPanel from './IncentiveDetectorPanel';

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

describe('IncentiveDetectorPanel', () => {
    it('renders header', () => {
        render(<IncentiveDetectorPanel />);
        expect(screen.getAllByText(/Incentive Detector/i).length).toBeGreaterThan(0);
    });
    it('analyzes', () => {
        render(<IncentiveDetectorPanel />);
        const btn = screen.getByRole('button', { name: /Analyze incentives/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Profiles');
    });
    it('detects profit stakeholder from real input', () => {
        render(<IncentiveDetectorPanel />);
        const content = document.querySelector('textarea') as HTMLTextAreaElement;
        fireEvent.change(content, { target: { value: 'We must subsidize solar — government support will boost profit for investors and market growth for AI companies.' } });
        fireEvent.click(screen.getByRole('button', { name: /Analyze incentives/i }));
        expect(document.body.textContent).toContain('profit');
    });
});
