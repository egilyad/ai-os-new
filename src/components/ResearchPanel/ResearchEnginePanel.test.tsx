import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockSessions = [
    { id: 's1', title: 'Session One', question: 'Why?', loops: [], createdAt: 1 },
];

vi.mock('../../kernel/instances', () => ({
    researchEngine: {
        getAllSessions: vi.fn(() => [...mockSessions]),
        startSession: vi.fn(() => Promise.resolve({ id: 's2' })),
        runLoop: vi.fn(() => Promise.resolve()),
        deleteSession: vi.fn(),
    },
    sourceAdapterRegistry: {
        getConfig: vi.fn(() => ({ enabledSources: [] })),
        getAllAdapters: vi.fn(() => []),
        updateConfig: vi.fn(),
    },
}));

vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({
        args: [],
        sessionId: null,
        topic: '',
        hasLiveDebate: false,
    }),
}));

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [{ id: 'a1', name: 'Agent One', role: 'pro' }],
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'research_engine.title': 'Research Engine',
                'research_engine.subtitle': 'Epistemic loop',
                'research_engine.new_session': 'New Session',
                'research_engine.start': 'Start Research',
                'research_engine.title_placeholder': 'Session title...',
                'research_engine.question_placeholder': 'Enter your research question...',
                'research_engine.empty': 'No research sessions yet',
                'research_engine.empty_desc': 'Start a new session.',
                'research_engine.sources': 'sources',
                'research_engine.available_sources': 'Available Sources',
                'research_engine.error_refresh': 'Failed to load research sessions',
                'research_engine.error_create': 'Failed to create research session',
                'research_engine.error_run': 'Research run failed',
                'research_engine.error_delete': 'Failed to delete research session',
                'common.cancel': 'Cancel',
                'common.dismiss_error': 'Dismiss error',
            };
            return map[key] ?? key;
        },
    }),
}));

describe('ResearchEnginePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders sessions from the engine', async () => {
        const Panel = (await import('./ResearchEnginePanel')).default;
        render(<Panel />);
        expect(await screen.findByText('Research Engine')).toBeDefined();
        expect(screen.getByText('Session One')).toBeDefined();
    });

    it('banners a create failure instead of swallowing it', async () => {
        const { researchEngine } = await import('../../kernel/instances');
        vi.mocked(researchEngine.startSession).mockRejectedValueOnce(new Error('db down'));
        const Panel = (await import('./ResearchEnginePanel')).default;
        render(<Panel />);
        await screen.findByText('Research Engine');
        fireEvent.click(screen.getByText('New Session'));
        fireEvent.change(screen.getByPlaceholderText('Session title...'), {
            target: { value: 'T' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your research question...'), {
            target: { value: 'Q' },
        });
        fireEvent.click(screen.getByText('Start Research'));
        expect(await screen.findByText('Failed to create research session')).toBeDefined();
    });

    it('tolerates a non-array session payload', async () => {
        const { researchEngine } = await import('../../kernel/instances');
        vi.mocked(researchEngine.getAllSessions).mockReturnValueOnce(null as never);
        const Panel = (await import('./ResearchEnginePanel')).default;
        render(<Panel />);
        expect(await screen.findByText('No research sessions yet')).toBeDefined();
    });
});
