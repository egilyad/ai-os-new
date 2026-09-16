import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

vi.mock('../../kernel/instances', () => ({
    debateEngine: {
        listSessions: vi.fn().mockResolvedValue([]),
        getSession: vi.fn().mockResolvedValue(null),
        startSession: vi.fn().mockResolvedValue('s1'),
        cancelSession: vi.fn().mockResolvedValue(undefined),
        pauseSession: vi.fn().mockResolvedValue(undefined),
        resumeSession: vi.fn().mockResolvedValue(undefined),
    },
    debateService: {
        getSessions: vi.fn().mockResolvedValue([]),
        getVerdict: vi.fn().mockResolvedValue(null),
    },
    cognitiveIntelligenceService: {
        getMetrics: vi.fn().mockResolvedValue(null),
        getPressure: vi.fn().mockResolvedValue([]),
        getIssues: vi.fn().mockResolvedValue([]),
    },
    orchestrator: {
        getAbortSignal: vi.fn().mockReturnValue(new AbortController().signal),
    },
    sessionManager: {
        getSession: vi.fn().mockResolvedValue(null),
        getSessions: vi.fn().mockResolvedValue([]),
    },
    eventBus: {
        on: vi.fn().mockReturnValue(vi.fn()),
        onSafe: vi.fn().mockReturnValue(vi.fn()),
        emit: vi.fn(),
        getSubscriptionStats: vi.fn().mockReturnValue({ totalCallbacks: 0 }),
    },
    EVENTS: { DEBATE_UPDATED: 'debate:updated', DEBATE_STARTED: 'debate:started' },
    DebateRuntimeEvents: { DEBATE_RUNTIME_METRICS: 'debate:runtime:metrics' },
    rootLogger: { child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
}));

vi.mock('../../stores/debateLiveStore', () => ({
    useDebateLiveStore: Object.assign(
        vi.fn(() => ({
            sessions: {},
            activeSessionId: null,
            agentEvents: [],
            roundEvents: [],
            streamingContent: new Map(),
            loadSessions: vi.fn(),
        })),
        { getState: vi.fn(() => ({ sessions: {}, activeSessionId: null })) },
    ),
}));

vi.mock('../../stores/chat/store', () => ({
    useChatStore: Object.assign(
        vi.fn(() => ({ sessions: [], activeSessionId: null })),
        { getState: vi.fn(() => ({ sessions: [] })) },
    ),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../ModuleInfo', () => ({
    default: () => <div />,
}));

describe('DebateRuntimePanel (smoke)', () => {
    it('renders without crashing', async () => {
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        expect(screen.getByText('debate_runtime.title')).toBeDefined();
    });
});
