import { describe, it, expect, vi, beforeAll } from 'vitest';
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

const added: Array<{ stage: string; name: string }> = [{ stage: 'pre', name: 'trim' }];

vi.mock('../../kernel/instances/services-extras', () => ({
    plannerService: {
        plan: vi.fn(async (task: string, strategy: string) => `planned:${strategy}:${task}`),
        planStep: vi.fn(async (step: string) => `stepped:${step}`),
        listFilters: vi.fn(async () => [...added]),
        addFilter: vi.fn(async (stage: string, name: string) => {
            added.push({ stage, name });
        }),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PlannerPanel', () => {
    it('loads filters on mount', async () => {
        const { plannerService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./PlannerPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(plannerService.listFilters).toHaveBeenCalled());
        expect(await screen.findByText('pre · trim')).toBeDefined();
    });

    it('runs a plan with the chosen strategy and shows the result', async () => {
        const { plannerService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./PlannerPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('planner.taskPlaceholder'), {
            target: { value: 'Ship it' },
        });
        fireEvent.change(screen.getByLabelText('planner.strategy'), {
            target: { value: 'sequential' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'planner.plan.submit' }));
        await waitFor(() => expect(plannerService.plan).toHaveBeenCalledWith('Ship it', 'sequential'));
        expect(await screen.findByText('planned:sequential:Ship it')).toBeDefined();
    });

    it('drives stepwise iterations via planStep', async () => {
        const { plannerService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./PlannerPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('planner.taskPlaceholder'), {
            target: { value: 'Build' },
        });
        fireEvent.change(screen.getByLabelText('planner.strategy'), {
            target: { value: 'stepwise' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'planner.plan.submit' }));
        fireEvent.change(await screen.findByPlaceholderText('planner.nextStepPlaceholder'), {
            target: { value: 'step two' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'planner.step.submit' }));
        await waitFor(() => expect(plannerService.planStep).toHaveBeenCalledWith('step two'));
        expect(await screen.findByText('stepped:step two')).toBeDefined();
    });

    it('adds a filter and reloads the list', async () => {
        const { plannerService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./PlannerPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: 'planner.filter.add' }));
        await waitFor(() => expect(plannerService.addFilter).toHaveBeenCalled());
        expect((await screen.findAllByText('pre · policy')).length).toBeGreaterThan(0);
    });
});
