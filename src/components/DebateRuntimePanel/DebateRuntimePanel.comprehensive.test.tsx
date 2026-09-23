import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

const mockEventBus = {
    on: vi.fn().mockReturnValue(vi.fn()),
    onSafe: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    getSubscriptionStats: vi.fn().mockReturnValue({ totalCallbacks: 0 }),
};

const mockDebateEngine = {
    getActiveSessions: vi.fn().mockReturnValue([]),
    getAllSessions: vi.fn().mockReturnValue([]),
    getSession: vi.fn().mockReturnValue(null),
    startSession: vi.fn().mockResolvedValue('s1'),
    cancelSession: vi.fn().mockResolvedValue(undefined),
    pauseSession: vi.fn().mockResolvedValue(undefined),
    resumeSession: vi.fn().mockResolvedValue(undefined),
};

const mockDebateService = {
    getSessions: vi.fn().mockResolvedValue([]),
    getVerdict: vi.fn().mockResolvedValue(null),
    getActiveDebateSession: vi.fn().mockReturnValue(null),
    startTopologyDebate: vi.fn().mockResolvedValue({ id: 's1', topic: 'test' }),
};

const mockAgentService = {
    getAgents: vi.fn().mockReturnValue([
        { id: 'agent-1', name: 'Agent 1', status: 'idle', role: 'pro' },
        { id: 'agent-2', name: 'Agent 2', status: 'busy', role: 'con' },
    ]),
    toggleAgent: vi.fn(),
    restartAgent: vi.fn().mockResolvedValue(undefined),
    updateAgent: vi.fn(),
};

const mockCognitiveService = {
    getMetrics: vi.fn().mockReturnValue({
        debateQuality: 0.75,
        avgContradictionDensity: 0.3,
        avgConsensusConfidence: 0.8,
        avgReasoningCoherence: 0.65,
        reasoningCollapseDetected: false,
    }),
    getPressure: vi.fn().mockReturnValue({
        level: 'normal',
        score: 0.45,
        activeReasoningChains: 3,
        contentionScore: 0.35,
        complexityScore: 0.55,
    }),
    getActiveIssues: vi.fn().mockReturnValue([]),
};

const mockOrchestrator = {
    getActiveTopology: vi.fn().mockReturnValue({
        nodes: [
            { id: 'agent-1', label: 'Agent 1', type: 'agent', config: { provider: 'openai', model: 'gpt-4' } },
            { id: 'agent-2', label: 'Agent 2', type: 'agent', config: { provider: 'anthropic', model: 'claude-3' } },
        ],
    }),
};

