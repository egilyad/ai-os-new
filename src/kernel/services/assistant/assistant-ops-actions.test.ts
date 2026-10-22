import { describe, it, expect, vi } from 'vitest';
import { AssistantActionRegistry } from './assistant-action-registry';
import { createAssistantOpsActions, type AssistantOpsDeps } from './assistant-ops-actions';

function deps(overrides: Partial<AssistantOpsDeps> = {}): AssistantOpsDeps {
    return {
        topology: {
            summary: () => ({
                id: 'top-1',
                name: 'Main',
                nodes: 64,
                agents: 62,
                routers: 1,
                paused: 2,
                edges: 70,
            }),
        },
        metrics: {
            aggregated: () => ({
                totalRequests: 120,
                totalTokens: 45000,
                estimatedCost: 0.1234,
                avgLatency: 850,
                successRate: 0.95,
                errorRate: 0.05,
                activeProviders: 2,
                totalProviders: 4,
            }),
        },
        traces: {
            stats: () => ({
                total: 10,
                completed: 8,
                failed: 1,
                running: 1,
                successRate: 0.8,
                avgDuration: 1200,
                avgTokens: 700,
            }),
        },
        approvals: {
            pending: () => [{ id: 'ap-1', tool: 'file.write', agentId: 'assistant' }],
        },
        ...overrides,
    };
}

