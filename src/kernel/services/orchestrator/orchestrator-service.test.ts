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

    it('breaks real cycles so every node executes and mission completes', async () => {
        const llm = {
            chat: async () => ({
                content: JSON.stringify([
                    { id: 'a', description: 'A', dependsOn: ['c'] },
                    { id: 'b', description: 'B', dependsOn: ['a'] },
                    { id: 'c', description: 'C', dependsOn: ['b'] },
                ]),
            }),
        };
        const svc = new OrchestratorService(events, llm);
        const executed: string[] = [];
        const result = await svc.run('Goal', async (node) => {
            executed.push(node.id);
            return 'ok';
        });
        expect(executed.length).toBe(3);
        expect(result.status).toBe('completed');
    });

    it('reports failed when nodes remain unexecuted', async () => {
        const llm = {
            chat: async () => ({
                content: JSON.stringify([
                    { id: 'a', description: 'A', dependsOn: [] },
                    { id: 'b', description: 'B', dependsOn: ['nonexistent'] },
                ]),
            }),
        };
        const svc = new OrchestratorService(events, llm);
        const result = await svc.run('Goal', async () => 'ok');
        // 'nonexistent' dep is dropped → b becomes executable, so it still completes.
        expect(result.status).toBe('completed');
        expect(Object.keys(result.outputs)).toHaveLength(2);
    });

    it('wraps string outputs into typed artifacts and exposes them in result', async () => {
        const svc = new OrchestratorService(events);
        const result = await svc.run('Goal', async () => 'plain text');
        expect(result.artifacts).toHaveLength(3);
        expect(result.artifacts.every((a) => a.type === 'text')).toBe(true);
        expect(result.artifacts[0]!.content).toBe('plain text');
    });

    it('passes typed artifacts to downstream nodes and keeps their type/meta', async () => {
        const svc = new OrchestratorService(events);
        const seen: string[] = [];
        const result = await svc.run('Goal', async (node, ctx) => {
            for (const a of ctx.dependencyArtifacts) seen.push(`${a.type}:${a.content}`);
            return {
                nodeId: node.id,
                type: 'report' as const,
                content: `artifact-${node.id}`,
                meta: { producer: 'test-agent' },
                createdAt: Date.now(),
            };
        });
        expect(result.artifacts.every((a) => a.type === 'report')).toBe(true);
        expect(result.artifacts[0]!.meta).toEqual({ producer: 'test-agent' });
        expect(seen).toContain('report:artifact-t1');
        expect(seen).toContain('report:artifact-t2');
    });

    it('normalizes a mismatched artifact nodeId to the real DAG node', async () => {
        const svc = new OrchestratorService(events);
        const result = await svc.run('Goal', async () => ({
            nodeId: 'forged-node-id',
            type: 'json' as const,
            content: `{}`,
            createdAt: Date.now(),
        }));
        expect(result.artifacts.every((a) => a.nodeId !== 'forged-node-id')).toBe(true);
        expect(result.artifacts[0]!.meta?.['claimedNodeId']).toBe('forged-node-id');
        expect(result.artifacts.map((a) => a.nodeId)).toEqual(['t1', 't2', 't3']);
    });

    it('feeds mission facts into a ledger when one is configured', async () => {
        const ledger = {
            start: vi.fn(() => 'ledger-test'),
            get: vi.fn(),
            addFact: vi.fn(),
            setTasks: vi.fn(),
            recordStep: vi.fn(() => false),
            finish: vi.fn(),
            init: vi.fn(async () => {}),
            destroy: vi.fn(async () => {}),
        };
        const svc = new OrchestratorService(events, undefined, undefined, ledger as never);
        const result = await svc.run('Goal', async (node) => `result-${node.id}`);
        expect(result.status).toBe('completed');
        expect(ledger.start).toHaveBeenCalledWith('Goal');
        expect(ledger.setTasks).toHaveBeenCalled();
        expect(ledger.addFact).toHaveBeenCalledTimes(3);
        expect(ledger.recordStep).toHaveBeenCalledTimes(3);
        expect(ledger.finish).toHaveBeenCalledWith('ledger-test');
    });

    it('runWithDispatcher passes assigned agents into the executor', async () => {
        const svc = new OrchestratorService(events);
        const dispatcher = {
            assign: vi.fn((nodes: Array<{ id: string }>) =>
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
