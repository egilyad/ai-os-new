import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const getMock = vi.fn();
const getCommentsMock = vi.fn();
const getWorkProductsMock = vi.fn();
const listLabelsMock = vi.fn();
const addCommentMock = vi.fn();
const addWorkProductMock = vi.fn();
const updateMock = vi.fn();

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => {
        const labels: Record<string, string> = {
            'tasks.loading': 'Loading tasks...',
            'tasks.detail.close': 'Close',
            'tasks.detail.labels': 'Labels',
            'tasks.detail.comments': 'Comments',
            'tasks.detail.comments_empty': 'No comments yet',
            'tasks.detail.comment_placeholder': 'Write a comment...',
            'tasks.detail.comment_add': 'Add',
            'tasks.detail.products': 'Work products',
            'tasks.detail.products_empty': 'No work products yet',
            'tasks.detail.wp_title_placeholder': 'Product title...',
            'tasks.detail.wp_add': 'Attach',
            'tasks.detail.error_load': 'Failed to load task',
            'tasks.detail.type.document': 'Document',
            'tasks.detail.type.artifact': 'Artifact',
            'tasks.detail.type.code': 'Code',
            'tasks.detail.type.report': 'Report',
            'tasks.detail.type.file': 'File',
        };
        return { t: (key: string) => labels[key] || key };
    },
}));

vi.mock('../../kernel/instances/services-extras', () => ({
    taskManagerService: {
        get: (...args: unknown[]) => getMock(...args),
        getComments: (...args: unknown[]) => getCommentsMock(...args),
        getWorkProducts: (...args: unknown[]) => getWorkProductsMock(...args),
        listLabels: (...args: unknown[]) => listLabelsMock(...args),
        addComment: (...args: unknown[]) => addCommentMock(...args),
        addWorkProduct: (...args: unknown[]) => addWorkProductMock(...args),
        update: (...args: unknown[]) => updateMock(...args),
    },
    taskTriggerService: {
        listByTask: vi.fn(async () => []),
        create: vi.fn(),
        setEnabled: vi.fn(),
        delete: vi.fn(),
        fire: vi.fn(),
    },
}));

vi.mock('../../kernel/services/task-trigger-service', () => ({
    TaskTriggerService: { hmacHex: vi.fn(() => 'sig') },
}));

describe('TaskDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getMock.mockResolvedValue({
            id: 't1',
            title: 'Detail task',
            description: 'Some description',
            type: 'one_time',
            status: 'in_progress',
            priority: 'high',
            creatorId: 'system',
            labelIds: ['l1'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        getCommentsMock.mockResolvedValue([
            { id: 'c1', taskId: 't1', authorType: 'human', authorId: 'user', content: 'First!', createdAt: 1 },
        ]);
        getWorkProductsMock.mockResolvedValue([
            { id: 'p1', taskId: 't1', title: 'Spec', description: '', type: 'document', content: '', createdBy: 'user', createdAt: 2 },
        ]);
        listLabelsMock.mockResolvedValue([
            { id: 'l1', name: 'bug', color: '#ff0000', createdAt: 0 },
            { id: 'l2', name: 'feature', color: '#00ff00', createdAt: 0 },
        ]);
        addCommentMock.mockImplementation(async (_t: string, _at: string, _a: string, content: string) => ({
            id: 'c2', taskId: 't1', authorType: 'human', authorId: 'user', content, createdAt: 3,
        }));
        updateMock.mockImplementation(async (_id: string, patch: Record<string, unknown>) => ({
            id: 't1', title: 'Detail task', labelIds: patch.labelIds, creatorId: 'system',
        }));
    });

    it('renders task with comments, products and labels', async () => {
        const TaskDetail = (await import('./TaskDetail')).default;
        render(<TaskDetail taskId="t1" onClose={() => undefined} />);
        expect(await screen.findByText('Detail task')).toBeDefined();
        expect(screen.getByText('First!', { exact: false })).toBeDefined();
        expect(screen.getByText('Spec', { exact: false })).toBeDefined();
        expect(screen.getByText('bug')).toBeDefined();
        expect(screen.getByText('feature')).toBeDefined();
    });

    it('adds a comment through the service', async () => {
        const TaskDetail = (await import('./TaskDetail')).default;
        render(<TaskDetail taskId="t1" onClose={() => undefined} />);
        await screen.findByText('Detail task');
        fireEvent.change(screen.getByLabelText('Write a comment...'), {
            target: { value: 'Hello' },
        });
        fireEvent.click(screen.getByText('Add'));
        await waitFor(() => expect(addCommentMock).toHaveBeenCalledWith('t1', 'human', 'user', 'Hello'));
    });

    it('toggles a label through update', async () => {
        const TaskDetail = (await import('./TaskDetail')).default;
        render(<TaskDetail taskId="t1" onClose={() => undefined} />);
        await screen.findByText('Detail task');
        fireEvent.click(screen.getByText('feature'));
        await waitFor(() => expect(updateMock).toHaveBeenCalledWith('t1', { labelIds: ['l1', 'l2'] }));
    });

    it('shows an error when the task is missing', async () => {
        getMock.mockResolvedValueOnce(undefined);
        const TaskDetail = (await import('./TaskDetail')).default;
        render(<TaskDetail taskId="t1" onClose={() => undefined} />);
        expect(await screen.findByText('Failed to load task')).toBeDefined();
    });
});
