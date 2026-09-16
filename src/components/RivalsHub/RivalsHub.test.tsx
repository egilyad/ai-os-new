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
    autonomyService: {
        listLoops: vi.fn(async () => [
            { id: 'l1', kind: 'autonomy', goal: 'G1', status: 'completed', iterations: 3, maxIterations: 8, taskList: [], log: [], createdAt: 2, updatedAt: 2 },
        ]),
    },
    groupChatService: {
        listChats: vi.fn(async () => [
            { id: 'c1', name: 'Chat1', members: ['a', 'b'], selection: 'auto', maxRounds: 6, stopPhrases: [], turns: [{ speaker: 'a', text: 'hi', round: 1, createdAt: 1 }], status: 'running', createdAt: 1, updatedAt: 1 },
        ]),
    },
    sopService: {
        listSops: vi.fn(async () => [{ id: 's1', name: 'Sop1', phases: [{ name: 'p', role: 'r', artifact: 'a', instruction: 'i' }], createdAt: 1 }]),
        runSop: vi.fn(async () => ({ id: 'l2' })),
    },
    runQueueService: {
        list: vi.fn(async () => [{ id: 'q1', kind: 'crew', refId: 'r1', status: 'queued', createdAt: 1, updatedAt: 1 }]),
        listToolkits: vi.fn(async () => [{ id: 'k1', name: 'K1', prefixes: ['ws.'], createdAt: 1 }]),
        enqueue: vi.fn(async () => ({ id: 'q2' })),
        drain: vi.fn(async () => []),
        defineToolkit: vi.fn(async () => ({ id: 'k2' })),
    },
    memoryBlocksService: {
        getBlocks: vi.fn(async () => [{ ownerId: 'o', section: 'human', content: 'hello block', charLimit: 100, updatedAt: 1, createdAt: 1 }]),
    },
    dyadService: {
        startDyad: vi.fn(async () => ({ id: 'l3' })),
    },
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string, params?: Record<string, string>) => key + (params ? JSON.stringify(params) : '') }),
}));

describe('RivalsHub', () => {
    it('loads loops, chats, sops, queue and toolkits', async () => {
        const Hub = (await import('./RivalsHub')).default;
        render(<Hub />);
        expect(await screen.findByText(/G1/)).toBeDefined();
        expect(await screen.findByText(/Chat1/)).toBeDefined();
        expect((await screen.findAllByText('Sop1')).length).toBeGreaterThan(0);
        expect(await screen.findByText(/K1/)).toBeDefined();
    });

    it('runs an SOP with a goal', async () => {
        const { sopService } = await import('../../kernel/instances/services-extras');
        const Hub = (await import('./RivalsHub')).default;
        render(<Hub />);
        await screen.findAllByText('Sop1');
        fireEvent.change(screen.getByPlaceholderText('hub.sops.goalPlaceholder'), {
            target: { value: 'Ship' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'hub.sops.run' }));
        await waitFor(() => expect(sopService.runSop).toHaveBeenCalledWith('s1', 'Ship'));
    });

    it('enqueues and drains the run queue', async () => {
        const { runQueueService } = await import('../../kernel/instances/services-extras');
        const Hub = (await import('./RivalsHub')).default;
        render(<Hub />);
        await screen.findByText(/K1/);
        fireEvent.change(screen.getByPlaceholderText('hub.queue.refPlaceholder'), {
            target: { value: 'ref-9' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'hub.queue.enqueue' }));
        await waitFor(() => expect(runQueueService.enqueue).toHaveBeenCalledWith('crew', 'ref-9'));
        fireEvent.click(screen.getByRole('button', { name: 'hub.queue.drain' }));
        await waitFor(() => expect(runQueueService.drain).toHaveBeenCalled());
    });

    it('loads memory blocks and starts a dyad', async () => {
        const { memoryBlocksService, dyadService } = await import('../../kernel/instances/services-extras');
        const Hub = (await import('./RivalsHub')).default;
        render(<Hub />);
        await screen.findByText(/K1/);
        fireEvent.change(screen.getByPlaceholderText('hub.blocks.ownerPlaceholder'), {
            target: { value: 'o' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'hub.blocks.load' }));
        await waitFor(() => expect(memoryBlocksService.getBlocks).toHaveBeenCalledWith('o'));
        expect(await screen.findByText(/hello block/)).toBeDefined();
        fireEvent.change(screen.getByPlaceholderText('hub.dyad.topicPlaceholder'), {
            target: { value: 'Tabs vs spaces' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'hub.dyad.start' }));
        await waitFor(() =>
            expect(dyadService.startDyad).toHaveBeenCalledWith(expect.objectContaining({ topic: 'Tabs vs spaces' })),
        );
    });
});
