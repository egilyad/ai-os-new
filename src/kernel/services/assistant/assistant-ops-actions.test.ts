import { describe, it, expect } from 'vitest';
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
    it('registers four read-only observations', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantOpsActions(deps()));
        const ids = registry.list().map((a) => a.id);
        expect(ids).toEqual([
            'approvals.pending',
            'metrics.summary',
            'topology.summary',
            'traces.summary',
        ]);
        for (const action of registry.list()) {
            expect(action.action).toBe('tool:read');
        }
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
