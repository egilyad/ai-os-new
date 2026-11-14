import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ProjectGraphProjection } from './project-graph-projection';
import { eventBus } from '../../events/event-bus';
import { EVENTS } from '../../events/event-names';

function makeGraphMock() {
    return {
        upsertNode: vi.fn(async (input) => ({ id: `node-${input.kind}`, ...input })),
        link: vi.fn(async (input) => ({ id: 'edge-1', ...input })),
    } as never;
}

describe('ProjectGraphProjection', () => {
    let projection: ProjectGraphProjection;
    let graph: ReturnType<typeof makeGraphMock>;

    beforeEach(() => {
        graph = makeGraphMock();
        projection = new ProjectGraphProjection(graph);
        projection.start();
    });

    it('project node + self-link on PROJECT_CREATED', async () => {
        eventBus.emit(EVENTS.PROJECT_CREATED as never, {
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
        eventBus.emit(EVENTS.TASK_CREATED as never, {
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
        eventBus.emit(EVENTS.PROJECT_DEBATE_STARTED as never, {
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
        eventBus.emit(EVENTS.GRAPH_STARTED as never, {
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

    it('goal node on AUTONOMY_GOAL_CREATED', async () => {
        eventBus.emit(EVENTS.AUTONOMY_GOAL_CREATED as never, {
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