vi.mock('../../kernel/instances', () => ({
    debateEngine: mockDebateEngine,
    debateService: mockDebateService,
    debateHumanService: { addArgument: vi.fn().mockResolvedValue(undefined) },
    cognitiveIntelligenceService: mockCognitiveService,
    orchestrator: mockOrchestrator,
    sessionManager: { getLinked: vi.fn().mockResolvedValue([]) },
    agentService: mockAgentService,
    eventBus: mockEventBus,
    EVENTS: {
        DEBATE_SESSION_CREATED: 'debate:runtime:session:created',
        DEBATE_SESSION_STARTED: 'debate:runtime:session:started',
        DEBATE_SESSION_COMPLETED: 'debate:runtime:session:completed',
        DEBATE_SESSION_FAILED: 'debate:runtime:session:failed',
        DEBATE_SESSION_CANCELLED: 'debate:runtime:session:cancelled',
        DEBATE_PHASE_CHANGED: 'debate:runtime:phase:changed',
        NOTIFICATION: 'notification',
    },
    DebateRuntimeEvents: {
        AGENT_CHUNK: 'debate:runtime:agent:chunk',
        AGENT_RESPONDED: 'debate:runtime:agent:responded',
    },
    rootLogger: { child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
}));

vi.mock('../../stores/debateLiveStore', () => ({
    useDebateLiveStore: Object.assign(
        vi.fn(() => ({
            currentThinking: new Map(),
            streamingContent: new Map(),
            agentEvents: [],
            emotions: new Map(),
        })),
        { getState: vi.fn(() => ({ currentThinking: new Map(), streamingContent: new Map() })) },
    ),
}));

vi.mock('../../stores/chat/store', () => ({
    useChatStore: Object.assign(
        vi.fn(() => ({ sessions: [], activeSessionId: null })),
        { getState: vi.fn(() => ({ sessions: [], activeSessionId: null })) },
    ),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string, params?: Record<string, string | number>) => {
        if (key === 'debate_runtime.agents_count') return `${params?.count} agents`;
        if (key === 'debate_runtime.round') return `Round ${params?.value}`;
        if (key === 'debate_runtime.topology') return `Topology: ${params?.value}`;
        if (key === 'debate_runtime.tokens_short') return `${params?.value} tok`;
        if (key === 'debate_runtime.tokens_used') return `${params?.value} tokens`;
        if (key === 'debate_runtime.cost_used') return `$${params?.value}`;
        if (key === 'debate_runtime.active_sessions') return `Sessions (${params?.count})`;
        if (key === 'debate_runtime.select_agents') return `Select agents (${params?.selected})`;
        if (key === 'debate_runtime.thinking') return `${params?.agent} thinking`;
        if (key === 'debate_runtime.active_issues') return `Issues (${params?.count})`;
        if (key === 'debate_runtime.cognitive_pressure_label') return `Pressure: ${params?.level}`;
        if (key === 'debate_runtime.score') return `Score: ${params?.value}`;
        if (key === 'debate_runtime.chains') return `Chains: ${params?.count}`;
        if (key === 'debate_runtime.contention') return `Contention: ${params?.value}`;
        if (key === 'debate_runtime.complexity') return `Complexity: ${params?.value}`;
        if (key === 'debate_live.round_label') return `R${params?.n}`;
        return key;
    }}),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../ModuleInfo', () => ({
    default: () => <div />,
}));

vi.mock('../Common', () => ({
    Button: ({ children, onClick, disabled, style, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} style={style} {...props}>{children}</button>
    ),
}));

vi.mock('../AgentsPanel/AgentAvatar', () => ({
    AgentAvatar: ({ name }: any) => <span>{name}</span>,
}));

vi.mock('../../hooks/useMediaQuery', () => ({
    useMediaQuery: () => false,
}));

vi.mock('../DebatePanel/DebateChat', () => ({
    default: () => <div />,
}));

// ===== PhaseTimeline Tests =====
describe('PhaseTimeline', () => {
    it('renders all phases', async () => {
        const { PhaseTimeline } = await import('./PhaseTimeline');
        render(<PhaseTimeline phase="active" />);
        expect(screen.getByText('Active')).toBeDefined();
        expect(screen.getByText('Created')).toBeDefined();
        expect(screen.getByText('Done')).toBeDefined();
    });

    it('highlights current phase', async () => {
        const { PhaseTimeline } = await import('./PhaseTimeline');
        const { container } = render(<PhaseTimeline phase="deliberating" />);
        const phases = container.querySelectorAll('[title]');
        const deliberatingPhase = Array.from(phases).find(p => p.getAttribute('title') === 'deliberating');
        expect(deliberatingPhase).toBeDefined();
    });
});

// ===== TopologyDiagram Tests =====
describe('TopologyDiagram', () => {
    it('renders nodes without edges', async () => {
        const { TopologyDiagram } = await import('./TopologyDiagram');
        const topology = {
            id: 't1',
            type: 'roundtable' as const,
            nodes: [
                { id: 'a1', label: 'Agent A', role: 'pro' as const },
                { id: 'a2', label: 'Agent B', role: 'con' as const },
            ],
            edges: [],
        };
        render(<TopologyDiagram topology={topology} />);
        expect(screen.getByText('Agent A')).toBeDefined();
        expect(screen.getByText('Agent B')).toBeDefined();
    });

    it('renders edges with arrows', async () => {
        const { TopologyDiagram } = await import('./TopologyDiagram');
        const topology = {
            id: 't1',
            type: 'linear' as const,
            nodes: [
                { id: 'a1', label: 'Agent A', role: 'pro' as const },
                { id: 'a2', label: 'Agent B', role: 'con' as const },
            ],
            edges: [{ from: 'a1', to: 'a2', type: 'sequential' as const }],
        };
        const { container } = render(<TopologyDiagram topology={topology} />);
        expect(screen.getByText('Agent A')).toBeDefined();
        expect(screen.getByText('Agent B')).toBeDefined();
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
    });
});

