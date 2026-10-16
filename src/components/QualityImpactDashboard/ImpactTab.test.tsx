import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const fullMetric = {
    techniqueId: 'steelmanning',
    avgJudgeScoreDelta: 0.12,
    totalActivations: 10,
    totalSessions: 4,
    confidence: 'high',
    sampleSizeOn: 3,
    sampleSizeOff: 1,
    avgConfidenceDelta: 0.05,
    avgRoundCountDelta: 0,
    avgTokenCostDelta: -0.02,
    lastTouchCount: 2,
    frequencyInBestRounds: 0.5,
};

vi.mock('../../kernel/instances', () => ({
    qualityImpactCollector: {
        getAllMetrics: vi.fn(() => [{ ...fullMetric }]),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('ImpactTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders measured metrics with a real technique denominator', async () => {
        const Tab = (await import('./ImpactTab')).default;
        render(<Tab />);
        expect(await screen.findByText('steelmanning')).toBeDefined();
        // Denominator comes from the technique store, not a stale literal.
        expect(screen.queryByText('1/70')).toBeNull();
    });

    it('tolerates legacy metrics without numeric fields', async () => {
        const { qualityImpactCollector } = await import('../../kernel/instances');
        vi.mocked(qualityImpactCollector.getAllMetrics).mockReturnValueOnce([
            { techniqueId: 'legacy-tech' },
        ] as never);
        const Tab = (await import('./ImpactTab')).default;
        render(<Tab />);
        expect(await screen.findByText('legacy-tech')).toBeDefined();
        expect(document.body.textContent).not.toContain('NaN');
    });

    it('sorts without crashing on missing technique ids', async () => {
        const { qualityImpactCollector } = await import('../../kernel/instances');
        vi.mocked(qualityImpactCollector.getAllMetrics).mockReturnValueOnce([
            { totalActivations: 5 },
        ] as never);
        const Tab = (await import('./ImpactTab')).default;
        render(<Tab />);
        await screen.findByText('quality_impact.techniques');
        fireEvent.click(screen.getByText('quality_impact.technique'));
    });
});
