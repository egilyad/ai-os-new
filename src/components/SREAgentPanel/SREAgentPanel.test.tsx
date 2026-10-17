import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../kernel/instances', () => ({
    advisorService: {
        getSuggestions: vi.fn(() => []),
        getSREAlerts: vi.fn(() => []),
        getMetrics: vi.fn(() => ({})),
        getWhatIfAnalysis: vi.fn(() => null),
        getPromptCachingAdvice: vi.fn(() => null),
        getConfig: vi.fn(() => ({ enableAutoFix: false })),
        executeFix: vi.fn(),
        dismissSuggestion: vi.fn(),
        updateConfig: vi.fn(),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: {
        ADVISOR_SUGGESTION: 'advisor:suggestion',
        ADVISOR_SUGGESTION_EXECUTED: 'advisor:executed',
        ADVISOR_SUGGESTION_DISMISSED: 'advisor:dismissed',
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../ModuleInfo', () => ({
    default: () => null,
}));

describe('SREAgentPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the empty state when there is nothing to report', async () => {
        const Panel = (await import('./SREAgentPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('sre.suggestions.empty')).toBeDefined();
    });

    it('banners a refresh failure instead of going silently stale', async () => {
        const { advisorService } = await import('../../kernel/instances');
        vi.mocked(advisorService.getSuggestions).mockImplementationOnce(() => {
            throw new Error('advisor down');
        });
        const Panel = (await import('./SREAgentPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('sre.error.refresh')).toBeDefined();
    });

    it('tolerates non-array payloads from the advisor', async () => {
        const { advisorService } = await import('../../kernel/instances');
        vi.mocked(advisorService.getSuggestions).mockReturnValueOnce(null as never);
        vi.mocked(advisorService.getSREAlerts).mockReturnValueOnce({} as never);
        const Panel = (await import('./SREAgentPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('sre.suggestions.empty')).toBeDefined();
    });

    it('banners a failed fix execution', async () => {
        const { advisorService } = await import('../../kernel/instances');
        vi.mocked(advisorService.getSuggestions).mockReturnValueOnce([
            { id: 's1', title: 'Fix me', severity: 'warning' },
        ] as never);
        vi.mocked(advisorService.executeFix).mockImplementationOnce(() => {
            throw new Error('nope');
        });
        vi.useFakeTimers();
        try {
            const Panel = (await import('./SREAgentPanel')).default;
            render(<Panel />);
            fireEvent.click(await screen.findByText('sre.execute'));
            await vi.advanceTimersByTimeAsync(600);
            expect(await screen.findByText('sre.error.execute')).toBeDefined();
        } finally {
            vi.useRealTimers();
        }
    });
});
