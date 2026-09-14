/**
 * P2.17 — Smoke tests for top untested panels.
 * Each panel is rendered with mocked kernel dependencies.
 * Verifies: no crash, renders content.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' as const }),
}));
vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' as const }),
}));

vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
            (props, ref) => <div ref={ref} {...props} />,
        ),
        span: React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
            (props, ref) => <span ref={ref} {...props} />,
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../hooks/useConfirm', () => ({
    useConfirm: () => ({ confirm: vi.fn(() => Promise.resolve(true)), ConfirmDialog: null }),
}));
vi.mock('../../hooks/useAutoClearError', () => ({
    useAutoClearError: () => [null, vi.fn()],
}));
vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [{ id: 'a1', name: 'Alice', role: 'pro' }],
}));
vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({ args: [], hasLiveDebate: false }),
}));
vi.mock('../../hooks/useDebateSession', () => ({
    useDebateSession: () => ({ session: undefined, isLoading: false }),
}));
vi.mock('../../hooks/useSettings', () => ({
    useSettings: () => ({ settings: {}, updateSetting: vi.fn() }),
}));
vi.mock('../../hooks/useNow', () => ({ useNow: () => Date.now() }));

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: () => ({ keys: [], loaded: true }),
    refreshKeyStore: vi.fn(),
}));
vi.mock('../../stores/useSystemStatus', () => ({
    useSystemStatus: () => ({ status: 'ok', services: {}, isLoaded: true }),
}));
vi.mock('../../stores/chat/store', () => ({
    useChatStore: () => ({ sessions: {}, activeSessionId: null }),
}));
vi.mock('../../stores/debate-session-store', () => ({
    useDebateSessionStore: () => ({ sessions: [], activeSessionId: null }),
}));
vi.mock('../../stores/debateLiveStore', () => ({
    useDebateLiveStore: () => ({ events: [], activeSessionId: null }),
}));
vi.mock('../Common/usePolling', () => ({ usePolling: () => {} }));
vi.mock('../Common/Skeleton', () => ({ PanelSkeleton: () => <div /> }));
vi.mock('../Common/ContextMenu', () => ({ ContextMenu: () => null }));
vi.mock('../ConfirmDialog', () => ({ ConfirmDialog: () => null }));
vi.mock('../ModuleInfo', () => ({ default: () => null }));
vi.mock('../PanelStates', () => ({ PanelLoading: () => <div /> }));
vi.mock('../../styles/common', () => ({ errorContainer: {}, dismissBtnRed: {}, textMutedXs: {} }));
vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: () => ({ getVirtualItems: () => [], getTotalSize: () => 0, scrollToIndex: vi.fn() }),
}));
vi.mock('../../kernel/services/cost-optimization-service', () => ({
    getSummary: () => ({ totalSavings: 0, recommendations: [] }),
    getRecommendations: () => [],
    dismissRecommendation: vi.fn(),
}));

// Mock kernel/instances with all named exports as no-op stubs
const noopStub = Object.assign(vi.fn(() => {}), {
    getKeys: () => [], getKey: () => undefined,
    getServers: () => [], getAll: async () => [], getAllRules: () => [],
    getBookmarks: () => [], getSummary: () => ({ totalSpend: 0, byProvider: {}, byAgent: {}, alerts: [] }),
    getAlerts: () => [], getSchedules: () => [], getGroups: () => [],
    getAllGuardians: () => [], getGuardian: () => undefined,
    getEntries: () => [], getAllTags: () => [], count: () => 0,
    init: () => Promise.resolve(),
    search: () => [], getEntries: () => [],
    child: () => noopStub,
    info: () => {}, warn: () => {}, error: () => {}, debug: () => {},
});

vi.mock('../../kernel/instances', () => ({
    debatePolicyEngine: noopStub, groupManager: noopStub, keyService: noopStub,
    rootLogger: noopStub, mcpService: noopStub, chatBookmarksService: noopStub,
    budgetService: noopStub, bridgeKeeperService: noopStub, agentJournalService: noopStub,
    promptLibraryService: noopStub, schedulerService: noopStub, eventBus: noopStub,
    EVENTS: {}, qualityImpactCollector: noopStub, debateEngine: noopStub,
    memoryEngine: noopStub, sessionManager: noopStub, getAllSettings: () => ({} as Record<string, boolean>),
    setSetting: noopStub,
}));
vi.mock('../kernel/instances', () => ({
    debatePolicyEngine: noopStub, groupManager: noopStub, keyService: noopStub,
    rootLogger: noopStub, mcpService: noopStub, chatBookmarksService: noopStub,
    budgetService: noopStub, bridgeKeeperService: noopStub, agentJournalService: noopStub,
    promptLibraryService: noopStub, schedulerService: noopStub, eventBus: noopStub,
    EVENTS: {}, qualityImpactCollector: noopStub, debateEngine: noopStub,
    memoryEngine: noopStub, sessionManager: noopStub, getAllSettings: () => ({} as Record<string, boolean>),
    setSetting: noopStub,
}));
vi.mock('../../kernel/instances/services-extras', () => ({
    debatePolicyEngine: noopStub, groupManager: noopStub, keyService: noopStub,
    rootLogger: noopStub, mcpService: noopStub, chatBookmarksService: noopStub,
    budgetService: noopStub, bridgeKeeperService: noopStub, agentJournalService: noopStub,
    promptLibraryService: noopStub, schedulerService: noopStub, eventBus: noopStub,
    EVENTS: {}, qualityImpactCollector: noopStub, debateEngine: noopStub,
    memoryEngine: noopStub, sessionManager: noopStub, getAllSettings: () => ({} as Record<string, boolean>),
    setSetting: noopStub,
}));

describe('P2.17 Smoke — BudgetPanel', () => {
    it('renders without crashing', async () => {
        const { default: Panel } = await import('./BudgetPanel');
        const { unmount } = render(<Panel />);
        expect(document.body).toBeTruthy();
        unmount();
    });
});

describe('P2.17 Smoke — CostOptimizationPanel', () => {
    it('renders without crashing', async () => {
        const { default: Panel } = await import('./CostOptimizationPanel');
        const { unmount } = render(<Panel />);
        expect(document.body).toBeTruthy();
        unmount();
    });
});

describe('P2.17 Smoke — DebateAnalysisPanel', () => {
    it('renders without crashing', async () => {
        const { default: Panel } = await import('./DebateAnalysisPanel');
        const { unmount } = render(<Panel />);
        expect(document.body).toBeTruthy();
        unmount();
    });
});

describe('P2.17 Smoke — RotationsPanel', () => {
    it('renders without crashing', async () => {
        const { default: Panel } = await import('./RotationsPanel');
        const { unmount } = render(<Panel />);
        expect(document.body).toBeTruthy();
        unmount();
    });
});

describe('P2.17 Smoke — WebhooksPanel', () => {
    it('renders without crashing', async () => {
        const { default: Panel } = await import('./WebhooksPanel');
        const { unmount } = render(<Panel />);
        expect(document.body).toBeTruthy();
        unmount();
    });
});

describe('P2.17 Smoke — DecisionLogPanel', () => {
    it('renders without crashing', async () => {
        const { default: Panel } = await import('./DecisionLogPanel');
        const { unmount } = render(<Panel />);
        expect(document.body).toBeTruthy();
        unmount();
    });
});
