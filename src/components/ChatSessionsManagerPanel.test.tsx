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

vi.mock('../kernel/runtime', () => ({
    runtime: {
        getVersion: vi.fn().mockReturnValue('4.5.0'),
        getService: vi.fn().mockReturnValue({ getLinked: vi.fn().mockResolvedValue([]) }),
    },
}));

vi.mock('../kernel/instances', () => ({
    rootLogger: { child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
}));

const mockChatStore = {
    sessions: [] as any[],
    activeSessionId: null as string | null,
    isLoaded: true,
    deleteSession: vi.fn().mockResolvedValue(undefined),
    renameSession: vi.fn().mockResolvedValue(undefined),
    archiveSession: vi.fn().mockResolvedValue(undefined),
    unarchiveSession: vi.fn().mockResolvedValue(undefined),
    tagSession: vi.fn().mockResolvedValue(undefined),
    moveToFolder: vi.fn().mockResolvedValue(undefined),
    pinSession: vi.fn().mockResolvedValue(undefined),
    setActiveSessionId: vi.fn(),
};

vi.mock('../stores/chat/store', () => ({
    useChatStore: Object.assign(
        vi.fn((sel?: any) => (sel ? sel(mockChatStore) : mockChatStore)),
        { getState: vi.fn(() => mockChatStore) },
    ),
}));

vi.mock('../stores/debate-session-store', () => ({
    useDebateSessionStore: Object.assign(
        vi.fn((sel?: any) => (sel ? sel({ sessions: [], isLoaded: true }) : { sessions: [], isLoaded: true })),
        { getState: vi.fn(() => ({ sessions: [], isLoaded: true })) },
    ),
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ChatSessionsManagerPanel (smoke)', () => {
    it('renders without crashing', async () => {
        const { default: ChatSessionsManagerPanel } = await import('./ChatSessionsManagerPanel');
        const { MemoryRouter } = await import('react-router-dom');
        render(<MemoryRouter><ChatSessionsManagerPanel /></MemoryRouter>);
        expect(screen.getByText('Chat Sessions')).toBeDefined();
    });
});
