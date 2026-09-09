import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import { useDirectorStore } from '../../stores/directorStore';

const { controlsStub } = vi.hoisted(() => ({
    controlsStub: {
        load: vi.fn(),
        run: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        skip: vi.fn(),
        override: vi.fn(),
        abort: vi.fn(),
        reset: vi.fn(),
        loadHistory: vi.fn(),
        getSession: vi.fn(() => undefined),
        checkpoint: vi.fn(() => 'cp1'),
        getCheckpoints: vi.fn(() => []),
    },
}));

vi.mock('../../stores/directorController', () => ({
    createDirectorControls: vi.fn(() => controlsStub),
}));

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

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'director.run.heading': 'Run & observe',
                'director.run.noScenario': 'no scenario',
                'director.run.selected': 'Selected scenario',
                'director.run.current': 'Current',
                'director.run.objective': 'Objective',
                'director.run.progress': 'Progress',
                'director.run.progress.planned': 'planned',
                'director.run.progress.injected': 'injected',
                'director.run.progress.failed': 'failed',
                'director.run.run': 'Run',
                'director.run.pause': 'Pause',
                'director.run.resume': 'Resume',
                'director.run.skip': 'Skip',
                'director.run.override': 'Override',
                'director.run.abort': 'Abort',
                'director.run.overrideParticipant': 'Participant',
                'director.run.overrideObjective': 'Instruction',
                'director.run.overrideSubmit': 'Inject',
                'director.run.log': 'Turn log',
                'director.run.logEmpty': 'empty',
                'director.run.status.idle': 'Idle',
                'director.run.status.running': 'Running',
                'director.run.status.paused': 'Paused',
                'director.run.turnStatus.running': 'running',
                'director.run.turnStatus.complete': 'complete',
                'director.run.turnStatus.error': 'error',
                'director.run.session': 'Session',
                'director.run.checkpoint': 'Checkpoint',
                'director.run.checkpoint.label': 'Label',
                'director.run.checkpoints': 'Checkpoints',
                'director.run.checkpoint.cursor': 'cursor',
            };
            return labels[key] || key;
        },
    }),
}));

const scenario = {
    id: 's1',
    name: 'Test scenario',
    description: 'd',
    topic: 't',
    version: 1,
    status: 'draft',
    participants: [
        { id: 'architect', role: 'Architect' },
        { id: 'auditor', role: 'Auditor' },
    ],
    turns: [
        {
            participantId: 'architect',
            objective: { type: 'INTRODUCE', description: 'plan A', constraints: [] },
        },
        {
            participantId: 'auditor',
            objective: { type: 'CRITIQUE', description: 'audit A', constraints: [] },
        },
    ],
    createdAt: 0,
    updatedAt: 0,
} as unknown as ConversationScenario;

