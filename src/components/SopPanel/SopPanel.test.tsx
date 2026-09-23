import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { AgentLoop, SopDefinition } from '../../kernel/contracts/rivals';

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

let sops: SopDefinition[] = [];
let loops: AgentLoop[] = [];

vi.mock('../../kernel/instances/services-extras', () => ({
    sopService: {
        listSops: vi.fn(async () => [...sops]),
        runSop: vi.fn(async (_sopId: string, goal: string) => {
            const loop: AgentLoop = {
                id: `sop-${loops.length + 1}`,
                kind: 'sop',
                goal,
                status: 'completed',
                iterations: 2,
                maxIterations: 5,
                taskList: [],
                log: ['SOP "software-crew" started', '[PM → prd]: Requirements done', '[Architect → design]: Modules designed'],
                result: 'All phases done.',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            loops.push(loop);
            return loop;
        }),
    },
    autonomyService: {
        listLoops: vi.fn(async () => [...loops]),
        getLoop: vi.fn(async (id: string) => loops.find((l) => l.id === id) ?? null),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
    sops = [
        {
            id: 'sop-1',
            name: 'software-crew',
            phases: [
                { name: 'PRD', role: 'ProductManager', artifact: 'prd', instruction: 'Write requirements.' },
                { name: 'Design', role: 'Architect', artifact: 'design', instruction: 'Design modules.' },
            ],
            createdAt: 1,
        },
    ];
    loops = [
        {
            id: 'sop-old',
            kind: 'sop',
            goal: 'Build a REST API',
            status: 'completed',
            iterations: 2,
            maxIterations: 5,
            taskList: [],
            log: ['SOP "software-crew" started', '[PM → prd]: Done'],
            result: 'All phases done.',
            createdAt: 1,
            updatedAt: 1,
        },
    ];
    vi.clearAllMocks();
});

describe('SopPanel', () => {
    it('loads SOP definitions and run history on mount', async () => {
        const { sopService, autonomyService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./SopPanel')).default;
        render(<Panel />);
        await waitFor(() => {
            expect(sopService.listSops).toHaveBeenCalled();
            expect(autonomyService.listLoops).toHaveBeenCalled();
        });
        expect((await screen.findAllByText('software-crew')).length).toBeGreaterThan(0);
        expect((await screen.findAllByText('Build a REST API')).length).toBeGreaterThan(0);
    });

    it('runs an SOP with a goal and shows the result', async () => {
        const { sopService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./SopPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(sopService.listSops).toHaveBeenCalled());
        fireEvent.change(screen.getByPlaceholderText('sop.goalPlaceholder'), {
            target: { value: 'Build a chat app' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'sop.run.start' }));
        await waitFor(() => expect(sopService.runSop).toHaveBeenCalledWith('sop-1', 'Build a chat app'));
        expect((await screen.findAllByText('Build a chat app')).length).toBeGreaterThan(0);
    });

    it('shows validation on empty goal', async () => {
        const { sopService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./SopPanel')).default;
        render(<Panel />);
        await waitFor(() => expect(sopService.listSops).toHaveBeenCalled());
        fireEvent.click(screen.getByRole('button', { name: 'sop.run.start' }));
        expect(await screen.findByText('sop.validation.goal')).toBeDefined();
    });
});
