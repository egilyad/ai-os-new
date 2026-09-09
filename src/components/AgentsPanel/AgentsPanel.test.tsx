import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AgentsPanel from './AgentsPanel';

const mockTools = vi.hoisted(() => [
    { id: 'web_search', name: 'Web Search', description: 'Search the web' },
    { id: 'summarize', name: 'Summarize', description: 'Summarize content' },
    { id: 'code_review', name: 'Code Review', description: 'Review code' },
]);

const mockRoles = vi.hoisted(() => [
    {
        id: 'role-1',
        name: 'Researcher',
        systemPrompt: 'You are a researcher',
        capabilities: ['web_search'],
        baseTemperature: 0.3,
    },
]);

const TOPO = vi.hoisted(() => ({
    id: 'topo-1',
    version: '1.0',
    name: 'Test Topo',
    nodes: [
        {
            id: 'agent-1',
            type: 'agent',
            label: 'Alpha Agent',
            config: {
                roleName: 'Research Analyst',
                prompt: 'Test prompt',
                tools: ['web_search', 'summarize'],
                temperature: 0.3,
                provider: 'openai',
                model: 'gpt-4',
            },
        },
        {
            id: 'agent-2',
            type: 'agent',
            label: 'Beta Agent',
            config: {
                roleName: 'Software Engineer',
                prompt: 'Code review',
                tools: ['code_review'],
                temperature: 0.2,
                provider: 'anthropic',
                model: 'claude-3',
            },
        },
    ],
    edges: [],
    policies: [],
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'agents.agent_workforce': 'Agent Workforce',
                'agents.header_subtitle': 'Manage your autonomous agents',
                'agents.export': 'Export',
                'agents.import': 'Import',
                'agents.confirm_reset_all': 'Confirm Reset?',
                'agents.reset_all_stats': 'Reset All Stats',
                'agents.spawn_agent': 'Spawn Agent',
                'agents.quick_start_label': 'Quick Start',
                'agents.search_placeholder': 'Search agents...',
                'agents.status_filter_label': 'Status:',
                'agents.filter_all': 'All',
                'agents.filter_active': 'Active',
                'agents.filter_paused': 'Paused',
                'agents.empty_title': 'No agents deployed',
                'agents.empty_search': 'No agents match your search.',
                'agents.empty_no_topology': 'No active topology found.',
                'agents.open_builder': 'Open Builder',
                'agents.pause_agent_title': 'Pause agent',
                'agents.resume_agent_title': 'Resume agent',
                'agents.no_capabilities': 'No capabilities',
                'agents.stat_invocations': 'Invocations',
                'agents.stat_success_rate': 'Success Rate',
                'agents.stat_errors': 'Errors',
                'agents.stat_latency': 'Latency',
                'agents.tab_config': 'Config',
                'agents.tab_capabilities': 'Capabilities',
                'agents.tab_infra': 'Infrastructure',
                'agents.tab_observability': 'Observability',
                'agents.tab_permissions': 'Permissions',
                'agents.tab_handoffs': 'Handoffs',
                'agents.tab_history': 'History',
                'common.aria.grid_view': 'Grid view',
                'common.aria.list_view': 'List view',
            };
            return labels[key] || key;
        },
    }),
}));

vi.mock('../../kernel/events/event-bus', () => ({
    EVENTS: {
        COGNITIVE_STEP_COMPLETED: 'cognitive:step:completed',
        STREAM_END: 'chat:stream:end',
        AGENT_LIFECYCLE_CHANGE: 'agent:lifecycle:change',
        SYSTEM_NODE_SPAWN: 'system:node:spawn',
        SYSTEM_NODE_REMOVED: 'system:node:removed',
        AGENT_RESTARTED: 'agent:restarted',
        AGENT_HANDOFF_INITIATED: 'agent:handoff:initiated',
        ELO_RATING_UPDATED: 'elo:rating:updated',
        SYSTEM_TOPOLOGY_MOUNTED: 'system:topology:mounted',
        SYSTEM_NAVIGATE: 'system:navigate',
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
            if (event === 'system:topology:mounted') {
                setTimeout(() => cb(TOPO), 0);
            }
            return vi.fn();
        }),
        onSafe: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
}));

vi.mock('../../stores/useKeyStore', () => {
    const state = {
        keys: [{ id: 'key-1', status: 'active', provider: 'openai', availableModels: ['gpt-4'] }],
    };
    return {
        useKeyStore: vi.fn((selector?: (s: typeof state) => unknown) => {
            if (typeof selector === 'function') return selector(state);
            return state;
        }),
    };
});

