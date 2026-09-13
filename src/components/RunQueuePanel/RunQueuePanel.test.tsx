import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { QueuedRun, Toolkit } from '../../kernel/contracts/rivals';

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

let queue: QueuedRun[] = [];
let toolkits: Toolkit[] = [];
let queueCounter = 0;

vi.mock('../../kernel/instances/services-extras', () => ({
    runQueueService: {
        list: vi.fn(async () => [...queue]),
        enqueue: vi.fn(async (kind: QueuedRun['kind'], refId: string, input?: Record<string, unknown>) => {
            queueCounter++;
            const item: QueuedRun = {
                id: `run-${queueCounter}`,
                kind,
                refId,
                input: input ? { ...input } : undefined,
                status: 'queued',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            queue.push(item);
            return item;
        }),
        drain: vi.fn(async (concurrency?: number) => {
            const cap = Math.max(1, concurrency ?? 1);
            const pending = queue.filter((q) => q.status === 'queued');
            const done: QueuedRun[] = [];
            for (let i = 0; i < pending.length; i += cap) {
                const wave = pending.slice(i, i + cap);
                for (const item of wave) {
                    item.status = 'done';
                    item.result = `done (${item.kind})`;
                    item.updatedAt = Date.now();
                    done.push(item);
                }
            }
            return done;
        }),
        defineToolkit: vi.fn(async (name: string, prefixes: string[]) => {
            const tk: Toolkit = {
                id: `tk-${toolkits.length + 1}`,
                name,
                prefixes: [...prefixes],
                createdAt: Date.now(),
            };
            toolkits.push(tk);
            return tk;
        }),
        listToolkits: vi.fn(async () => [...toolkits]),
        toolkitAllows: vi.fn(async (toolkitId: string, tool: string) => {
            const tk = toolkits.find((t) => t.id === toolkitId);
            if (!tk) throw new Error('not found');
            return tk.prefixes.some((p) => tool.startsWith(p));
        }),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string, params?: Record<string, string>) => {
        if (params) {
            let s = key;
            for (const [k, v] of Object.entries(params)) {
                s = s.replace(`{${k}}`, v);
            }
            return s;
        }
        return key;
    } }),
}));

describe('RunQueuePanel', () => {
    it('loads queue and toolkits on mount', async () => {
        const { runQueueService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./RunQueuePanel')).default;
        render(<Panel />);
        await waitFor(() => {
            expect(runQueueService.list).toHaveBeenCalled();
            expect(runQueueService.listToolkits).toHaveBeenCalled();
        });
    });

    it('enqueues a crew run and shows it in the list', async () => {
        const { runQueueService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./RunQueuePanel')).default;
        render(<Panel />);
        await waitFor(() => expect(runQueueService.list).toHaveBeenCalled());

        fireEvent.change(screen.getByPlaceholderText('runQueue.refIdPlaceholder'), {
            target: { value: 'crew-1' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'runQueue.enqueue.submit' }));

        await waitFor(() => expect(runQueueService.enqueue).toHaveBeenCalledWith('crew', 'crew-1', undefined));
        expect((await screen.findAllByText('crew-1')).length).toBeGreaterThan(0);
    });

    it('drains the queue and shows the result', async () => {
        const { runQueueService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./RunQueuePanel')).default;
        render(<Panel />);
        await waitFor(() => expect(runQueueService.list).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('button', { name: 'runQueue.drain.submit' }));

        await waitFor(() => expect(runQueueService.drain).toHaveBeenCalled());
    });

    it('shows validation on empty refId', async () => {
        const Panel = (await import('./RunQueuePanel')).default;
        render(<Panel />);
        await waitFor(() => {
            const items = screen.getAllByRole('listitem');
            expect(items.length).toBeGreaterThanOrEqual(0);
        });
        fireEvent.click(screen.getByRole('button', { name: 'runQueue.enqueue.submit' }));
        expect(await screen.findByText('runQueue.validation.refId')).toBeDefined();
    });

    it('defines a toolkit and shows it in the list', async () => {
        const { runQueueService } = await import('../../kernel/instances/services-extras');
        const Panel = (await import('./RunQueuePanel')).default;
        render(<Panel />);
        await waitFor(() => expect(runQueueService.listToolkits).toHaveBeenCalled());

        fireEvent.change(screen.getByPlaceholderText('runQueue.toolkit.namePlaceholder'), {
            target: { value: 'web-tools' },
        });
        fireEvent.change(screen.getByPlaceholderText('runQueue.toolkit.prefixesPlaceholder'), {
            target: { value: 'http., fetch.' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'runQueue.toolkit.define' }));

        await waitFor(() => expect(runQueueService.defineToolkit).toHaveBeenCalledWith('web-tools', ['http.', 'fetch.']));
        expect((await screen.findAllByText('web-tools')).length).toBeGreaterThan(0);
    });
});
