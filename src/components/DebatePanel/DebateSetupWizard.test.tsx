import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import DebateSetupWizard from './DebateSetupWizard';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

afterEach(() => cleanup());

const agents = [
    { id: 'a1', label: 'Agent 1' },
    { id: 'a2', label: 'Agent 2' },
];

function renderWizard(over: Record<string, unknown> = {}) {
    return render(
        <DebateSetupWizard
            topic="Should we test?"
            onTopicChange={vi.fn()}
            strategy="round_robin"
            onStrategyChange={vi.fn()}
            maxRounds={5}
            onMaxRoundsChange={vi.fn()}
            selectedAgents={['a1']}
            onToggleAgent={vi.fn()}
            onSelectAll={vi.fn()}
            onDeselectAll={vi.fn()}
            availableAgents={agents}
            actionLoading={null}
            onStart={vi.fn()}
            t={(k: string) => k}
            {...(over as object)}
        />,
    );
}

describe('DebateSetupWizard historical figures + quorum (Zone 2)', () => {
    it('enables Start for 1 agent + 1 historical figure', () => {
        renderWizard({ selectedHistoricalCount: 1, onOpenHistoricalFigures: vi.fn() });
        const start = screen.getByText('debate.initialize', { exact: false });
        const btn = start.closest('button')!;
        expect(btn.hasAttribute('disabled')).toBe(false);
    });

    it('keeps Start disabled for a lone agent without historical figures', () => {
        renderWizard({});
        const start = screen.getByText('debate.initialize', { exact: false });
        expect(start.closest('button')!.hasAttribute('disabled')).toBe(true);
    });

    it('opens the historical picker when provided', () => {
        const open = vi.fn();
        renderWizard({ onOpenHistoricalFigures: open });
        fireEvent.click(screen.getByText(/Historical figures/));
        expect(open).toHaveBeenCalledTimes(1);
    });

    it('hides the opener when the parent does not provide it', () => {
        renderWizard({});
        expect(screen.queryByText(/Historical figures/)).toBeNull();
    });
});
