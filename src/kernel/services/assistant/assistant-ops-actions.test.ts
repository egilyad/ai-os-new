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
    it('registers four reads and one guarded write', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantOpsActions(deps()));
        const ids = registry.list().map((a) => a.id);
        expect(ids).toEqual([
            'approvals.pending',
            'metrics.summary',
            'scheduler.create',
            'topology.summary',
            'traces.summary',
        ]);
        for (const action of registry.list()) {
            expect(action.action).toBe(action.id === 'scheduler.create' ? 'tool:write' : 'tool:read');
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
});
