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

vi.mock('../../kernel/instances/services-extras', () => ({
    invocationEngine: { invoke: vi.fn().mockResolvedValue({ id: 'inv-1' }) },
}));

vi.mock('../../kernel/instances/services-core', () => ({
    agentService: {
        getAgents: () => [
            { id: 'a1', name: 'Alpha', role: 'Analyst', status: 'active', stats: {} },
            { id: 'a2', name: 'Beta', role: 'Critic', status: 'active', stats: {} },
        ],
    },
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

const mockStoreState = {
    invocations: {},
    order: [],
    feed: [],
    log: [],
    loadHistory: vi.fn(),
    loadCosts: vi.fn(),
    clear: vi.fn(),
};

vi.mock('../../stores/invocationStore', () => ({
    useInvocationStore: Object.assign(
        (selector?: (s: typeof mockStoreState) => unknown) =>
            selector ? selector(mockStoreState) : mockStoreState,
        { getState: () => mockStoreState },
    ),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'room.title': 'Agent Rooms',
                'room.subtitle': 'Invoke agents into live rooms — by policy only',
                'room.invoke.heading': 'Invoke Agent',
                'room.invoke.agent': 'Agent',
                'room.invoke.agentPlaceholder': 'Select an agent…',
                'room.invoke.where': 'Where',
                'room.invoke.where.room': '💬 This room',
                'room.invoke.where.forum': '📋 Forum topic',
                'room.invoke.where.conversation': '🗨️ Conversation',
                'room.invoke.mode': 'Mode',
                'room.invoke.mode.chat': '💬 Chat',
                'room.invoke.mode.debate': '⚔️ Debate',
                'room.invoke.mode.director-scenario': '🎬 Scenario',
                'room.invoke.task': 'What should the agent do?',
                'room.invoke.taskPlaceholder': 'Describe the task for the agent…',
                'room.invoke.submit': 'Invoke Agent',
                'room.invoke.validation': 'Select an agent and describe the task.',
                'room.unknownAgent': 'Agent',
                'room.status.requested': 'Requested',
                'room.status.accepted': 'Accepted',
                'room.status.rejected': 'Rejected',
                'room.status.executing': 'Executing',
                'room.status.done': 'Done',
                'room.invocation.details': 'Details',
                'room.invocations.heading': 'Invocations',
                'room.invocations.empty': 'No invocations yet.',
                'room.feed.heading': 'Live output',
                'room.feed.empty': 'No activity yet.',
                'room.session': 'Session',
                'room.clear': 'Clear',
            };
            return labels[key] || key;
        },
    }),
}));

describe('RoomPanel (Step 6 minimal)', () => {
    it('renders title and the invoke form', async () => {
        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);
        expect(await screen.findByText('Agent Rooms')).toBeDefined();
        expect(screen.getByText('Invoke Agent', { selector: 'div' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Invoke Agent' })).toBeDefined();
    });

    it('raises an InvocationRequest through invocationEngine on submit', async () => {
        const { invocationEngine } = await import('../../kernel/instances/services-extras');
        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);

        fireEvent.change(screen.getByRole('combobox', { name: 'Agent' }), {
            target: { value: 'a1' },
        });
        fireEvent.change(screen.getByPlaceholderText('Describe the task for the agent…'), {
            target: { value: 'need expertise' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Invoke Agent' }));

        await waitFor(() => expect(invocationEngine.invoke).toHaveBeenCalledTimes(1));
        const req = (invocationEngine.invoke as ReturnType<typeof vi.fn>).mock.calls[0]![0];
        expect(req.target).toEqual({ agentId: 'a1' });
        expect(req.reason).toBe('need expertise');
        expect(req.context).toEqual({ type: 'room', ref: 'general' });
        expect(req.constraints.mode).toBe('chat');
    });
});
