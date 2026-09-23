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

vi.mock('../../kernel/instances', () => {
    const noop = vi.fn().mockResolvedValue([]);
    return {
        crewService: { startCrew: vi.fn(), listCrews: noop },
        councilService: { listCouncils: noop },
        graphService: { listGraphs: noop },
        personaService: { listPersonas: noop },
        autonomyService: { getStatus: vi.fn().mockResolvedValue({ active: false }) },
        ecosystemService: { listAgents: noop },
        federationService: { listPeers: noop },
        evalService: { listRuns: noop },
        codeAgentService: { listSessions: noop },
        deckService: { listDecks: noop },
        agentForgeService: { listProjects: noop },
        argTechService: { listArticles: noop },
        assistantService: { getStatus: vi.fn().mockResolvedValue({}) },
        dotpromptService: { listPrompts: noop },
        dshService: { getStatus: vi.fn().mockResolvedValue({}) },
        dyadService: { listDyads: noop },
        formatService: { listFormats: noop },
        forumPlusService: { listTopics: noop },
        marketplaceService: { listListings: noop },
        openMetricsService: { getMetrics: vi.fn().mockResolvedValue({}) },
        rivalLabsService: { listLabs: noop },
        runtime: { getVersion: vi.fn().mockReturnValue('4.5.0') },
        rootLogger: { child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
    };
});

vi.mock('../../stores/crewStore', () => ({
    useCrewStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { crews: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ crews: [], refresh: vi.fn() })) },
    ),
}));
vi.mock('../../stores/councilStore', () => ({
    useCouncilStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { councils: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ councils: [] })) },
    ),
}));
vi.mock('../../stores/graphStore', () => ({
    useGraphStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { graphs: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ graphs: [] })) },
    ),
}));
vi.mock('../../stores/personaStore', () => ({
    usePersonaStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { personas: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ personas: [] })) },
    ),
}));
vi.mock('../../stores/opsStore', () => ({
    useOpsStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { ops: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ ops: [] })) },
    ),
}));
vi.mock('../../stores/interopStore', () => ({
    useInteropStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { interop: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ interop: [] })) },
    ),
}));
vi.mock('../../stores/metaStore', () => ({
    useMetaStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { meta: {} as Record<string, unknown>, refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ meta: {} })) },
    ),
}));
vi.mock('../../stores/trustStore', () => ({
    useTrustStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { trust: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ trust: [] })) },
    ),
}));
vi.mock('../../stores/frontierStore', () => ({
    useFrontierStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { frontier: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ frontier: [] })) },
    ),
}));
vi.mock('../../stores/rivalStore', () => ({
    useRivalStore: Object.assign(
        vi.fn((sel?: (store: unknown) => unknown) => {
            const state = { rivals: [] as never[], refresh: vi.fn().mockResolvedValue(undefined) };
            return sel ? sel(state) : state;
        }),
        { getState: vi.fn(() => ({ rivals: [] })) },
    ),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FleetPanel (smoke)', () => {
    it('renders without crashing', async () => {
        const { default: FleetPanel } = await import('./FleetPanel');
        render(<FleetPanel />);
        expect(screen.getByText('fleet.title')).toBeDefined();
    });
});
