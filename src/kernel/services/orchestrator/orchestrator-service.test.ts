import { describe, it, expect, vi } from 'vitest';
import { OrchestratorService } from './orchestrator-service';

const events = { emit: vi.fn(), on: vi.fn() } as never;

describe('OrchestratorService', () => {
    it('plans a deterministic 3-stage DAG without LLM', async () => {
        const svc = new OrchestratorService(events);
        const plan = await svc.plan('Build feature X');
        expect(plan.nodes).toHaveLength(3);
        expect(plan.nodes[0]!.dependsOn).toEqual([]);
        expect(plan.nodes[1]!.dependsOn).toEqual(['t1']);
        expect(plan.nodes[2]!.dependsOn).toEqual(['t2']);
    });

    it('runs nodes in dependency order and passes dependency outputs', async () => {
        const svc = new OrchestratorService(events);
        const order: string[] = [];
        const result = await svc.run('Build feature X', async (node, ctx) => {
            order.push(node.id);
            expect(ctx.goal).toBe('Build feature X');
            if (node.id === 't2') {
                expect(ctx.dependencyOutputs['t1']).toBe('t1 done');
            }
            if (node.id === 't3') {
                expect(ctx.dependencyOutputs['t2']).toBe('t2 done');
            }
            return `${node.id} done`;
        });
        expect(result.status).toBe('completed');
        expect(order).toEqual(['t1', 't2', 't3']);
        expect(result.outputs['t1']).toBe('t1 done');
    });

    it('marks downstream nodes skipped when a dependency fails', async () => {
        const svc = new OrchestratorService(events);
        const result = await svc.run('Goal', async (node) => {
            if (node.id === 't1') throw new Error('boom');
            return 'ok';
        });
        expect(result.status).toBe('failed');
        expect(result.failedNodeIds).toEqual(['t1']);
        expect(result.outputs['t2']).toBeUndefined();
        expect(result.outputs['t3']).toBeUndefined();
    });

    it('runWithDispatcher passes assigned agents into the executor', async () => {
        const svc = new OrchestratorService(events);
        const dispatcher = {
            assign: vi.fn((nodes) =>
                nodes.map((n) => ({
                    nodeId: n.id,
                    agent: { id: `agent-${n.id}`, role: 'researcher' },
                    reason: 'test',
                })),
            ),
        };
        const seenRoles: string[] = [];
        const result = await svc.runWithDispatcher(
            'Goal',
            async (node) => {
                seenRoles.push(node.assignee?.role ?? '');
                return 'ok';
            },
            dispatcher,
        );
        expect(dispatcher.assign).toHaveBeenCalled();
        expect(result.status).toBe('completed');
        expect(result.assignments).toHaveLength(3);
        expect(seenRoles.every((r) => r === 'researcher')).toBe(true);
    });

    it('uses the LLM plan with dependencies and sanitizes cycles', async () => {
        const llm = {
            chat: async () => ({
                content: JSON.stringify([
                    { id: 'a', description: 'First', dependsOn: [] },
                    { id: 'b', description: 'Second', dependsOn: ['a', 'missing', 'b'] },
                ]),
            }),
        };
        const svc = new OrchestratorService(events, llm);
        const plan = await svc.plan('Goal');
        expect(plan.nodes).toHaveLength(2);
        expect(plan.nodes[1]!.dependsOn).toEqual(['a']);
    });
});
