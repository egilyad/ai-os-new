import { eventBus } from '../../events/event-bus';
import { EVENTS } from '../../events/event-names';
import type { ProjectGraphService } from './project-graph-service';
import { rootLogger } from '../logger-service';
import { ensureFilePathTree } from './file-tree-projection';
import { OPENCODE_INFO_PROJECT_ID } from '../project-bootstrap';

const LOGGER = rootLogger.child('ProjectGraphProjection');

/**
 * ProjectGraphProjection — event-driven wiring of the universal project graph.
 * Subscribes to domain events and upserts nodes/edges so the graph stays a
 * live read-model of the system (projects, tasks, agents, wiki pages).
 */
export class ProjectGraphProjection {
    private unsubscribe: Array<() => void> = [];
    private runIndex = new Map<string, { projectId: string; nodeId: string }>();

    constructor(private graph: ProjectGraphService) {}

    start(): void {
        if (this.unsubscribe.length > 0) return;

        this.unsubscribe.push(
            eventBus.on(EVENTS.PROJECT_CREATED as never, (d) => {
                const data = d as { projectId?: string; id?: string; name?: string };
                const projectId = data.projectId ?? data.id;
                if (!projectId) return;
                void this.graph
                    .upsertNode({
                        projectId,
                        kind: 'project',
                        label: data.name ?? projectId,
                        refType: 'project',
                        refId: projectId,
                    })
                    .then(() =>
                        this.graph.link({
                            projectId,
                            from: projectId,
                            to: projectId,
                            relation: 'contains',
                        }),
                    )
                    .catch((e) =>
                        LOGGER.warn('ProjectGraphProjection', 'project node failed', { error: e }),
                    );
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.TASK_CREATED as never, (d) => {
                const data = d as {
                    taskId?: string;
                    title?: string;
                    projectId?: string;
                    assigneeId?: string;
                };
                if (!data.taskId || !data.projectId) return;
                void (async () => {
                    try {
                        const taskNode = await this.graph.upsertNode({
                            projectId: data.projectId!,
                            kind: 'task',
                            label: data.title ?? data.taskId!,
                            refType: 'task',
                            refId: data.taskId,
                        });
                        await this.graph.link({
                            projectId: data.projectId!,
                            from: data.projectId!,
                            to: taskNode.id,
                            relation: 'contains',
                        });
                        if (data.assigneeId) {
                            const agentNode = await this.graph.upsertNode({
                                projectId: data.projectId!,
                                kind: 'agent',
                                label: data.assigneeId,
                                refType: 'agent',
                                refId: data.assigneeId,
                            });
                            await this.graph.link({
                                projectId: data.projectId!,
                                from: taskNode.id,
                                to: agentNode.id,
                                relation: 'assigned_to',
                            });
                        }
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'task node failed', { error: e });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.PROJECT_DEBATE_STARTED as never, (d) => {
                const data = d as {
                    projectId?: string;
                    debateId?: string;
                    decision?: string;
                };
                if (!data.projectId || !data.debateId) return;
                void (async () => {
                    try {
                        const debateNode = await this.graph.upsertNode({
                            projectId: data.projectId!,
                            kind: 'debate',
                            label: data.decision ?? data.debateId!,
                            refType: 'debate',
                            refId: data.debateId,
                        });
                        await this.graph.link({
                            projectId: data.projectId!,
                            from: data.projectId!,
                            to: debateNode.id,
                            relation: 'contains',
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'debate node failed', { error: e });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.AUTONOMY_GOAL_CREATED as never, (d) => {
                const data = d as { projectId?: string; goalId?: string; description?: string };
                if (!data.projectId || !data.goalId) return;
                void (async () => {
                    try {
                        const goalNode = await this.graph.upsertNode({
                            projectId: data.projectId!,
                            kind: 'goal',
                            label: data.description ?? data.goalId!,
                            refType: 'goal',
                            refId: data.goalId,
                        });
                        await this.graph.link({
                            projectId: data.projectId!,
                            from: data.projectId!,
                            to: goalNode.id,
                            relation: 'contains',
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'goal node failed', { error: e });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.GRAPH_STARTED as never, (d) => {
                const data = d as { runId?: string; graphId?: string; projectId?: string };
                if (!data.runId || !data.graphId || !data.projectId) return;
                void (async () => {
                    try {
                        const graphNode = await this.graph.upsertNode({
                            projectId: data.projectId!,
                            kind: 'subgraph',
                            label: data.graphId!,
                            refType: 'graph-run',
                            refId: data.runId,
                        });
                        await this.graph.link({
                            projectId: data.projectId!,
                            from: data.projectId!,
                            to: graphNode.id,
                            relation: 'contains',
                        });
                        this.runIndex.set(data.runId!, {
                            projectId: data.projectId!,
                            nodeId: graphNode.id,
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'graph run node failed', {
                            error: e,
                        });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.GRAPH_NODE as never, (d) => {
                const data = d as { runId?: string; nodeId?: string; kind?: string };
                if (!data.runId || !data.nodeId) return;
                const run = this.runIndex.get(data.runId);
                if (!run) return;
                void (async () => {
                    try {
                        const stepNode = await this.graph.upsertNode({
                            projectId: run.projectId,
                            kind: 'task',
                            label: data.nodeId!,
                            refType: 'graph-node',
                            refId: data.nodeId,
                            payload: data.kind ? { graphKind: data.kind } : undefined,
                        });
                        await this.graph.link({
                            projectId: run.projectId,
                            from: run.nodeId,
                            to: stepNode.id,
                            relation: 'contains',
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'graph node failed', { error: e });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.JUNCTION_DETECTED as never, (d) => {
                const data = d as {
                    junctionId?: string;
                    synthesisType?: string;
                    confidence?: number;
                };
                if (!data.junctionId) return;
                const GLOBAL_JUNCTION_PROJECT = '__junction__';
                void (async () => {
                    try {
                        const junctionNode = await this.graph.upsertNode({
                            projectId: GLOBAL_JUNCTION_PROJECT,
                            kind: 'research',
                            label: data.synthesisType ?? data.junctionId!,
                            refType: 'junction',
                            refId: data.junctionId,
                            payload:
                                data.confidence != null
                                    ? { confidence: data.confidence }
                                    : undefined,
                        });
                        await this.graph.link({
                            projectId: GLOBAL_JUNCTION_PROJECT,
                            from: GLOBAL_JUNCTION_PROJECT,
                            to: junctionNode.id,
                            relation: 'contains',
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'junction node failed', { error: e });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.WIKI_PAGE_WRITTEN as never, (d) => {
                const data = d as { pageId?: string; slug?: string; projectId?: string };
                if (!data.pageId || !data.projectId) return;
                const pid = data.projectId;
                void (async () => {
                    try {
                        const pageNode = await this.graph.upsertNode({
                            projectId: pid,
                            kind: 'knowledge',
                            label: data.slug ?? data.pageId!,
                            refType: 'wiki-page',
                            refId: data.pageId,
                        });
                        await this.graph.link({
                            projectId: pid,
                            from: pid,
                            to: pageNode.id,
                            relation: 'contains',
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'wiki node failed', { error: e });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on('workspace:file:written' as never, (d) => {
                const data = d as { projectId?: string; path?: string; size?: number };
                if (!data.projectId || !data.path) return;
                const path = String(data.path);
                void (async () => {
                    try {
                        // Если у проекта есть центр (README.md), строим дерево от
                        // него; иначе — от узла проекта.
                        const { nodes } = await this.graph.listProject(data.projectId!);
                        const center = nodes.find(
                            (n) =>
                                n.refType === 'project-file' &&
                                (n.refId ?? '').toLowerCase() === 'readme.md',
                        );
                        await ensureFilePathTree(this.graph, data.projectId!, path, {
                            rootId: center?.id,
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'file tree failed', { error: e });
                    }
                })();
            }),
        );

        LOGGER.info('ProjectGraphProjection', 'started', {});
    }

    stop(): void {
        for (const off of this.unsubscribe) {
            try {
                off();
            } catch {
                /* ignore */
            }
        }
        this.unsubscribe = [];
    }

    destroy(): void {
        this.stop();
    }
}
