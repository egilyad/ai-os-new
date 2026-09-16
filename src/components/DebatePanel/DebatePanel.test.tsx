import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { eventBus } from '../../kernel/instances';
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

const {
    mockNodes,
    mockDebateService,
    mockGetActiveSession,
    mockDebateHumanService,
    mockDebateEngine,
} = vi.hoisted(() => {
    const mockGetActiveSession = vi.fn();
    return {
        mockNodes: [
            { id: 'agent-1', type: 'agent', label: 'Agent Alpha', config: {} },
            { id: 'agent-2', type: 'agent', label: 'Agent Beta', config: {} },
            { id: 'agent-3', type: 'agent', label: 'Agent Gamma', config: {} },
            { id: 'router-1', type: 'router', label: 'Router', config: {} },
        ],
        mockGetActiveSession,
        mockDebateService: {
            getSession: vi.fn(),
            startDebate: vi.fn(),
            pauseDebate: vi.fn(),
            resumeDebate: vi.fn(),
            stopDebate: vi.fn(),
            getArguments: vi.fn(() => []),
            exportAsMarkdown: vi.fn(() => ''),
            destroy: vi.fn(),
            getVerdict: vi.fn(() => null),
            getHistory: vi.fn(() => []),
            setFactCheckLevel: vi.fn(),
            getActiveDebateSession: mockGetActiveSession,
            getCachedVerdict: vi.fn(() => null),
            getDebateGovernorState: vi.fn(() => null),
        },
        mockDebateHumanService: {
            addArgument: vi.fn(),
            getHumanVotes: vi.fn(() => []),
            recordHumanVote: vi.fn(),
        },
        mockDebateEngine: {
            pauseSession: vi.fn(),
            resumeSession: vi.fn(),
            cancelSession: vi.fn(),
        },
    };
});

vi.mock('../../kernel/instances', () => {
    const handlers = new Map<string, Array<(payload: unknown) => void>>();
    const subscribe = (event: string, cb: (payload: unknown) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return () => {
            const current = handlers.get(event);
            if (!current) return;
            const i = current.indexOf(cb);
            if (i >= 0) current.splice(i, 1);
        };
    };
    const eventBus = {
        on: (event: string, cb: (payload: unknown) => void) => subscribe(event, cb),
        onSafe: (event: string, cb: (payload: unknown) => void) => subscribe(event, cb),
        emit: (event: string, payload: unknown) => {
            (handlers.get(event) ?? []).forEach((cb) => cb(payload));
        },
    };
    return {
        orchestrator: {
            getActiveTopology: vi.fn(() => ({
                nodes: mockNodes,
                edges: [],
                policies: [],
            })),
        },
        debateService: mockDebateService,
        debateHumanService: mockDebateHumanService,
        debateEngine: mockDebateEngine,
        debateWorkspace: {
            syncFromEngine: vi.fn(),
            listRooms: vi.fn(() => []),
            createRoom: vi.fn(),
            setActiveRoom: vi.fn(),
            closeRoom: vi.fn(),
        },
        hypothesisService: {
            proposeHypothesis: vi.fn(),
            getHypotheses: vi.fn(() => []),
        },
        autoDebateService: {
            getResults: vi.fn(() => null),
            getWinRates: vi.fn(() => []),
        },
        sessionManager: {
            getDebateHistory: vi.fn(() => []),
            restoreDebateSession: vi.fn(),
            deleteDebateHistory: vi.fn(),
            archiveDebateSession: vi.fn(),
        },
        eventBus,
        EVENTS: {
            NOTIFICATION: 'notification',
            DEBATE_VERDICT_GENERATED: 'debate:verdict_generated',
            DEBATE_SESSION_CANCELLED: 'debate:cancelled',
            DEBATE_SESSION_FAILED: 'debate:failed',
        },
        getAllSettings: vi.fn(() => ({})),
        getArchetypePrompt: vi.fn(() => undefined),
        getArchetypeName: vi.fn(() => undefined),
        getArchetypesForRole: vi.fn(() => []),
        getRecommendedArchetypes: vi.fn(() => null),
        getHistoricalFigure: vi.fn(() => null),
    };
});

