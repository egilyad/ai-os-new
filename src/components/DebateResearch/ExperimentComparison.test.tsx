import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExperimentComparison } from './ExperimentComparison';

vi.mock('../../kernel/instances', () => ({
    researchRunService: {
        getAllRuns: vi.fn(() => []),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('ExperimentComparison', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('asks for more runs when fewer than two are completed', async () => {
        render(<ExperimentComparison />);
        expect(await screen.findByText(/at least 2 completed runs/)).toBeDefined();
    });

    it('renders legacy runs without timestamps and compares them', async () => {
        const { researchRunService } = await import('../../kernel/instances');
        vi.mocked(researchRunService.getAllRuns).mockReturnValue([
            { id: 'r1', module: 'audit', status: 'completed' },
            { id: 'r2', module: 'audit', status: 'failed' },
        ] as never);
        render(<ExperimentComparison />);
        expect(await screen.findByText('Experiment Comparison')).toBeDefined();
        // Duration column shows dashes, never NaN.
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
        expect(document.body.textContent).not.toContain('NaN');
    });
});