describe('RunTab (B5.4c Run UI)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        act(() => {
            useDirectorStore.setState({
                sessionId: '',
                status: 'idle',
                currentParticipantId: null,
                turnLog: [],
            });
        });
    });

    it('renders all run controls for a selected scenario', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        expect(screen.getByText('Run & observe')).toBeDefined();
        expect(screen.getByText('Test scenario')).toBeDefined();
        for (const label of ['Run', 'Pause', 'Resume', 'Skip', 'Override', 'Abort']) {
            expect(screen.getByText(label)).toBeDefined();
        }
    });

    it('Run loads the scenario then runs it via the controller', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        fireEvent.click(screen.getByText('Run'));
        await waitFor(() => {
            expect(controlsStub.load).toHaveBeenCalledWith('s1');
            expect(controlsStub.run).toHaveBeenCalledTimes(1);
        });
    });

    it('reflects live DirectorStore updates (running + progress + log)', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        act(() => {
            useDirectorStore.setState({
                status: 'running',
                currentParticipantId: 'architect',
                turnLog: [{ participantId: 'architect', status: 'running' }],
            });
        });
        expect(screen.getByText('Running')).toBeDefined();
        expect(screen.getByText('Progress: 0/2 planned')).toBeDefined();
        expect(
            screen.getByText((_, el) => (el?.textContent ?? '') === 'Objective: plan A'),
        ).toBeDefined(); // current turn objective
        expect(screen.getAllByText('Unknown Agent').length).toBeGreaterThan(0);
        expect(screen.getByText('running')).toBeDefined();
    });

    it('shows a completed turn and an error in the log', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        act(() => {
            useDirectorStore.setState({
                status: 'running',
                currentParticipantId: 'auditor',
                turnLog: [
                    { participantId: 'architect', status: 'complete', success: true },
                    { participantId: 'auditor', status: 'error', success: false, error: 'boom' },
                ],
            });
        });
        expect(screen.getByText('complete')).toBeDefined();
        expect(screen.getByText('boom')).toBeDefined();
    });

    it('Override opens the form and submits a TurnProposal via the controller', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        act(() => {
            useDirectorStore.setState({ status: 'running' });
        });
        fireEvent.click(screen.getByText('Override'));
        // [0] = participant select, [1] = objective-type select (FM-05)
        fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'architect' } });
        fireEvent.change(screen.getByPlaceholderText('Instruction'), {
            target: { value: 'injected challenge' },
        });
        fireEvent.click(screen.getByText('Inject'));
        expect(controlsStub.override).toHaveBeenCalledWith({
            participantId: 'architect',
            objective: { type: 'CHALLENGE', description: 'injected challenge', constraints: [] },
        });
    });

    it('Override type select changes the emitted objective type (FM-05)', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        act(() => {
            useDirectorStore.setState({ status: 'running' });
        });
        fireEvent.click(screen.getByText('Override'));
        const combos = screen.getAllByRole('combobox');
        fireEvent.change(combos[0]!, { target: { value: 'auditor' } });
        fireEvent.change(combos[1]!, { target: { value: 'CRITIQUE' } });
        fireEvent.change(screen.getByPlaceholderText('Instruction'), {
            target: { value: 'review the plan' },
        });
        fireEvent.click(screen.getByText('Inject'));
        expect(controlsStub.override).toHaveBeenCalledWith({
            participantId: 'auditor',
            objective: { type: 'CRITIQUE', description: 'review the plan', constraints: [] },
        });
    });

    it('Pause and Abort delegate to the controller', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        act(() => {
            useDirectorStore.setState({ status: 'running' });
        });
        fireEvent.click(screen.getByText('Pause'));
        fireEvent.click(screen.getByText('Abort'));
        expect(controlsStub.pause).toHaveBeenCalledTimes(1);
        expect(controlsStub.abort).toHaveBeenCalledTimes(1);
    });

    it('renders a no-scenario message when none is selected', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={null} />);
        expect(screen.getByText('no scenario')).toBeDefined();
    });

    it('Checkpoint button is disabled without a session and calls the controller when a session exists', async () => {
        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        expect((screen.getByText('Checkpoint') as HTMLButtonElement).disabled).toBe(true);
        controlsStub.getSession.mockReturnValue({
            id: 'sess-abc123',
            scenarioId: 's1',
            scenarioName: 'Test scenario',
            status: 'running',
            createdAt: 0,
            updatedAt: 0,
            events: [],
            checkpoints: [],
            results: [],
            currentParticipantId: null,
            currentTurnIndex: null,
            plannedTotal: 2,
            plannedDone: 0,
            injectedDone: 0,
            failed: 0,
            // test stub object — type loosened to satisfy the vi.fn(() => undefined) inference
        } as any);
        act(() => {
            useDirectorStore.setState({ status: 'running' });
        });
        await waitFor(() => {
            expect((screen.getByText('Checkpoint') as HTMLButtonElement).disabled).toBe(false);
        });
        fireEvent.click(screen.getByText('Checkpoint'));
        expect(controlsStub.checkpoint).toHaveBeenCalledTimes(1);
    });
});
