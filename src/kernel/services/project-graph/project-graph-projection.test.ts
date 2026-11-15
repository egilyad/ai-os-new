import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProjectGraphProjection } from './project-graph-projection';
import { eventBus } from '../../events/event-bus';
import { EVENTS } from '../../events/event-names';

interface MockNodeInput {
    projectId: string;
    kind: string;
    label: string;
    refType?: string;
    refId?: string;
    payload?: Record<string, unknown>;
}

interface MockLinkInput {
    projectId: string;
    from: string;
    to: string;
    relation: string;
}

function makeGraphMock() {
    return {
        upsertNode: vi.fn(async (input: MockNodeInput) => ({ id: `node-${input.kind}`, ...input })),
        link: vi.fn(async (input: MockLinkInput) => ({ id: 'edge-1', ...input })),
    };
}

describe('ProjectGraphProjection', () => {
    let projection: ProjectGraphProjection;
    let graph: ReturnType<typeof makeGraphMock>;

    beforeEach(() => {
        graph = makeGraphMock();
        projection = new ProjectGraphProjection(graph as never);
        projection.start();
    });

    it('project node + self-link on PROJECT_CREATED', async () => {
        eventBus.emit(EVENTS.PROJECT_CREATED, {
            projectId: 'p1',
            name: 'Demo',
            type: 'website',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'project', refId: 'p1' }),
        );
        expect(graph.link).toHaveBeenCalledWith(
            expect.objectContaining({ from: 'p1', to: 'p1', relation: 'contains' }),
        );
    });

    it('task node + agent edge on TASK_CREATED', async () => {
        eventBus.emit(EVENTS.TASK_CREATED, {
            taskId: 't1',
            title: 'Write docs',
            projectId: 'p1',
            assigneeId: 'agent-x',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'task', refId: 't1' }),
        );
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'agent', refId: 'agent-x' }),
        );
        expect(graph.link).toHaveBeenCalledWith(
            expect.objectContaining({ relation: 'assigned_to' }),
        );
    });

    it('debate node on PROJECT_DEBATE_STARTED', async () => {
        eventBus.emit(EVENTS.PROJECT_DEBATE_STARTED, {
            projectId: 'p1',
            debateId: 'd1',
            decision: 'choose-stack',
            trigger: 'manual',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'debate', refId: 'd1' }),
        );
        expect(graph.link).toHaveBeenCalledWith(
            expect.objectContaining({ from: 'p1', relation: 'contains' }),
        );
    });

    it('subgraph node on GRAPH_STARTED', async () => {
        eventBus.emit(EVENTS.GRAPH_STARTED, {
            runId: 'r1',
            graphId: 'g1',
            projectId: 'p1',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'subgraph', refId: 'r1' }),
        );
        expect(graph.link).toHaveBeenCalledWith(
            expect.objectContaining({ from: 'p1', relation: 'contains' }),
        );
    });

    it('junction node on JUNCTION_DETECTED', async () => {
        eventBus.emit(EVENTS.JUNCTION_DETECTED, {
            junctionId: 'j1',
            synthesisType: 'contradiction',
            confidence: 0.8,
            inputs: ['a', 'b'],
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'research',
                refId: 'j1',
                projectId: '__junction__',
            }),
        );
        expect(graph.link).toHaveBeenCalledWith(
            expect.objectContaining({ from: '__junction__', relation: 'contains' }),
        );
    });

    it('graph step node on GRAPH_NODE after GRAPH_STARTED', async () => {
        eventBus.emit(EVENTS.GRAPH_STARTED, {
            runId: 'r1',
            graphId: 'g1',
            projectId: 'p1',
        });
        await new Promise((r) => setTimeout(r, 30));
        eventBus.emit(EVENTS.GRAPH_NODE, {
            runId: 'r1',
            nodeId: 'n-exec',
            kind: 'task',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'task', refId: 'n-exec' }),
        );
        expect(graph.link).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'node-subgraph',
                to: 'node-task',
                relation: 'contains',
            }),
        );
    });

    it('goal node on AUTONOMY_GOAL_CREATED', async () => {
        eventBus.emit(EVENTS.AUTONOMY_GOAL_CREATED, {
            projectId: 'p1',
            goalId: 'g1',
            description: 'Ship v2',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(graph.upsertNode).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'goal', refId: 'g1' }),
        );
    });

    afterEach(() => {
        projection.stop();
    });
});
