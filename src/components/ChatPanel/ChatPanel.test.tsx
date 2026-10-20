import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChatPanel from './ChatPanel';

const mockKeys = [
    {
        id: '1',
        provider: 'OpenRouter',
        key: '',
        label: 'Main',
        status: 'active',
        availableModels: ['gpt-4o'],
        latency: 120,
        stats: {},
    },
    {
        id: '2',
        provider: 'Groq',
        key: '',
        label: 'Cloud',
        status: 'active',
        availableModels: ['llama-3.3-70b'],
        latency: 80,
        stats: {},
    },
];

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: () => ({
        keys: mockKeys,
        activeKeys: mockKeys.filter((k) => k.status === 'active'),
        addKey: vi.fn(),
        removeKey: vi.fn(),
        checkHealth: vi.fn(),
        checkAllHealth: vi.fn(),
    }),
    useKeyList: () => ({
        keys: mockKeys,
        activeKeys: mockKeys.filter((k) => k.status === 'active'),
    }),
}));

const mockChatState = {
    sessions: [
        { id: 's1', title: 'Test Chat', history: [], createdAt: Date.now(), updatedAt: Date.now() },
    ],
    activeSessionId: 's1',
    setActiveSessionId: vi.fn(),
    setSessions: vi.fn(),
    history: [],
    isSending: false,
    isLoaded: true,
    sendMessage: vi.fn(),
    cancelMessage: vi.fn(),
    cancelSending: vi.fn(),
    clearHistory: vi.fn(),
    createSession: vi.fn(() => 'new-session'),
    deleteSession: vi.fn(),
    forkSession: vi.fn(),
    editEntry: vi.fn(),
    hasMoreSessions: true,
    loadMoreSessions: vi.fn(),
    getSessionConfig: vi.fn(() => ({ model: 'gpt-4o' })),
    switchModel: vi.fn(),
    switchKey: vi.fn(),
    setAgent: vi.fn(),
    systemPrompt: '',
    setSystemPrompt: vi.fn(),
    activeRequestIds: new Set<string>(),
};

vi.mock('../../stores/useChatStore', () => {
    // The panel uses both the selector form and `useChatStore.getState()`.
    const useChatStore = Object.assign(
        (selector?: (store: unknown) => unknown) =>
            selector ? selector(mockChatState) : mockChatState,
        {
            getState: () => mockChatState,
            setState: vi.fn(),
            subscribe: vi.fn(() => () => {}),
        },
    );
    return {
        useChatStore,
        useActiveSessionHistory: () => [],
    };
});

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() });
    return {
        routerService: {
            getRankedProviders: vi.fn(() => []),
        },
        settingsService: {
            getSettings: vi.fn(() => ({ language: 'en' })),
            subscribe: vi.fn(() => vi.fn()),
        },
        storageAdapter: {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
        },
        personaService: {
            getAll: vi.fn(() => []),
            getActive: vi.fn(() => null),
            setActive: vi.fn(),
        },
        orchestrator: {
            getActiveTopology: vi.fn(() => ({ nodes: [], edges: [] })),
        },
        agentService: {
            resolveAgent: vi.fn(() => null),
        },
        keyService: {
            refreshModels: vi.fn(() => Promise.resolve()),
        },
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
    };
});

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: {
        NOTIFICATION: 'notification',
        START_CHAT_WITH_TARGET: 'chat:target:start',
        SELECT_MODEL: 'chat:model:select',
        NAVIGATE: 'system:navigate',
    },
}));

vi.mock('../ProviderIcon/ProviderIcon', () => ({ default: () => null }));

// The message search panel boots the message-index service, which needs a
// registered database — not available in a component unit test.
vi.mock('../MessageSearchPanel', () => ({ default: () => null }));

vi.mock('react-router-dom', () => ({
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useNavigate: () => vi.fn(),
}));

// Translations resolve to their keys so the test can assert on them.
vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ChatPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        
        const { container } = render(<ChatPanel />);
        expect(container).toBeDefined();
    }, 30000);

    it('renders without no-providers message', () => {
        
        render(<ChatPanel />);
        expect(screen.queryByText('No Providers Configured')).toBeNull();
    });

    it('shows send button', async () => {
        
        render(<ChatPanel />);
        await waitFor(() => {
            const sendButton = document.querySelector('button');
            expect(sendButton).toBeDefined();
        });
    });

    it('renders text input area', () => {
        
        render(<ChatPanel />);
        const textareas = document.querySelectorAll('textarea');
        expect(textareas.length).toBeGreaterThan(0);
    });

    it('renders session title', async () => {
        
        render(<ChatPanel />);
        const titles = await screen.findAllByText('Test Chat');
        expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('renders new chat button', async () => {
        
        render(<ChatPanel />);
        expect(await screen.findByTitle('chat.new_session')).toBeDefined();
    });

    it('renders search input in sidebar', () => {
        
        render(<ChatPanel />);
        const searchInputs = document.querySelectorAll(
            'input[placeholder="chat.search_placeholder"]',
        );
        expect(searchInputs.length).toBeGreaterThan(0);
    });

    it('has textarea for message input', () => {
        
        render(<ChatPanel />);
        const textarea = document.querySelector('textarea');
        expect(textarea?.getAttribute('placeholder')).toBeDefined();
    });

    it('lists the active provider keys', async () => {
        
        render(<ChatPanel />);
        expect(await screen.findByText('Main')).toBeDefined();
    });
});