// ===== CognitiveMetricsCard Tests =====
describe('CognitiveMetricsCard', () => {
    it('shows waiting state when metrics is null', async () => {
        const { CognitiveMetricsCard } = await import('./CognitiveMetricsCard');
        render(<CognitiveMetricsCard metrics={null} />);
        expect(screen.getByText('debate_runtime.waiting_session')).toBeDefined();
    });

    it('renders metrics when provided', async () => {
        const { CognitiveMetricsCard } = await import('./CognitiveMetricsCard');
        render(
            <CognitiveMetricsCard
                metrics={{
                    timestamp: 0,
                    debateQuality: 0.75,
                    avgContradictionDensity: 0.3,
                    avgConsensusConfidence: 0.8,
                    avgReasoningCoherence: 0.65,
                    topologyEffectiveness: {},
                    reasoningCollapseDetected: false,
                    hallucinationZones: [],
                    sessionCount: 1,
                    updatedAt: 0,
                }}
            />,
        );
        expect(screen.getByText('75%')).toBeDefined();
        expect(screen.getByText('30%')).toBeDefined();
        expect(screen.getByText('80%')).toBeDefined();
        expect(screen.getByText('65%')).toBeDefined();
    });
});

// ===== CognitivePressureCard Tests =====
describe('CognitivePressureCard', () => {
    it('shows waiting state when pressure is null', async () => {
        const { CognitivePressureCard } = await import('./CognitivePressureCard');
        render(<CognitivePressureCard pressure={null} />);
        expect(screen.getByText('debate_runtime.waiting_session')).toBeDefined();
    });

    it('renders pressure data', async () => {
        const { CognitivePressureCard } = await import('./CognitivePressureCard');
        render(
            <CognitivePressureCard
                pressure={{
                    level: 'high',
                    score: 0.75,
                    activeReasoningChains: 5,
                    avgChainComplexity: 0.5,
                    contentionScore: 0.6,
                    memoryPressure: 0.4,
                    complexityScore: 0.8,
                    timestamp: 0,
                }}
            />,
        );
        expect(screen.getByText('high')).toBeDefined();
        expect(screen.getByText('5')).toBeDefined();
        expect(screen.getByText('60%')).toBeDefined();
        expect(screen.getByText('80%')).toBeDefined();
    });
});

