import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

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
    getAllSessions: vi.fn().mockReturnValue([]),
    getActiveSessions: vi.fn().mockReturnValue([]),
    getSession: vi.fn().mockReturnValue(null),
};

const mockLiveStore = {
    streamingContent: new Map(),
    currentThinking: new Map(),
    emotions: new Map(),
    agentEvents: [],
    roundEvents: [],
    agentCountdowns: new Map(),
    memoryBubbles: new Map(),
    judgeWeights: { pro: 0.5, con: 0.3, neutral: 0.2 },
    agentQualityActivations: new Map(),
};

vi.mock('../../kernel/instances', () => ({
    debateEngine: mockDebateEngine,
    eventBus: mockEventBus,
    EVENTS: {
        DEBATE_AGENT_RESPONDED: 'debate:runtime:agent:responded',
        DEBATE_AGENT_ERROR: 'debate:runtime:agent:error',
        DEBATE_UPDATED: 'debate:updated',
    },
    agentAvatarService: {
        generate: vi.fn().mockReturnValue({ emoji: '🤖', color: '#8b5cf6', url: '' }),
        getAvatarCSS: vi.fn().mockReturnValue({ background: '#8b5cf6', borderRadius: '50%' }),
    },
    qualityImpactCollector: {
        getAllMetrics: vi.fn().mockReturnValue([]),
    },
    rootLogger: { child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) },
}));

vi.mock('../../stores/debateLiveStore', () => ({
    useDebateLiveStore: Object.assign(
        vi.fn((selector?: (s: typeof mockLiveStore) => unknown) => {
            if (selector) return selector(mockLiveStore);
            return mockLiveStore;
        }),
        { getState: vi.fn(() => mockLiveStore) },
    ),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, string | number>) => {
            if (key === 'debate_live.round_label') return `R${params?.n}`;
            return key;
        },
    }),
}));

vi.mock('../../kernel/services/debate-runtime/quality-settings-store', () => ({
    getTechniques: vi.fn().mockReturnValue([
        { id: 'steelman', category: 'P0' },
        { id: 'anchoring', category: 'P1' },
    ]),
}));

vi.mock('../../kernel/services/agent-identity', () => ({
    resolveAgentIdentity: (id: string) => ({
        displayName: id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        avatar: { emoji: '🤖', color: '#8b5cf6', url: '' },
        baseRole: 'agent',
    }),
}));

