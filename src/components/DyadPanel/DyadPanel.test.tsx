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
    dyadService: {
        listLoops: vi.fn(async () => [...store]),
        getLoop: vi.fn(async (id: string) => store.find((l) => l.id === id) ?? null),
        startDyad: vi.fn(async (input: { topic: string; maxTurns?: number }) => {
            const loop: AgentLoop = {
                id: `dyad-${store.length + 1}`,
                kind: 'dyad',
                goal: input.topic,
                status: 'completed',
                iterations: 2,
                maxIterations: input.maxTurns ?? 10,
                taskList: [],
                log: ['[Assistant]: Got it', '[User]: Done'],
                result: 'Done in 2 turns.',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            store.push(loop);
            return loop;
        }),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
    store = [
        {
            id: 'dyad-old',
            kind: 'dyad',
            goal: 'Write a poem about cats',
            status: 'completed',
            iterations: 3,
            maxIterations: 10,
            taskList: [],
            log: ['[Assistant]: Here is a poem', '[User]: Nice, done'],
            result: 'Done in 3 turns.',
            createdAt: 1,
            updatedAt: 1,
        },
    ];
    vi.clearAllMocks();
});

describe('DyadPanel', () => {
    it('loads dyad history on mount', async () => {
        const { dyadService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./DyadPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(dyadService.listLoops).toHaveBeenCalled());
        expect((await screen.findAllByText('Write a poem about cats')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('dyad.status.completed').length).toBeGreaterThan(0);
    });

    it('starts a dyad and selects the finished loop', async () => {
        const { dyadService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./DyadPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('dyad.topicPlaceholder'), {
            target: { value: 'Explain quantum computing' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'dyad.run.start' }));
        await waitFor(() => expect(dyadService.startDyad).toHaveBeenCalledWith(
            expect.objectContaining({ topic: 'Explain quantum computing' }),
        ));
        expect((await screen.findAllByText('Explain quantum computing')).length).toBeGreaterThan(0);
    });

    it('shows validation on empty topic', async () => {
        const Panel = (await import('./DyadPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByRole('button', { name: 'dyad.run.start' }));
        expect(await screen.findByText('dyad.validation.topic')).toBeDefined();
    });
});
