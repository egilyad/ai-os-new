import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../kernel/instances', () => ({
    getAllSettings: () => ({} as Record<string, boolean>),
    setSetting: () => {},
    qualityImpactCollector: { getAllMetrics: () => [] },
}));
vi.mock('../../hooks/useRealAgents', () => ({ useRealAgents: () => [] }));
vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({ args: [], hasLiveDebate: false }),
}));
vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

describe('CrossExaminationPanel', () => {
    it('renders technique title and core sections', async () => {
        const { default: Panel } = await import('./CrossExaminationPanel');
        render(<Panel />);
        expect(screen.getByText('Cross-Examination')).toBeTruthy();
        expect(screen.getByText('technique.agents')).toBeTruthy();
        expect(screen.getByText('technique.live_args')).toBeTruthy();
        expect(screen.getByText('technique.impact')).toBeTruthy();
        expect(screen.getByText('technique.focus_qa')).toBeTruthy();
    });
});