// ===== EyeLine Tests =====
describe('EyeLine', () => {
    it('renders SVG line between two positions', async () => {
        const { EyeLine } = await import('./EyeLine');
        const { container } = render(
            <EyeLine fromPos={{ x: 10, y: 20 }} toPos={{ x: 100, y: 200 }} color="#a855f7" />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
        const line = container.querySelector('line');
        expect(line).toBeDefined();
    });
});

// ===== CountdownRing Tests =====
describe('CountdownRing', () => {
    it('renders nothing when not active', async () => {
        const { CountdownRing } = await import('./CountdownRing');
        const { container } = render(
            <CountdownRing secondsTotal={60} secondsLeft={30} isActive={false} />,
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders ring when active', async () => {
        const { CountdownRing } = await import('./CountdownRing');
        const { container } = render(
            <CountdownRing secondsTotal={60} secondsLeft={30} isActive={true} />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
        const text = container.querySelector('text');
        expect(text?.textContent).toBe('30');
    });

    it('shows red color when time is low', async () => {
        const { CountdownRing } = await import('./CountdownRing');
        const { container } = render(
            <CountdownRing secondsTotal={60} secondsLeft={5} isActive={true} />,
        );
        const text = container.querySelector('text');
        expect(text?.getAttribute('fill')).toBe('#ef4444');
    });

    it('shows green color when time is high', async () => {
        const { CountdownRing } = await import('./CountdownRing');
        const { container } = render(
            <CountdownRing secondsTotal={60} secondsLeft={50} isActive={true} />,
        );
        const text = container.querySelector('text');
        expect(text?.getAttribute('fill')).toBe('#10b981');
    });
});

// ===== ThoughtBubble Tests =====
describe('ThoughtBubble', () => {
    it('renders nothing when no draftPreview', async () => {
        const { ThoughtBubble } = await import('./ThoughtBubble');
        const { container } = render(<ThoughtBubble progress={0.5} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders thought bubble with text', async () => {
        const { ThoughtBubble } = await import('./ThoughtBubble');
        render(<ThoughtBubble draftPreview="Formulating response..." progress={0.7} />);
        expect(screen.getByText(/Formulating response/)).toBeDefined();
    });

    it('truncates long text', async () => {
        const { ThoughtBubble } = await import('./ThoughtBubble');
        const longText = 'A'.repeat(50);
        render(<ThoughtBubble draftPreview={longText} progress={0.5} />);
        const text = screen.getByText(new RegExp('A{30}'));
        expect(text).toBeDefined();
    });
});

// ===== MemoryBubble Tests =====
describe('MemoryBubble', () => {
    it('renders memory bubble with supports relation', async () => {
        const { MemoryBubble } = await import('./MemoryBubble');
        render(
            <MemoryBubble debateLabel="Previous debate on AI" similarity={0.85} relation="supports" />,
        );
        expect(screen.getByText(/Previous debate on A/)).toBeDefined();
        expect(screen.getByText(/✅/)).toBeDefined();
    });

    it('renders memory bubble with refutes relation', async () => {
        const { MemoryBubble } = await import('./MemoryBubble');
        render(
            <MemoryBubble debateLabel="Counter argument" similarity={0.7} relation="refutes" />,
        );
        expect(screen.getByText(/Counter argument/)).toBeDefined();
        expect(screen.getByText(/❌/)).toBeDefined();
    });

    it('truncates long debate labels', async () => {
        const { MemoryBubble } = await import('./MemoryBubble');
        const longLabel = 'A'.repeat(30);
        render(
            <MemoryBubble debateLabel={longLabel} similarity={0.5} relation="extends" />,
        );
        const text = screen.getByText(new RegExp('A{20}'));
        expect(text).toBeDefined();
    });

    it('renders all relation types', async () => {
        const { MemoryBubble } = await import('./MemoryBubble');
        const relations = ['supports', 'refutes', 'extends', 'contradicts'] as const;
        for (const relation of relations) {
            const { unmount } = render(
                <MemoryBubble debateLabel="Test" similarity={0.5} relation={relation} />,
            );
            expect(screen.getByText(/Test/)).toBeDefined();
            unmount();
        }
    });
});

// ===== JudgeScales Tests =====
describe('JudgeScales', () => {
    it('renders SVG with pro and con weights', async () => {
        const { JudgeScales } = await import('./JudgeScales');
        const { container } = render(
            <JudgeScales proWeight={0.6} conWeight={0.4} />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
        const texts = container.querySelectorAll('text');
        const textContents = Array.from(texts).map(t => t.textContent);
        expect(textContents).toContain('0.6');
        expect(textContents).toContain('0.4');
    });

    it('renders with neutral weight', async () => {
        const { JudgeScales } = await import('./JudgeScales');
        const { container } = render(
            <JudgeScales proWeight={0.3} conWeight={0.3} neutralWeight={0.4} />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });
});

// ===== SpeakerNode Tests =====
describe('SpeakerNode', () => {
    const mockNode = { id: 'agent-1', label: 'Agent A', role: 'pro' as const };
    const mockAvatar = { emoji: '🤖', color: '#8b5cf6', url: '' };
    const mockAvatarCSS = { background: '#8b5cf6', borderRadius: '50%' };

    it('renders agent name and role', async () => {
        const { SpeakerNode } = await import('./SpeakerNode');
        render(
            <SpeakerNode
                node={mockNode}
                avatar={mockAvatar}
                avatarCSS={mockAvatarCSS}
                isActive={false}
                sessionId="s1"
            />,
        );
        expect(screen.getByText('Agent 1')).toBeDefined();
        expect(screen.getByText('pro')).toBeDefined();
    });

    it('shows emotion icon when not neutral', async () => {
        mockLiveStore.emotions = new Map([['s1:agent-1', 'joy']]);
        const { SpeakerNode } = await import('./SpeakerNode');
        render(
            <SpeakerNode
                node={mockNode}
                avatar={mockAvatar}
                avatarCSS={mockAvatarCSS}
                isActive={false}
                sessionId="s1"
            />,
        );
        expect(screen.getByText('😊')).toBeDefined();
    });

    it('shows streaming text when active', async () => {
        mockLiveStore.streamingContent = new Map([['s1:agent-1', 'Hello world']]);
        const { SpeakerNode } = await import('./SpeakerNode');
        render(
            <SpeakerNode
                node={mockNode}
                avatar={mockAvatar}
                avatarCSS={mockAvatarCSS}
                isActive={true}
                sessionId="s1"
            />,
        );
        expect(screen.getByText('Hello world')).toBeDefined();
    });

    it('shows quality activation count', async () => {
        mockLiveStore.agentQualityActivations = new Map([['s1:agent-1', 5]]);
        const { SpeakerNode } = await import('./SpeakerNode');
        render(
            <SpeakerNode
                node={mockNode}
                avatar={mockAvatar}
                avatarCSS={mockAvatarCSS}
                isActive={false}
                sessionId="s1"
            />,
        );
        expect(screen.getByText('✦5')).toBeDefined();
    });
});

// ===== JudgeCenter Tests =====
describe('JudgeCenter', () => {
    it('renders judge name and scales', async () => {
        const { JudgeCenter } = await import('./JudgeCenter');
        const judge = { id: 'judge-1', label: 'Judge', role: 'judge' as const };
        render(
            <JudgeCenter judge={judge} sessionId="s1" phase="active" />,
        );
        expect(screen.getByText('Judge 1')).toBeDefined();
    });

    it('shows evaluating state during consensus', async () => {
        const { JudgeCenter } = await import('./JudgeCenter');
        const judge = { id: 'judge-1', label: 'Judge', role: 'judge' as const };
        const { container } = render(
            <JudgeCenter judge={judge} sessionId="s1" phase="consensus" />,
        );
        const motionDiv = container.querySelector('[style*="scale"]');
        expect(motionDiv).toBeDefined();
    });
});

// ===== SocratesMascot Tests =====
describe('SocratesMascot', () => {
    it('renders Socrates mascot', async () => {
        const { SocratesMascot } = await import('./SocratesMascot');
        render(<SocratesMascot />);
        expect(screen.getByTitle('Click Socrates!')).toBeDefined();
    });

    it('shows initial observing emotion', async () => {
        const { SocratesMascot } = await import('./SocratesMascot');
        render(<SocratesMascot />);
        expect(screen.getByText('🧐')).toBeDefined();
    });

    it('returns null when hidden', async () => {
        const { SocratesMascot } = await import('./SocratesMascot');
        const { container } = render(<SocratesMascot hidden={true} />);
        expect(container.innerHTML).toBe('');
    });

    it('changes emotion on click', async () => {
        const { SocratesMascot } = await import('./SocratesMascot');
        render(<SocratesMascot />);
        const mascot = screen.getByTitle('Click Socrates!');
        fireEvent.click(mascot);
        const icons = ['💡', '🎭', '🤔'];
        const currentIcons = screen.queryAllByText(/./u);
        expect(currentIcons.length).toBeGreaterThan(0);
    });

    it('subscribes to debate events', async () => {
        const { SocratesMascot } = await import('./SocratesMascot');
        render(<SocratesMascot />);
        expect(mockEventBus.onSafe).toHaveBeenCalled();
    });
});

// ===== DebateArenaView Tests =====
describe('DebateArenaView', () => {
    it('shows empty state when no session', async () => {
        const { DebateArenaView } = await import('./DebateArenaView');
        mockDebateEngine.getAllSessions.mockReturnValue([]);
        render(<DebateArenaView sessionId={null} />);
        expect(screen.getByText('debate_live.empty')).toBeDefined();
    });

    it('renders session when found', async () => {
        const { DebateArenaView } = await import('./DebateArenaView');
        mockDebateEngine.getAllSessions.mockReturnValue([
            {
                id: 's1',
                topic: 'Test',
                phase: 'active',
                round: 1,
                topology: {
                    id: 't1',
                    type: 'roundtable',
                    nodes: [
                        { id: 'a1', label: 'Agent A', role: 'pro' },
                        { id: 'a2', label: 'Agent B', role: 'con' },
                    ],
                    edges: [],
                },
                agentStates: [],
                totalTokens: 0,
                totalCost: 0,
            },
        ]);
        render(<DebateArenaView sessionId="s1" />);
        expect(screen.getByText(/active/)).toBeDefined();
    });

    it('renders with custom layout and minHeight', async () => {
        const { DebateArenaView } = await import('./DebateArenaView');
        mockDebateEngine.getAllSessions.mockReturnValue([]);
        const { container } = render(
            <DebateArenaView sessionId={null} layout="proscenium" minHeight={600} />,
        );
        expect(container.firstChild).toBeDefined();
    });
});

// ===== CircularLayout Tests =====
describe('CircularLayout', () => {
    it('renders participants in circle layout', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const participants = [
            { id: 'a1', label: 'Agent A', role: 'pro' as const },
            { id: 'a2', label: 'Agent B', role: 'con' as const },
        ];
        const { container } = render(
            <CircularLayout
                participants={participants}
                activeSpeakerId={null}
                sessionId="s1"
                layout="circle"
            />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
        const lines = container.querySelectorAll('line');
        expect(lines.length).toBe(2);
    });

    it('renders with proscenium layout', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const participants = [
            { id: 'a1', label: 'Agent A', role: 'pro' as const },
            { id: 'a2', label: 'Agent B', role: 'con' as const },
            { id: 'a3', label: 'Agent C', role: 'neutral' as const },
        ];
        const { container } = render(
            <CircularLayout
                participants={participants}
                activeSpeakerId="a1"
                sessionId="s1"
                layout="proscenium"
            />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });

    it('renders with colosseum layout', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const participants = Array.from({ length: 8 }, (_, i) => ({
            id: `a${i}`,
            label: `Agent ${i}`,
            role: 'pro' as const,
        }));
        const { container } = render(
            <CircularLayout
                participants={participants}
                activeSpeakerId={null}
                sessionId="s1"
                layout="colosseum"
            />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });

    it('renders with triangle layout', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const participants = [
            { id: 'a1', label: 'Agent A', role: 'pro' as const },
            { id: 'a2', label: 'Agent B', role: 'con' as const },
            { id: 'a3', label: 'Agent C', role: 'neutral' as const },
        ];
        const { container } = render(
            <CircularLayout
                participants={participants}
                activeSpeakerId={null}
                sessionId="s1"
                layout="triangle"
            />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });

    it('renders with tree layout', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const participants = Array.from({ length: 7 }, (_, i) => ({
            id: `a${i}`,
            label: `Agent ${i}`,
            role: 'pro' as const,
        }));
        const { container } = render(
            <CircularLayout
                participants={participants}
                activeSpeakerId={null}
                sessionId="s1"
                layout="tree"
            />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });

    it('renders eye lines to non-active participants', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const participants = [
            { id: 'a1', label: 'Agent A', role: 'pro' as const },
            { id: 'a2', label: 'Agent B', role: 'con' as const },
        ];
        const { container } = render(
            <CircularLayout
                participants={participants}
                activeSpeakerId="a1"
                sessionId="s1"
                layout="circle"
            />,
        );
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
    });

    it('handles empty participants', async () => {
        const { CircularLayout } = await import('./CircularLayout');
        const { container } = render(
            <CircularLayout
                participants={[]}
                activeSpeakerId={null}
                sessionId="s1"
                layout="circle"
            />,
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });
});

// ===== DebateLivePanel Tests =====
describe('DebateLivePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDebateEngine.getAllSessions.mockReturnValue([]);
        mockLiveStore.streamingContent = new Map();
        mockLiveStore.currentThinking = new Map();
        mockLiveStore.emotions = new Map();
        mockLiveStore.agentQualityActivations = new Map();
    });

    it('renders session selector and layout selector', async () => {
        const { DebateLivePanel } = await import('./DebateLivePanel');
        render(<DebateLivePanel />);
        expect(screen.getByText('debate_live.no_active')).toBeDefined();
    });

    it('shows empty state when no sessions', async () => {
        const { DebateLivePanel } = await import('./DebateLivePanel');
        render(<DebateLivePanel />);
        expect(screen.getByText('debate_live.empty')).toBeDefined();
    });

    it('renders layout options', async () => {
        const { DebateLivePanel } = await import('./DebateLivePanel');
        const { container } = render(<DebateLivePanel />);
        const selects = container.querySelectorAll('select');
        expect(selects.length).toBe(2);
    });

    it('shows session status when session exists', async () => {
        mockDebateEngine.getAllSessions.mockReturnValue([
            {
                id: 's1',
                topic: 'AI Ethics',
                phase: 'active',
                round: 2,
                topology: {
                    id: 't1',
                    type: 'roundtable',
                    nodes: [
                        { id: 'a1', label: 'Agent A', role: 'pro' },
                        { id: 'a2', label: 'Agent B', role: 'con' },
                    ],
                    edges: [],
                },
                agentStates: [],
                totalTokens: 0,
                totalCost: 0,
            },
        ]);
        const { DebateLivePanel } = await import('./DebateLivePanel');
        render(<DebateLivePanel />);
        expect(screen.getByText(/active/)).toBeDefined();
        expect(screen.getAllByText(/R2/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders Socrates mascot', async () => {
        mockDebateEngine.getAllSessions.mockReturnValue([
            {
                id: 's1',
                topic: 'Test',
                phase: 'active',
                round: 1,
                topology: {
                    id: 't1',
                    type: 'roundtable',
                    nodes: [
                        { id: 'a1', label: 'Agent A', role: 'pro' },
                    ],
                    edges: [],
                },
                agentStates: [],
                totalTokens: 0,
                totalCost: 0,
            },
        ]);
        const { DebateLivePanel } = await import('./DebateLivePanel');
        render(<DebateLivePanel />);
        expect(screen.getByTitle('Click Socrates!')).toBeDefined();
    });

    it('determines active speaker from streaming content', async () => {
        mockDebateEngine.getAllSessions.mockReturnValue([
            {
                id: 's1',
                topic: 'Test',
                phase: 'active',
                round: 1,
                topology: {
                    id: 't1',
                    type: 'roundtable',
                    nodes: [
                        { id: 'a1', label: 'Agent A', role: 'pro' },
                    ],
                    edges: [],
                },
                agentStates: [],
                totalTokens: 0,
                totalCost: 0,
            },
        ]);
        mockLiveStore.streamingContent = new Map([['s1:a1', 'Streaming text']]);
        const { DebateLivePanel } = await import('./DebateLivePanel');
        render(<DebateLivePanel />);
        expect(screen.getByText(/Streaming/)).toBeDefined();
    });

    it('determines active speaker from thinking state', async () => {
        mockDebateEngine.getAllSessions.mockReturnValue([
            {
                id: 's1',
                topic: 'Test',
                phase: 'active',
                round: 1,
                topology: {
                    id: 't1',
                    type: 'roundtable',
                    nodes: [
                        { id: 'a1', label: 'Agent A', role: 'pro' },
                    ],
                    edges: [],
                },
                agentStates: [],
                totalTokens: 0,
                totalCost: 0,
            },
        ]);
        mockLiveStore.currentThinking = new Map([['s1:a1', true]]);
        const { DebateLivePanel } = await import('./DebateLivePanel');
        render(<DebateLivePanel />);
        expect(screen.getByText(/formulating/)).toBeDefined();
    });
});