vi.mock('../../kernel/instances', () => ({
    rootLogger: {
        child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
    },
    toolService: { getTools: vi.fn(() => mockTools) },
    roleService: {
        getAllRoles: vi.fn(() => mockRoles),
        getRole: vi.fn((id: string) => mockRoles.find((r) => r.id === id) || null),
    },
    orchestrator: {
        getActiveTopology: vi.fn(() => TOPO),
        mount: vi.fn(),
        isNodeDisabled: vi.fn(() => false),
        setNodeDisabled: vi.fn(),
    },
    agentService: {
        getAllStats: vi.fn(() => ({
            'agent-1': { calls: 10, tokens: 500, latency: 200 },
            'agent-2': { calls: 5, tokens: 200, latency: 800 },
        })),
        spawnAgent: vi.fn(() => 'agent-new'),
        toggleAgent: vi.fn(),
        pauseAllAgents: vi.fn(),
        resumeAllAgents: vi.fn(),
        resetStats: vi.fn(),
        resetAllStats: vi.fn(),
        exportAgents: vi.fn(() => '[]'),
        importAgents: vi.fn(() => 1),
        getAgents: vi.fn(() => []),
        updateAgent: vi.fn(),
        deleteAgent: vi.fn(),
        getGroups: vi.fn(() => []),
        createGroup: vi.fn(),
        executeGroup: vi.fn(() => Promise.resolve([])),
    },
    agentVersionService: {
        getVersions: vi.fn(() => Promise.resolve([])),
        saveVersion: vi.fn(() => Promise.resolve()),
        rollback: vi.fn(() => Promise.resolve(null)),
    },
    policyService: {
        getAgentPolicy: vi.fn(() => ({ freeOnly: false })),
        setAgentPolicy: vi.fn(),
    },
    taskHandoffService: {
        getHandoffs: vi.fn(() => []),
    },
    templateService: {
        getTemplates: vi.fn(() => Promise.resolve([])),
        saveAsTemplate: vi.fn(),
    },
    metricsService: {
        getAgentPercentiles: vi.fn(() => ({ p50: 0, p90: 0, p95: 0, p99: 0 })),
        getAgentThroughput: vi.fn(() => 0),
    },
    workforceFederation: {
        getBridges: vi.fn(() => []),
        createBridge: vi.fn(),
    },
    eloService: {
        init: vi.fn(() => Promise.resolve()),
        getLeaderboard: vi.fn(() => []),
        getHistory: vi.fn(() => []),
    },
    adapterRegistry: {
        getRuntimeStatus: vi.fn(() => ({})),
    },
    keyService: {
        getKeys: vi.fn(() => []),
        getAlerts: vi.fn(() => []),
        getPools: vi.fn(() => []),
        getFreeTierLimits: vi.fn(() => ({})),
        getPoolStrategy: vi.fn(() => 'round-robin' as const),
        getPoolKeyDistribution: vi.fn(() => []),
        verifyKey: vi.fn(() => Promise.resolve(false)),
        detectProvider: vi.fn(() => null),
        getRoutingPolicy: vi.fn(() => ({
            globalSLAMode: 'BALANCED' as const,
            latencyThreshold: 1500,
        })),
    },
    settingsService: {
        getSettings: vi.fn(() => ({ theme: 'dark', language: 'en', notifications: true })),
        subscribe: vi.fn(() => vi.fn()),
    },
    debateWorkspace: {
        init: vi.fn(() => Promise.resolve()),
        createRoom: vi.fn(() => Promise.resolve('room-1')),
        closeRoom: vi.fn(() => Promise.resolve()),
        setActiveRoom: vi.fn(),
        getActiveRoom: vi.fn(() => null),
        listRooms: vi.fn(() => []),
        getRoomEntry: vi.fn(() => undefined),
        syncFromEngine: vi.fn(() => Promise.resolve()),
        getIndex: vi.fn(() => ({ rooms: [], activeRoomId: null, lastUpdated: Date.now() })),
        destroy: vi.fn(),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
            if (event === 'system:topology:mounted') {
                setTimeout(() => cb(TOPO), 0);
            }
            return vi.fn();
        }),
        onSafe: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: {
        COGNITIVE_STEP_COMPLETED: 'cognitive:step:completed',
        SYSTEM_TOPOLOGY_MOUNTED: 'system:topology:mounted',
        NAVIGATE: 'system:navigate',
        NOTIFICATION: 'notification',
    },
}));

async function waitForAgentCards() {
    await screen.findByText('Research Analyst');
}

function getAgentCard() {
    return screen.getByLabelText(/Alpha Agent - Research Analyst/);
}