// ===== DiagnosticIssuesPanel Tests =====
describe('DiagnosticIssuesPanel', () => {
    it('renders nothing when no issues', async () => {
        const { DiagnosticIssuesPanel } = await import('./DiagnosticIssuesPanel');
        const { container } = render(<DiagnosticIssuesPanel issues={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders critical issues', async () => {
        const { DiagnosticIssuesPanel } = await import('./DiagnosticIssuesPanel');
        render(
            <DiagnosticIssuesPanel
                issues={[
                    { message: 'High latency detected', severity: 'critical', source: 'test' },
                    { message: 'Rate limit warning', severity: 'warning', source: 'test' },
                ]}
            />,
        );
        expect(screen.getByText('High latency detected')).toBeDefined();
        expect(screen.getByText('Rate limit warning')).toBeDefined();
        expect(screen.getByText('Issues (2)')).toBeDefined();
    });
});

// ===== SessionListPanel Tests =====
describe('SessionListPanel', () => {
    const t = (key: string, params?: Record<string, string | number>) => {
        if (key === 'debate_runtime.active_sessions') return `Sessions (${params?.count})`;
        if (key === 'debate_runtime.round') return `Round ${params?.value}`;
        if (key === 'debate_runtime.topology') return `Topology: ${params?.value}`;
        if (key === 'debate_runtime.agents_count') return `${params?.count} agents`;
        return key;
    };

    it('shows empty state', async () => {
        const { default: SessionListPanel } = await import('./SessionListPanel');
        render(<SessionListPanel sessions={[]} selectedId={null} onSelect={vi.fn()} t={t} />);
        expect(screen.getByText('Sessions (0)')).toBeDefined();
        expect(screen.getByText('debate_runtime.no_sessions')).toBeDefined();
    });

    it('renders session list', async () => {
        const { default: SessionListPanel } = await import('./SessionListPanel');
        const sessions = [
            {
                id: 's1',
                topic: 'AI Safety',
                phase: 'deliberating' as const,
                round: 3,
                topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
                agentStates: [{ agentId: 'a1', phase: 'thinking' as const, tokensUsed: 100 }],
                totalTokens: 500,
                totalCost: 0.01,
            },
        ];
        render(<SessionListPanel sessions={sessions} selectedId="s1" onSelect={vi.fn()} t={t} />);
        expect(screen.getByText('AI Safety')).toBeDefined();
        expect(screen.getByText('deliberating')).toBeDefined();
    });

    it('calls onSelect when session clicked', async () => {
        const { default: SessionListPanel } = await import('./SessionListPanel');
        const onSelect = vi.fn();
        const sessions = [
            {
                id: 's1',
                topic: 'Topic',
                phase: 'active' as const,
                round: 1,
                topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
                agentStates: [],
                totalTokens: 0,
                totalCost: 0,
            },
        ];
        render(<SessionListPanel sessions={sessions} selectedId={null} onSelect={onSelect} t={t} />);
        fireEvent.click(screen.getByText('Topic'));
        expect(onSelect).toHaveBeenCalledWith('s1');
    });
});

// ===== SessionDetailHeader Tests =====
describe('SessionDetailHeader', () => {
    const t = (key: string) => key;

    it('shows pause button for active debate', async () => {
        const { default: SessionDetailHeader } = await import('./SessionDetailHeader');
        const session = {
            id: 's1',
            topic: 'Test Topic',
            phase: 'active' as const,
            round: 1,
            topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
            agentStates: [],
            totalTokens: 0,
            totalCost: 0,
        };
        render(
            <SessionDetailHeader
                selected={session}
                linkedChatIds={[]}
                actionLoading={null}
                onPause={vi.fn()}
                onStart={vi.fn()}
                onCancel={vi.fn()}
                onChatNavigate={vi.fn()}
                t={t}
            />,
        );
        expect(screen.getByText('Test Topic')).toBeDefined();
        expect(screen.getByText('active')).toBeDefined();
        expect(screen.getByText('debate_runtime.pause')).toBeDefined();
        expect(screen.getByText('debate_runtime.cancel')).toBeDefined();
    });

    it('shows start button for created debate', async () => {
        const { default: SessionDetailHeader } = await import('./SessionDetailHeader');
        const session = {
            id: 's1',
            topic: 'New Debate',
            phase: 'created' as const,
            round: 0,
            topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
            agentStates: [],
            totalTokens: 0,
            totalCost: 0,
        };
        render(
            <SessionDetailHeader
                selected={session}
                linkedChatIds={[]}
                actionLoading={null}
                onPause={vi.fn()}
                onStart={vi.fn()}
                onCancel={vi.fn()}
                onChatNavigate={vi.fn()}
                t={t}
            />,
        );
        expect(screen.getByText('debate_runtime.start')).toBeDefined();
    });

    it('shows linked chat buttons', async () => {
        const { default: SessionDetailHeader } = await import('./SessionDetailHeader');
        const session = {
            id: 's1',
            topic: 'Linked',
            phase: 'active' as const,
            round: 1,
            topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
            agentStates: [],
            totalTokens: 0,
            totalCost: 0,
        };
        render(
            <SessionDetailHeader
                selected={session}
                linkedChatIds={['chat-1', 'chat-2']}
                actionLoading={null}
                onPause={vi.fn()}
                onStart={vi.fn()}
                onCancel={vi.fn()}
                onChatNavigate={vi.fn()}
                t={t}
            />,
        );
        const chatButtons = screen.getAllByText('💬 Chat');
        expect(chatButtons.length).toBe(2);
    });
});

// ===== SessionOverviewTab Tests =====
describe('SessionOverviewTab', () => {
    it('renders topology and agent states', async () => {
        const { SessionOverviewTab } = await import('./SessionOverviewTab');
        const session = {
            id: 's1',
            topic: 'Test',
            phase: 'deliberating' as const,
            round: 2,
            topology: {
                id: 't1',
                type: 'roundtable' as const,
                nodes: [
                    { id: 'a1', label: 'Agent A', role: 'pro' as const },
                    { id: 'a2', label: 'Agent B', role: 'con' as const },
                ],
                edges: [],
            },
            agentStates: [
                { agentId: 'a1', phase: 'thinking' as const, tokensUsed: 150 },
                { agentId: 'a2', phase: 'idle' as const, tokensUsed: 0 },
            ],
            totalTokens: 500,
            totalCost: 0.02,
        };
        render(
            <SessionOverviewTab
                selected={session}
                thinkingAgentId="a1"
                cognitiveMetrics={null}
                cognitivePressure={null}
            />,
        );
        expect(screen.getByText('Agent A')).toBeDefined();
        expect(screen.getByText('Agent B')).toBeDefined();
        expect(screen.getByText('thinking')).toBeDefined();
        expect(screen.getByText('idle')).toBeDefined();
        expect(screen.getByText('150 tok')).toBeDefined();
    });

    it('renders cognitive metrics when provided', async () => {
        const { SessionOverviewTab } = await import('./SessionOverviewTab');
        const session = {
            id: 's1',
            topic: 'Test',
            phase: 'active' as const,
            round: 1,
            topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
            agentStates: [],
            totalTokens: 0,
            totalCost: 0,
        };
        render(
            <SessionOverviewTab
                selected={session}
                thinkingAgentId={undefined}
                cognitiveMetrics={{
                    debateQuality: 0.85,
                    avgContradictionDensity: 0.2,
                    avgConsensusConfidence: 0.9,
                    avgReasoningCoherence: 0.7,
                    reasoningCollapseDetected: false,
                }}
                cognitivePressure={null}
            />,
        );
        expect(screen.getByText('85%')).toBeDefined();
    });

    it('shows reasoning collapse warning', async () => {
        const { SessionOverviewTab } = await import('./SessionOverviewTab');
        const session = {
            id: 's1',
            topic: 'Test',
            phase: 'active' as const,
            round: 1,
            topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
            agentStates: [],
            totalTokens: 0,
            totalCost: 0,
        };
        render(
            <SessionOverviewTab
                selected={session}
                thinkingAgentId={undefined}
                cognitiveMetrics={{
                    debateQuality: 0.3,
                    avgContradictionDensity: 0.8,
                    avgConsensusConfidence: 0.2,
                    avgReasoningCoherence: 0.15,
                    reasoningCollapseDetected: true,
                }}
                cognitivePressure={null}
            />,
        );
        expect(screen.getByText('debate_runtime.reasoning_collapse')).toBeDefined();
    });
});

// ===== CreateSessionForm Tests =====
describe('CreateSessionForm', () => {
    const defaultProps = {
        topic: '',
        setTopic: vi.fn(),
        topologyType: 'roundtable' as const,
        setTopologyType: vi.fn(),
        availableNodes: [
            { id: 'a1', label: 'Agent A', provider: 'openai', model: 'gpt-4' },
            { id: 'a2', label: 'Agent B', provider: 'anthropic', model: 'claude-3' },
            { id: 'a3', label: 'Agent C', provider: 'openai', model: 'gpt-3.5' },
        ],
        selectedAgentIds: ['a1', 'a2'],
        setSelectedAgentIds: vi.fn(),
        agentRoles: {},
        setAgentRoles: vi.fn(),
        creating: false,
        handleCreate: vi.fn(),
        t: (key: string, params?: Record<string, string | number>) => {
            if (key === 'debate_runtime.select_agents') return `Select agents (${params?.selected})`;
            return key;
        },
    };

    it('renders topic input and topology selector', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        render(<CreateSessionForm {...defaultProps} />);
        expect(screen.getByText('debate_runtime.new_session')).toBeDefined();
        expect(screen.getByLabelText('debate_runtime.topic_aria')).toBeDefined();
        expect(screen.getByLabelText('debate_runtime.topology_aria')).toBeDefined();
    });

    it('renders available agents with checkboxes', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        render(<CreateSessionForm {...defaultProps} />);
        expect(screen.getAllByText('Agent A').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Agent B').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Agent C').length).toBeGreaterThan(0);
        expect(screen.getByText('Select agents (2)')).toBeDefined();
    });

    it('disables create button when less than 2 agents selected', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        render(<CreateSessionForm {...defaultProps} selectedAgentIds={['a1']} />);
        const createBtn = screen.getByText('debate_runtime.create_session').closest('button');
        expect(createBtn?.hasAttribute('disabled')).toBe(true);
    });

    it('enables create button when 2+ agents selected and topic provided', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        render(<CreateSessionForm {...defaultProps} topic="Test Topic" />);
        const createBtn = screen.getByText('debate_runtime.create_session').closest('button');
        expect(createBtn?.hasAttribute('disabled')).toBe(false);
    });

    it('disables create button when creating', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        render(<CreateSessionForm {...defaultProps} topic="Test" creating={true} />);
        const createBtn = screen.getByText('debate_runtime.create_session').closest('button');
        expect(createBtn?.hasAttribute('disabled')).toBe(true);
    });

    it('shows role assignment for selected agents', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        render(<CreateSessionForm {...defaultProps} />);
        expect(screen.getByText('debate_runtime.role_assignment')).toBeDefined();
    });

    it('toggles agent selection', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        const setSelectedAgentIds = vi.fn();
        render(
            <CreateSessionForm
                {...defaultProps}
                setSelectedAgentIds={setSelectedAgentIds}
            />,
        );
        fireEvent.click(screen.getByText('Agent C'));
        expect(setSelectedAgentIds).toHaveBeenCalled();
    });

    it('selects all agents', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        const setSelectedAgentIds = vi.fn();
        render(
            <CreateSessionForm
                {...defaultProps}
                selectedAgentIds={[]}
                setSelectedAgentIds={setSelectedAgentIds}
            />,
        );
        fireEvent.click(screen.getByText('All'));
        expect(setSelectedAgentIds).toHaveBeenCalled();
    });

    it('deselects all agents', async () => {
        const { default: CreateSessionForm } = await import('./CreateSessionForm');
        const setSelectedAgentIds = vi.fn();
        render(
            <CreateSessionForm
                {...defaultProps}
                setSelectedAgentIds={setSelectedAgentIds}
            />,
        );
        fireEvent.click(screen.getByText('None'));
        expect(setSelectedAgentIds).toHaveBeenCalled();
    });
});

