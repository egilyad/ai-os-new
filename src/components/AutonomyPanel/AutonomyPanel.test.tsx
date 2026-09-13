import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { AgentLoop } from '../../kernel/contracts/rivals';

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

let store: AgentLoop[] = [];

vi.mock('../../kernel/instances/services-extras', () => ({
    autonomyService: {
        listLoops: vi.fn(async () => [...store]),
        getLoop: vi.fn(async (id: string) => store.find((l) => l.id === id) ?? null),
        runGoal: vi.fn(async (goal: string, max: number) => {
            const loop: AgentLoop = {
                id: `loop-${store.length + 1}`,
                kind: 'autonomy',
                goal,
                status: 'completed',
                iterations: 2,
                maxIterations: max,
                taskList: [],
                log: ['Goal: x', '#1 plan: p', '#1 critique: DONE: ok'],
                result: 'ok',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            store.push(loop);
            return loop;
        }),
        runTaskQueue: vi.fn(async (objective: string, max: number) => {
            const loop: AgentLoop = {
                id: `loop-${store.length + 1}`,
                kind: 'task_queue',
                goal: objective,
                status: 'completed',
                iterations: 1,
                maxIterations: max,
                taskList: [{ id: 't1', text: 'do thing', status: 'done' }],
                log: ['Objective: x'],
                result: 'All 1 tasks done.',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            store.push(loop);
            return loop;
        }),
        abortLoop: vi.fn(async () => {}),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
    store = [
        {
            id: 'loop-old',
            kind: 'autonomy',
            goal: 'Old goal',
            status: 'stuck',
            iterations: 5,
            maxIterations: 8,
            taskList: [],
            log: ['Goal: Old goal'],
            result: 'Stuck after 5 iterations (repeated critique).',
            createdAt: 1,
            updatedAt: 1,
        },
    ];
    vi.clearAllMocks();
});

describe('AutonomyPanel', () => {
    it('loads loop history on mount', async () => {
        const { autonomyService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./AutonomyPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(autonomyService.listLoops).toHaveBeenCalled());
        expect((await screen.findAllByText('Old goal')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('autonomy.status.stuck').length).toBeGreaterThan(0);
    });

    it('runs a goal and selects the finished loop', async () => {
        const { autonomyService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./AutonomyPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('autonomy.goalPlaceholder'), {
            target: { value: 'Fix tests' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'autonomy.run.goal' }));
        await waitFor(() => expect(autonomyService.runGoal).toHaveBeenCalledWith('Fix tests', 8));
        expect((await screen.findAllByText('Fix tests')).length).toBeGreaterThan(0);
        expect(screen.getByText('ok')).toBeDefined();
    });

    it('shows validation on empty goal', async () => {
        const Panel = (await import('./AutonomyPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: 'autonomy.run.queue' }));
        expect(await screen.findByText('autonomy.validation.goal')).toBeDefined();
    });
});