describe('AgentsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Agent Workforce heading', async () => {
        render(<AgentsPanel />);
        expect(await screen.findByText('Agent Workforce')).toBeDefined();
    });

    it('renders agent cards from topology', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        expect(screen.getByText('Research Analyst')).toBeDefined();
        const betaCards = screen.getAllByText(/Beta Agent/);
        expect(betaCards.length).toBeGreaterThanOrEqual(1);
    });

    it('renders quick start template buttons', async () => {
        render(<AgentsPanel />);
        expect(await screen.findByText('Quick Start')).toBeDefined();
        expect(screen.getByText('Research')).toBeDefined();
        expect(screen.getByText('Coding')).toBeDefined();
    });

    it('renders search input with placeholder', async () => {
        render(<AgentsPanel />);
        const search = await screen.findByPlaceholderText('Search agents...');
        expect(search).toBeDefined();
    });

    it('filters agents by search query', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        const search = screen.getByPlaceholderText('Search agents...');
        fireEvent.change(search, { target: { value: 'Beta' } });
        const betaCards = screen.getAllByText(/Beta Agent/);
        expect(betaCards.length).toBeGreaterThanOrEqual(1);
        const alphaHeadings = screen.queryAllByRole('heading', { name: 'Alpha Agent' });
        expect(alphaHeadings.length).toBe(0);
    });

    it('filters agents by status filter', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        const pausedBtn = screen.getByText('Paused');
        fireEvent.click(pausedBtn);
        expect(screen.getByText('No agents deployed')).toBeDefined();
    });

    it('has aria-pressed on filter buttons', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        const allBtn = screen.getByText('All');
        expect(allBtn.getAttribute('aria-pressed')).toBe('true');
        const activeBtn = screen.getByText('Active');
        expect(activeBtn.getAttribute('aria-pressed')).toBe('false');
    });

    it('has view toggle with radio role', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        const gridBtn = screen.getByLabelText('Grid view');
        const listBtn = screen.getByLabelText('List view');
        expect(gridBtn.getAttribute('role')).toBe('radio');
        expect(listBtn.getAttribute('role')).toBe('radio');
    });

    it('opens modal on card click', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeDefined();
        });
        expect(screen.getByText('Config')).toBeDefined();
    });

    it('modal has role="dialog" and aria-modal', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        const dialog = await screen.findByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(within(dialog).getByText('Alpha Agent')).toBeDefined();
    });

    it('modal sidebar has role="tablist" with tabs', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        await screen.findByRole('dialog');
        expect(screen.getByRole('tablist')).toBeDefined();
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(8);
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    });

    it('switches tab on sidebar click', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        await screen.findByRole('dialog');
        const tabs = screen.getAllByRole('tab');
        fireEvent.click(tabs[1]);
        await waitFor(() => {
            expect(tabs[1].getAttribute('aria-selected')).toBe('true');
            expect(tabs[0].getAttribute('aria-selected')).toBe('false');
        });
    });

    it('closes modal on X button click', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        await screen.findByRole('dialog');
        const closeBtn = screen.getByLabelText('Close agent details');
        fireEvent.click(closeBtn);
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('renders export and import buttons', async () => {
        render(<AgentsPanel />);
        await screen.findByText('Agent Workforce');
        expect(screen.getByText('Export')).toBeDefined();
        expect(screen.getByText('Import')).toBeDefined();
    });

    it('renders agent cards with aria-label', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        const card = getAgentCard();
        expect(card).toBeDefined();
        expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('shows empty state description placeholder for stat cards', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        const invocations = screen.getAllByText('Invocations');
        expect(invocations.length).toBeGreaterThanOrEqual(1);
        const latency = screen.getAllByText('Latency');
        expect(latency.length).toBeGreaterThanOrEqual(1);
    });

    it('renders duplicate button in modal', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        await screen.findByRole('dialog');
        expect(screen.getByLabelText('Duplicate agent')).toBeDefined();
    });

    it('spawns agent on template click', async () => {
        const { agentService } = await import('../../kernel/instances');
        render(<AgentsPanel />);
        const codingBtn = await screen.findByLabelText('Deploy Coding agent');
        fireEvent.click(codingBtn);
        expect(agentService.spawnAgent).toHaveBeenCalled();
    });

    it('renders error banner with alert role', async () => {
        render(<AgentsPanel />);
        await screen.findByText('Agent Workforce');
        const { orchestrator } = await import('../../kernel/instances');
        (orchestrator.getActiveTopology as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
            throw new Error('fail');
        });
        const spawnBtn = screen.getByText('Spawn Agent');
        fireEvent.click(spawnBtn);
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeDefined();
        });
    });

    it('Keyboard Enter on card opens modal', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.keyDown(getAgentCard(), { key: 'Enter' });
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeDefined();
        });
    });

    it('Escape key closes modal', async () => {
        render(<AgentsPanel />);
        await waitForAgentCards();
        fireEvent.click(getAgentCard());
        await screen.findByRole('dialog');
        fireEvent.keyDown(window, { key: 'Escape' });
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });
});