// ===== AgentControlPanel Tests =====
describe('AgentControlPanel', () => {
    it('shows empty state when no agents in session', async () => {
        const { AgentControlPanel } = await import('./AgentControlPanel');
        mockAgentService.getAgents.mockReturnValue([]);
        render(
            <AgentControlPanel
                session={{
                    id: 's1',
                    topic: 'Test',
                    phase: 'active' as const,
                    round: 1,
                    topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
                    agentStates: [],
                    totalTokens: 0,
                    totalCost: 0,
                }}
            />,
        );
        expect(screen.getByText('No agents found in this session.')).toBeDefined();
    });

    it('renders agent cards with controls', async () => {
        const { AgentControlPanel } = await import('./AgentControlPanel');
        mockAgentService.getAgents.mockReturnValue([
            { id: 'agent-1', name: 'Agent 1', status: 'idle', role: 'pro' },
            { id: 'agent-2', name: 'Agent 2', status: 'busy', role: 'con' },
        ]);
        render(
            <AgentControlPanel
                session={{
                    id: 's1',
                    topic: 'Test',
                    phase: 'active' as const,
                    round: 1,
                    topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
                    agentStates: [
                        { agentId: 'agent-1', phase: 'idle', tokensUsed: 0 },
                        { agentId: 'agent-2', phase: 'thinking', tokensUsed: 100 },
                    ],
                    totalTokens: 100,
                    totalCost: 0.001,
                }}
            />,
        );
        expect(screen.getByText('Override Presets')).toBeDefined();
        expect(screen.getByText('Strengthen Critic')).toBeDefined();
        // Use getAllByText since there are multiple agents each with Temperature
        const temps = screen.getAllByText('Temperature');
        expect(temps.length).toBeGreaterThanOrEqual(1);
        const maxTokens = screen.getAllByText('Max Tokens');
        expect(maxTokens.length).toBeGreaterThanOrEqual(1);
    });

    it('renders override preset buttons', async () => {
        const { AgentControlPanel } = await import('./AgentControlPanel');
        mockAgentService.getAgents.mockReturnValue([
            { id: 'agent-1', name: 'Agent 1', status: 'idle', role: 'pro' },
        ]);
        render(
            <AgentControlPanel
                session={{
                    id: 's1',
                    topic: 'Test',
                    phase: 'active' as const,
                    round: 1,
                    topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
                    agentStates: [{ agentId: 'agent-1', phase: 'idle', tokensUsed: 0 }],
                    totalTokens: 0,
                    totalCost: 0,
                }}
            />,
        );
        expect(screen.getByText('Lower Creativity')).toBeDefined();
        expect(screen.getByText('Require Sources')).toBeDefined();
        expect(screen.getByText('Creative Brainstorm')).toBeDefined();
        expect(screen.getByText('Balanced')).toBeDefined();
    });
});