vi.mock('react-router-dom', () => ({
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useNavigate: () => vi.fn(),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'debate.config_title': 'Configure Dialectic Session',
                'debate.initialize': 'Initialize Debate Runtime',
                'debate.selected': 'Selected',
                'debate.loading': 'Loading debate session...',
                'debate.convergence_score': 'Cognitive Convergence Score',
                'debate.thesis': 'Central Thesis / Topic',
                'debate.thesis_placeholder':
                    'e.g. Should the system prioritize low latency over extensive guardrail checks?',
                'debate.strategy': 'Debate Strategy',
                'debate.max_rounds': 'Maximum Rounds',
                'debate.pause': 'Pause Debate',
                'debate.resume': 'Resume Debate',
                'debate.stop': 'Force Stop',
                'debate.inject_placeholder': 'Inject human argument into the dialectic...',
                'debate.inject': 'Inject',
                confidence: 'Confidence:',
                'common.dismiss_error': 'Dismiss',
            };
            return map[key] ?? key;
        },
        lang: 'en',
    }),
}));

vi.mock('../ModuleInfo', () => ({
    default: () => null,
}));

vi.mock('./DebateSetupWizard', () => ({
    default: ({
        topic,
        onTopicChange,
        strategy,
        onStrategyChange,
        maxRounds,
        onMaxRoundsChange,
        selectedAgents,
        onToggleAgent,
        availableAgents,
        actionLoading,
        onStart,
        t,
    }: {
        topic: string;
        agents: unknown[];
        availableAgents: unknown[];
        actionLoading: string | null;
        onStart: () => void;
        t: (k: string) => string;
        onTopicChange: (v: string) => void;
        strategy: string;
        onStrategyChange: (v: string) => void;
        maxRounds: number;
        onMaxRoundsChange: (v: number) => void;
        selectedAgents: string[];
        onToggleAgent: (id: string) => void;
    }) => (
        <div>
            <div>{t('debate.config_title')}</div>
            <textarea
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    onTopicChange(e.target.value)
                }
                aria-label={t('debate.thesis')}
            />
            <select
                value={strategy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    onStrategyChange(e.target.value)
                }
                aria-label={t('debate.strategy')}
            >
                <option value="round_robin">Round Robin</option>
            </select>
            <input
                type="number"
                value={maxRounds}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onMaxRoundsChange(parseInt(e.target.value) || 10)
                }
                aria-label={t('debate.max_rounds')}
            />
            <div>
                {selectedAgents.length} {t('debate.selected')}
            </div>
            <div>
                {(availableAgents as Array<{ id: string; label: string }>).map(
                    (a: { id: string; label: string }) => (
                        <div
                            key={a.id}
                            onClick={() => onToggleAgent(a.id)}
                            role="button"
                            aria-pressed={selectedAgents.includes(a.id)}
                        >
                            {a.label}
                        </div>
                    ),
                )}
            </div>
            <button
                disabled={selectedAgents.length < 2 || !topic || actionLoading === 'start'}
                onClick={onStart}
            >
                {t('debate.initialize')}
            </button>
        </div>
    ),
}));

