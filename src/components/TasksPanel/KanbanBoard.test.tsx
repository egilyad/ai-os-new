import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { TaskRecord } from '../../kernel/types/task-types';

const listMock = vi.fn();
const createMock = vi.fn();
const transitionMock = vi.fn();

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => {
        const labels: Record<string, string> = {
            'tasks.loading': 'Loading tasks...',
            'tasks.priority': 'Priority',
            'tasks.high_priority': 'High Priority',
            'tasks.medium_priority': 'Medium Priority',
            'tasks.low_priority': 'Low Priority',
            'tasks.kanban.title': 'Task board',
            'tasks.kanban.subtitle': 'Plan and track work',
            'tasks.kanban.create': 'Create',
            'tasks.kanban.create_placeholder': 'New task title...',
            'tasks.kanban.empty_column': 'No tasks',
            'tasks.kanban.error_load': 'Failed to load tasks',
            'tasks.kanban.error_create': 'Failed to create task',
            'tasks.kanban.error_move': 'Failed to move task',
            'tasks.kanban.move_to': 'Move to',
            'tasks.kanban.other': 'Other',
            'tasks.kanban.status.pending': 'Pending',
            'tasks.kanban.status.in_progress': 'In progress',
            'tasks.kanban.status.in_review': 'In review',
            'tasks.kanban.status.completed': 'Completed',
            'tasks.kanban.status.failed': 'Failed',
            'tasks.kanban.status.cancelled': 'Cancelled',
        };
        return { t: (key: string) => labels[key] || key };
    },
}));

vi.mock('../../kernel/instances/services-extras', () => ({
    taskManagerService: {
        list: (...args: unknown[]) => listMock(...args),
        create: (...args: unknown[]) => createMock(...args),
        transition: (...args: unknown[]) => transitionMock(...args),
    },
}));

const makeTask = (overrides: Partial<TaskRecord>): TaskRecord => ({
    id: `task-${Math.random().toString(36).slice(2)}`,
    title: 'Task',
    description: '',
    type: 'one_time',
    status: 'pending',
    priority: 'medium',
    creatorId: 'system',
    labelIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
});

describe('KanbanBoard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listMock.mockResolvedValue([
            makeTask({ id: 't1', title: 'First task', status: 'pending' }),
            makeTask({ id: 't2', title: 'Second task', status: 'in_progress' }),
            makeTask({ id: 't3', title: 'Done task', status: 'completed' }),
        ]);
        createMock.mockImplementation(async (input: { title: string }) =>
            makeTask({ id: 't-new', title: input.title }),
        );
        transitionMock.mockImplementation(async (id: string) => makeTask({ id }));
    });

    it('renders columns and cards', async () => {
        const KanbanBoard = (await import('./KanbanBoard')).default;
        render(<KanbanBoard />);
        expect(await screen.findByText('Task board')).toBeDefined();
        expect(await screen.findByText('First task')).toBeDefined();
        expect(screen.getByText('Second task')).toBeDefined();
        expect(screen.getByText('Done task')).toBeDefined();
    });

    it('creates a task through the service', async () => {
        const KanbanBoard = (await import('./KanbanBoard')).default;
        render(<KanbanBoard />);
        await screen.findByText('First task');
        fireEvent.change(screen.getByLabelText('New task title...'), {
            target: { value: 'Brand new' },
        });
        fireEvent.click(screen.getByText('Create'));
        await waitFor(() => expect(createMock).toHaveBeenCalled());
        expect(createMock.mock.calls[0][0]).toMatchObject({ title: 'Brand new' });
    });

    it('moves a task through transition', async () => {
        const KanbanBoard = (await import('./KanbanBoard')).default;
        render(<KanbanBoard />);
        await screen.findByText('First task');
        const selects = await screen.findAllByLabelText('Move to: First task');
        fireEvent.change(selects[0], { target: { value: 'in_progress' } });
        await waitFor(() => expect(transitionMock).toHaveBeenCalledWith('t1', 'in_progress'));
    });

    it('shows an error when loading fails', async () => {
        listMock.mockRejectedValueOnce(new Error('db down'));
        const KanbanBoard = (await import('./KanbanBoard')).default;
        render(<KanbanBoard />);
        expect(await screen.findByText('Failed to load tasks')).toBeDefined();
    });
});