describe('assistant ops actions', () => {
    it('registers the reads and the guarded writes', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantOpsActions(deps()));
        const ids = registry.list().map((a) => a.id);
        expect(ids).toEqual([
            'approvals.pending',
            'metrics.summary',
            'scheduler.create',
            'tasks.create',
            'tasks.list',
            'topology.summary',
            'traces.summary',
        ]);
        const writes = new Set(['scheduler.create', 'tasks.create']);
        for (const action of registry.list()) {
            expect(action.action).toBe(writes.has(action.id) ? 'tool:write' : 'tool:read');
        }
    });

    it('creates a schedule, reads it back and reports the cron', async () => {
        const rows: Array<{ id: string }> = [];
        const create = vi.fn(async (data: Record<string, unknown>) => {
            const row = {
                id: 'schedule-1',
                name: String(data['name']),
                agentId: String(data['agentId']),
                cronExpression: '0 9 * * *',
                nextRun: Date.now() + 3600_000,
            };
            rows.push(row);
            return row;
        });
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({ scheduler: { create, getAll: () => rows } as never }),
            ),
        );

        const result = await registry.run('scheduler.create', {
            name: 'Утренняя проверка',
            prompt: 'Проверь здоровье системы',
            frequency: 'daily',
        });
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('(daily)');
        expect(result.detail).toContain('agent assistant');
        expect(result.evidence).toContain('schedule: schedule-1');
        expect(result.evidence).toContain('cron: 0 9 * * *');
        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Утренняя проверка',
                agentId: 'assistant',
                frequency: 'daily',
                taskParams: { prompt: 'Проверь здоровье системы' },
            }),
        );
    });

    it('refuses to schedule a task on an agent that does not exist', async () => {
        const create = vi.fn();
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({
                    scheduler: { create, getAll: () => [] } as never,
                    agents: { getAgents: () => [{ id: 'assistant' }] },
                }),
            ),
        );

        const result = await registry.run('scheduler.create', {
            name: 'x',
            prompt: 'y',
            frequency: 'daily',
            agentId: 'ghost',
        });
        expect(result.ok).toBe(false);
        expect(result.detail).toContain('Agent ghost does not exist');
        expect(create).not.toHaveBeenCalled();
    });

    it('refuses bad frequencies, missing prompts and invalid crons', async () => {
        const create = vi.fn();
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({
                    scheduler: {
                        create,
                        getAll: () => [],
                        validateCron: (cron: string) => cron === '*/5 * * * *',
                    } as never,
                }),
            ),
        );

        const noPrompt = await registry.run('scheduler.create', {
            name: 'x',
            prompt: '',
            frequency: 'daily',
        });
        expect(noPrompt.ok).toBe(false);
        expect(noPrompt.detail).toContain('prompt is required');

        const badFrequency = await registry.run('scheduler.create', {
            name: 'x',
            prompt: 'y',
            frequency: 'every-minute',
        });
        expect(badFrequency.ok).toBe(false);
        expect(badFrequency.detail).toContain('Unknown frequency');

        const noCron = await registry.run('scheduler.create', {
            name: 'x',
            prompt: 'y',
            frequency: 'custom',
        });
        expect(noCron.ok).toBe(false);
        expect(noCron.detail).toContain('cronExpression is required');

        const badCron = await registry.run('scheduler.create', {
            name: 'x',
            prompt: 'y',
            frequency: 'custom',
            cronExpression: 'nope',
        });
        expect(badCron.ok).toBe(false);
        expect(badCron.detail).toContain('Invalid cron expression');

        expect(create).not.toHaveBeenCalled();
    });

    it('reports the real topology numbers', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantOpsActions(deps()));
        const result = await registry.run('topology.summary', {});
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('64 nodes');
        expect(result.detail).toContain('2 paused');
        expect(result.evidence).toContain('62 agent(s)');
        expect(result.verification).toBe('verified');
    });

    it('formats metrics and traces as observed facts', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantOpsActions(deps()));
        const metrics = await registry.run('metrics.summary', {});
        expect(metrics.detail).toContain('120 request(s)');
        expect(metrics.detail).toContain('95%');
        const traces = await registry.run('traces.summary', {});
        expect(traces.detail).toContain('1 failed');
        expect(traces.evidence).toContain('failed: 1');
    });

    it('lists pending approvals and stays honest when nothing waits', async () => {
        const withPending = new AssistantActionRegistry();
        withPending.registerAll(createAssistantOpsActions(deps()));
        const pending = await withPending.run('approvals.pending', {});
        expect(pending.detail).toContain('1 request(s)');
        expect(pending.evidence).toContain('ap-1 file.write (assistant)');

        const empty = new AssistantActionRegistry();
        empty.registerAll(createAssistantOpsActions(deps({ approvals: { pending: () => [] } })));
        const none = await empty.run('approvals.pending', {});
        expect(none.ok).toBe(true);
        expect(none.detail).toContain('nothing is waiting');
    });

    it('says what is missing instead of inventing state', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions({
                topology: { summary: () => null },
            }),
        );
        const top = await registry.run('topology.summary', {});
        expect(top.ok).toBe(false);
        expect(top.detail).toContain('no active topology');
        const metrics = await registry.run('metrics.summary', {});
        expect(metrics.ok).toBe(false);
        expect(metrics.verification).toBe('discovered');
    });

    it('delegates a task to an agent and reads it back from the board', async () => {
        const board: Array<{
            id: string;
            title: string;
            status: string;
            assigneeId?: string;
        }> = [];
        const create = vi.fn(async (input: Record<string, unknown>) => {
            const row = {
                id: 'task-1',
                title: String(input['title']),
                status: 'PENDING',
                assigneeId: input['assigneeId'] as string | undefined,
            };
            board.push(row);
            return row;
        });
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({
                    tasks: { list: async () => board, create },
                    agents: { getAgents: () => [{ id: 'assistant' }, { id: 'cto' }] },
                }),
            ),
        );

        const result = await registry.run('tasks.create', {
            title: 'Review the deploy checklist',
            description: 'Check staging first',
            agentId: 'cto',
            priority: 'HIGH',
        });
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('for cto');
        expect(result.evidence).toContain('task: task-1');
        expect(result.evidence).toContain('priority: HIGH');
        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Review the deploy checklist',
                description: 'Check staging first',
                type: 'ONE_TIME',
                priority: 'HIGH',
                assigneeId: 'cto',
                creatorId: 'assistant',
            }),
        );

        const listed = await registry.run('tasks.list', { agentId: 'cto' });
        expect(listed.ok).toBe(true);
        expect(listed.evidence).toContain('Review the deploy checklist (PENDING, cto)');
    });

    it('refuses to delegate to a ghost agent or without a title', async () => {
        const create = vi.fn();
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({
                    tasks: { list: async () => [], create },
                    agents: { getAgents: () => [{ id: 'assistant' }] },
                }),
            ),
        );

        const ghost = await registry.run('tasks.create', { title: 'x', agentId: 'nobody' });
        expect(ghost.ok).toBe(false);
        expect(ghost.detail).toContain('Agent nobody does not exist');

        const untitled = await registry.run('tasks.create', { title: '   ' });
        expect(untitled.ok).toBe(false);
        expect(untitled.detail).toContain('title is required');

        const badPriority = await registry.run('tasks.create', {
            title: 'x',
            priority: 'URGENT',
        });
        expect(badPriority.ok).toBe(false);
        expect(badPriority.detail).toContain('Unknown priority');

        expect(create).not.toHaveBeenCalled();
    });

    it('does not pretend a task exists when the board did not store it', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({
                    tasks: {
                        list: async () => [],
                        create: async () => ({
                            id: 'task-x',
                            title: 'lost',
                            status: 'PENDING',
                        }),
                    },
                }),
            ),
        );
        const result = await registry.run('tasks.create', { title: 'lost' });
        expect(result.ok).toBe(false);
        expect(result.detail).toContain('was not stored');
    });

    it('lists tasks honestly when the board is empty', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantOpsActions(
                deps({ tasks: { list: async () => [], create: vi.fn() } }),
            ),
        );
        const all = await registry.run('tasks.list', {});
        expect(all.ok).toBe(true);
        expect(all.detail).toBe('no tasks');
        expect(all.evidence).toBe('tasks: 0');
    });
});
