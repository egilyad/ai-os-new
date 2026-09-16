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

const mockSessionStore = {
    sessions: [] as any[],
    selectedSessionId: null as string | null,
    activeSessionId: null as string | null,
    isLoaded: true,
    refresh: vi.fn().mockResolvedValue(undefined),
    loadSessions: vi.fn().mockResolvedValue(undefined),
    selectSession: vi.fn(),
    setActiveSessionId: vi.fn(),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    archiveSession: vi.fn().mockResolvedValue(undefined),
    unarchiveSession: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(undefined),
    renameSession: vi.fn().mockResolvedValue(undefined),
    pauseSession: vi.fn().mockResolvedValue(undefined),
    resumeSession: vi.fn().mockResolvedValue(undefined),
    tagSession: vi.fn().mockResolvedValue(undefined),
    moveToFolder: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../stores/debate-session-store', () => ({
    useDebateSessionStore: Object.assign(
        vi.fn((sel?: any) => (sel ? sel(mockSessionStore) : mockSessionStore)),
        { getState: vi.fn(() => mockSessionStore) },
    ),
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

describe('DebatesManagerPanel (smoke)', () => {
    it('renders without crashing', async () => {
        const { default: DebatesManagerPanel } = await import('./DebatesManagerPanel');
        render(<DebatesManagerPanel />);
        expect(screen.getByText('nav.debate_history')).toBeDefined();
    });
});
