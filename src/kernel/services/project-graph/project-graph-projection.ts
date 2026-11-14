import { eventBus } from '../../events/event-bus';
import { EVENTS } from '../../events/event-names';
import type { ProjectGraphService } from './project-graph-service';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ProjectGraphProjection');

/**
 * ProjectGraphProjection — event-driven wiring of the universal project graph.
 * Subscribes to domain events and upserts nodes/edges so the graph stays a
 * live read-model of the system (projects, tasks, agents, wiki pages).
 */
export class ProjectGraphProjection {
    private unsubscribe: Array<() => void> = [];

    constructor(private graph: ProjectGraphService) {}

    start(): void {
        if (this.unsubscribe.length > 0) return;

        this.unsubscribe.push(
            eventBus.on(EVENTS.PROJECT_CREATED as never, (d) => {
                const data = d as { id?: string; name?: string };
                if (!data.id) return;
                void this.graph
                    .upsertNode({
                        projectId: data.id,
                        kind: 'project',
                        label: data.name ?? data.id,
                        refType: 'project',
                        refId: data.id,
                    })
                    .then(() =>
                        this.graph.link({
                            projectId: data.id!,
                            from: data.id!,
                            to: data.id!,
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
            eventBus.on(EVENTS.WIKI_PAGE_WRITTEN as never, (d) => {
                const data = d as { pageId?: string; slug?: string; projectId?: string };
                if (!data.pageId || !data.projectId) return;
                void (async () => {
                    try {
                        const pageNode = await this.graph.upsertNode({
                            projectId: data.projectId!,
                            kind: 'knowledge',
                            label: data.slug ?? data.pageId!,
                            refType: 'wiki-page',
                            refId: data.pageId,
                        });
                        await this.graph.link({
                            projectId: data.projectId!,
                            from: data.projectId!,
                            to: pageNode.id,
                            relation: 'contains',
                        });
                    } catch (e) {
                        LOGGER.warn('ProjectGraphProjection', 'wiki node failed', { error: e });
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