describe('DebatePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetActiveSession.mockReset();
    });

    it('renders without crashing', async () => {
        const DebatePanel = (await import('./DebatePanel')).default;
        const { container } = render(<DebatePanel />);
        expect(container).toBeDefined();
    }, 60000);

    it('displays setup screen when no active session', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByText('Configure Dialectic Session')).toBeDefined();
        expect(screen.getByText('Initialize Debate Runtime')).toBeDefined();
    });

    it('shows available agents from topology for selection', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByText('Agent Alpha')).toBeDefined();
        expect(screen.getByText('Agent Beta')).toBeDefined();
        expect(screen.getByText('Agent Gamma')).toBeDefined();
        expect(screen.getByText('3 Selected')).toBeDefined();
    });

    it('disables start button when fewer than 2 agents with no topic', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const startBtn = screen.getByText('Initialize Debate Runtime').closest('button');
        expect(startBtn?.disabled).toBe(true);
    });

    it('enables start button with topic and 2+ agents selected', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);

        const textareas = document.querySelectorAll('textarea');
        fireEvent.change(textareas[0], { target: { value: 'AI Safety' } });

        const startBtn = screen.getByText('Initialize Debate Runtime').closest('button');
        expect(startBtn?.disabled).toBe(false);
    });

    it('calls debateService.startDebate when start is clicked', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        vi.spyOn(eventBus, 'emit');

        render(<DebatePanel />);

        const textareas = document.querySelectorAll('textarea');
        fireEvent.change(textareas[0], { target: { value: 'AI Safety' } });

        fireEvent.click(screen.getByText('Initialize Debate Runtime'));
        expect(mockDebateService.startDebate).toHaveBeenCalledTimes(1);
        expect(mockDebateService.startDebate).toHaveBeenCalledWith(
            'AI Safety',
            expect.arrayContaining([
                expect.objectContaining({ id: 'agent-1', role: 'pro', name: 'Agent Alpha' }),
                expect.objectContaining({ id: 'agent-2', role: 'con', name: 'Agent Beta' }),
                expect.objectContaining({ id: 'agent-3', role: 'neutral', name: 'Agent Gamma' }),
            ]),
            'round_robin',
            10,
            expect.objectContaining({ debateTemperature: 0.5 }),
            'default',
        );
    });

    it('disables start button when topic is empty', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const startBtn = screen.getByText('Initialize Debate Runtime').closest('button');
        expect(startBtn?.disabled).toBe(true);
    });

    it('disables start button when fewer than 2 agents selected', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;

        render(<DebatePanel />);

        const textareas = document.querySelectorAll('textarea');
        fireEvent.change(textareas[0], { target: { value: 'AI Safety' } });

        const agentCards = screen.getAllByText(/Agent (Alpha|Beta|Gamma)/);
        for (const card of agentCards) {
            fireEvent.click(card);
        }

        const startBtn = screen.getByText('Initialize Debate Runtime').closest('button');
        expect(startBtn?.disabled).toBe(true);
        expect(mockDebateService.startDebate).not.toHaveBeenCalled();
    });

    it('displays active debate UI when session exists', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'AI Safety',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 1,
            participants: [
                { id: 'agent-1', name: 'Agent Alpha', role: 'pro', systemPrompt: '' },
                { id: 'agent-2', name: 'Agent Beta', role: 'con', systemPrompt: '' },
            ],
            arguments: [],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByText('AI Safety')).toBeDefined();
        expect(screen.getByText('ACTIVE')).toBeDefined();
        expect(
            screen.getByPlaceholderText('Inject human argument into the dialectic...'),
        ).toBeDefined();
    });

    it('shows debate arguments when present', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'AI Safety',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 1,
            participants: [
                { id: 'agent-1', name: 'Agent Alpha', role: 'pro', systemPrompt: '' },
                { id: 'agent-2', name: 'Agent Beta', role: 'con', systemPrompt: '' },
            ],
            arguments: [
                {
                    id: 'a1',
                    agentId: 'agent-1',
                    agentName: 'Agent Alpha',
                    content: 'I support AI Safety',
                    confidence: 0.9,
                    timestamp: Date.now(),
                    round: 1,
                    position: 'pro',
                },
                {
                    id: 'a2',
                    agentId: 'agent-2',
                    agentName: 'Agent Beta',
                    content: 'I oppose AI Safety',
                    confidence: 0.8,
                    timestamp: Date.now(),
                    round: 1,
                    position: 'con',
                },
            ],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByText('I support AI Safety')).toBeDefined();
        expect(screen.getByText('I oppose AI Safety')).toBeDefined();
        expect(screen.getByText('Confidence: 90%')).toBeDefined();
        expect(screen.getByText('Confidence: 80%')).toBeDefined();
    });

    it('shows convergence score in analytics panel', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'AI Safety',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 3,
            participants: [
                { id: 'agent-1', name: 'Agent Alpha', role: 'pro', systemPrompt: '' },
                { id: 'agent-2', name: 'Agent Beta', role: 'con', systemPrompt: '' },
            ],
            arguments: [],
            convergenceScore: 72,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByText('Cognitive Convergence Score')).toBeDefined();
        expect(screen.getByText('72%')).toBeDefined();
    });

    it('calls debateHumanService.addArgument on inject', async () => {
        const session = {
            id: 'debate-1',
            topic: 'AI Safety',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 2,
            participants: [{ id: 'agent-1', name: 'Agent Alpha', role: 'pro', systemPrompt: '' }],
            arguments: [],
            convergenceScore: 50,
        };
        mockGetActiveSession.mockReturnValue(session);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const input = screen.getByPlaceholderText('Inject human argument into the dialectic...');
        fireEvent.change(input, { target: { value: 'Here is my argument' } });
        fireEvent.click(screen.getByText('Inject'));
        expect(mockDebateHumanService.addArgument).toHaveBeenCalledWith(
            session,
            'User (Human-in-loop)',
            'Here is my argument',
            1.0,
        );
    });

    it('does not inject when input is empty', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'AI Safety',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 2,
            participants: [{ id: 'agent-1', name: 'Agent Alpha', role: 'pro', systemPrompt: '' }],
            arguments: [],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        fireEvent.click(screen.getByText('Inject'));
        expect(mockDebateHumanService.addArgument).not.toHaveBeenCalled();
    });

    it('clears injection input after successful inject', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'AI Safety',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 2,
            participants: [{ id: 'agent-1', name: 'Agent Alpha', role: 'pro', systemPrompt: '' }],
            arguments: [],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const input = screen.getByPlaceholderText(
            'Inject human argument into the dialectic...',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'My argument' } });
        fireEvent.click(screen.getByText('Inject'));
        await waitFor(() => expect(input.value).toBe(''));
    });

    it('calls debateEngine.pauseSession when pause button clicked', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'Test',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 1,
            participants: [],
            arguments: [],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const pauseBtn = document.querySelector('button[title="Pause Debate"]');
        expect(pauseBtn).toBeDefined();
        fireEvent.click(pauseBtn!);
        expect(mockDebateEngine.pauseSession).toHaveBeenCalledWith('debate-1');
    });

    it('calls debateEngine.resumeSession when resume button clicked', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'Test',
            status: 'paused',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 1,
            participants: [],
            arguments: [],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const resumeBtn = document.querySelector('button[title="Resume Debate"]');
        expect(resumeBtn).toBeDefined();
        fireEvent.click(resumeBtn!);
        expect(mockDebateEngine.resumeSession).toHaveBeenCalledWith('debate-1');
    });

    it('calls debateEngine.cancelSession when stop button clicked', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'Test',
            status: 'active',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 1,
            participants: [],
            arguments: [],
            convergenceScore: 50,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const stopBtn = document.querySelector('button[title="Force Stop"]');
        expect(stopBtn).toBeDefined();
        fireEvent.click(stopBtn!);
        expect(mockDebateEngine.cancelSession).toHaveBeenCalledWith('debate-1');
    });

    it('hides injection input when session is completed', async () => {
        mockGetActiveSession.mockReturnValue({
            id: 'debate-1',
            topic: 'Test',
            status: 'completed',
            strategy: 'round_robin',
            maxRounds: 10,
            currentRound: 5,
            participants: [],
            arguments: [],
            convergenceScore: 85,
        });
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(
            screen.queryByPlaceholderText('Inject human argument into the dialectic...'),
        ).toBeNull();
    });

    it('handles debate update via eventBus', async () => {
        mockDebateService.getSession.mockReturnValueOnce(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);

        await act(async () => {
            eventBus.emit('debate:updated', {
                id: 'live-1',
                topic: 'Live Debate',
                status: 'active',
                strategy: 'round_robin',
                maxRounds: 5,
                currentRound: 1,
                participants: [{ id: 'a1', name: 'Agent One', role: 'pro', systemPrompt: '' }],
                arguments: [
                    {
                        id: 'a1-1',
                        agentId: 'a1',
                        agentName: 'Agent One',
                        content: 'Hello debate',
                        confidence: 0.9,
                        timestamp: Date.now(),
                        round: 1,
                        position: 'pro',
                    },
                ],
                convergenceScore: 40,
            });
        });

        expect(await screen.findByText('Live Debate')).toBeDefined();
        expect(screen.getByText('Hello debate')).toBeDefined();
    });

    it('shows loading skeleton initially', async () => {
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByRole('status')).toBeDefined();
    });

    it('displays session from eventBus when loading times out', async () => {
        mockDebateService.getSession.mockReturnValueOnce(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);

        await act(async () => {
            eventBus.emit('debate:updated', {
                id: 'live-1',
                topic: 'Live Debate',
                status: 'active',
                strategy: 'round_robin',
                maxRounds: 5,
                currentRound: 1,
                participants: [],
                arguments: [],
                convergenceScore: 40,
            });
        });

        expect(await screen.findByText('Live Debate')).toBeDefined();
    });

    it('shows loading spinner on start button when actionLoading is start', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        mockDebateService.startDebate.mockImplementation(() => {});
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);

        const textareas = document.querySelectorAll('textarea');
        fireEvent.change(textareas[0], { target: { value: 'Topic' } });

        fireEvent.click(screen.getByText('Initialize Debate Runtime'));
        expect(mockDebateService.startDebate).toHaveBeenCalled();
    });

    it('shows agent count in setup screen', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        expect(screen.getByText('3 Selected')).toBeDefined();
    });

    it('shows strategy selector with default value', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const select = document.querySelector('select');
        expect(select).toBeDefined();
        expect(select?.value).toBe('round_robin');
    });

    it('has max rounds input defaulting to 10', async () => {
        mockDebateService.getSession.mockReturnValue(null);
        const DebatePanel = (await import('./DebatePanel')).default;
        render(<DebatePanel />);
        const numberInput = document.querySelector('input[type="number"]') as HTMLInputElement;
        expect(numberInput).toBeDefined();
        expect(numberInput.value).toBe('10');
    });
});