// ===== DebateRuntimePanel Integration Tests =====
describe('DebateRuntimePanel (comprehensive)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDebateEngine.getActiveSessions.mockReturnValue([]);
        mockCognitiveService.getMetrics.mockReturnValue({
            debateQuality: 0.75,
            avgContradictionDensity: 0.3,
            avgConsensusConfidence: 0.8,
            avgReasoningCoherence: 0.65,
            reasoningCollapseDetected: false,
        });
        mockCognitiveService.getPressure.mockReturnValue({
            level: 'normal',
            score: 0.45,
            activeReasoningChains: 3,
            contentionScore: 0.35,
            complexityScore: 0.55,
        });
        mockCognitiveService.getActiveIssues.mockReturnValue([]);
    });

    it('renders title and subtitle', async () => {
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        expect(screen.getByText('debate_runtime.title')).toBeDefined();
        expect(screen.getByText('debate_runtime.subtitle')).toBeDefined();
    });

    it('renders create session form', async () => {
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        expect(screen.getByText('debate_runtime.new_session')).toBeDefined();
        expect(screen.getByLabelText('debate_runtime.topic_aria')).toBeDefined();
    });

    it('renders cognitive metrics and pressure cards', async () => {
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        expect(screen.getByText('debate_runtime.cognitive_metrics')).toBeDefined();
        expect(screen.getByText('debate_runtime.cognitive_pressure_title')).toBeDefined();
    });

    it('renders empty session list', async () => {
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        expect(screen.getByText('debate_runtime.no_sessions')).toBeDefined();
    });

    it('subscribes to debate events on mount', async () => {
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        expect(mockEventBus.on).toHaveBeenCalled();
        expect(mockEventBus.onSafe).toHaveBeenCalled();
    });

    it('shows session list when sessions exist', async () => {
        mockDebateEngine.getActiveSessions.mockReturnValue([
            {
                id: 's1',
                topic: 'AI Ethics',
                phase: 'deliberating' as const,
                round: 2,
                topology: { id: 't1', type: 'roundtable' as const, nodes: [], edges: [] },
                agentStates: [{ agentId: 'a1', phase: 'thinking' as const, tokensUsed: 200 }],
                totalTokens: 500,
                totalCost: 0.005,
            },
        ]);
        const { default: DebateRuntimePanel } = await import('./DebateRuntimePanel');
        render(<DebateRuntimePanel />);
        await waitFor(() => {
            expect(screen.getByText('AI Ethics')).toBeDefined();
        });
        expect(screen.getByText('deliberating')).toBeDefined();
    });
});
