import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { councilState } = vi.hoisted(() => ({
    councilState: {
        sessions: [] as Array<Record<string, unknown>>,
        activeSessionId: null as string | null,
        refresh: vi.fn(() => Promise.resolve()),
        select: vi.fn(),
    },
}));

vi.mock('../../stores/councilStore', () => ({
    useCouncilStore: (selector?: (s: typeof councilState) => unknown) =>
        selector ? selector(councilState) : councilState,
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('CouncilPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        councilState.sessions = [];
        councilState.activeSessionId = null;
    });

    it('renders the fleet councils heading', async () => {
        const { CouncilPanel } = await import('./CouncilPanel');
        render(<CouncilPanel />);
        expect(await screen.findByText('Fleet — Councils')).toBeDefined();
    });

    it('renders legacy sessions without topic or collections', async () => {
        councilState.sessions = [{ id: 'legacy-1', phase: 'forum', status: 'open' }];
        const { CouncilPanel } = await import('./CouncilPanel');
        render(<CouncilPanel />);
        expect(await screen.findByText('Sessions (1)')).toBeDefined();
        expect(document.body.textContent).not.toContain('NaN');
    });

    it('loads a legacy session detail without crashing', async () => {
        councilState.sessions = [{ id: 'legacy-2', phase: 'forum', status: 'open' }];
        const { CouncilPanel } = await import('./CouncilPanel');
        const { container } = render(<CouncilPanel />);
        // Click the session card to select it; detail fetch goes through the
        // lazy service and any failure lands in the error slot, never a crash.
        const cards = container.querySelectorAll('[style*="cursor: pointer"]');
        expect(cards.length).toBeGreaterThan(0);
        fireEvent.click(cards[0]!);
        await screen.findByText('Sessions (1)');
    });
});
