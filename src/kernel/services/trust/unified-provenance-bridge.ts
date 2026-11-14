import { eventBus } from '../../events/event-bus';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
import type { IProvenanceService } from '../../contracts/trust';
import type { ProvenanceNodeKind, ProvenanceEdgeRelation } from '../../types/trust-types';

const LOGGER = rootLogger.child('UnifiedProvenanceBridge');

export interface UnifiedProvenanceBridgeDeps {
    provenance: IProvenanceService;
}

interface PendingNode {
    kind: ProvenanceNodeKind;
    label: string;
    ref: string;
}

/**
 * UnifiedProvenanceBridge — F3-unify: mirrors domain events into the
 * provenance backbone (ProvenanceService) using the unified node/edge
 * taxonomies. This makes the project graph's read-model backed by temporal
 * provenance records (derived_from / contains / assigned_to ...).
 */
export class UnifiedProvenanceBridge {
    private nodeIds = new Map<string, string>();
    private unsubscribe: Array<() => void> = [];

    constructor(private deps: UnifiedProvenanceBridgeDeps) {}

    start(): void {
        if (this.unsubscribe.length > 0) return;
        this.unsubscribe.push(
            eventBus.on(EVENTS.PROJECT_CREATED as never, (d) => {
                const data = d as { projectId?: string; id?: string; name?: string };
                const projectId = data.projectId ?? data.id;
                if (!projectId) return;
                void this.ensure({
                    kind: 'project',
                    label: data.name ?? projectId,
                    ref: `proj:${projectId}`,
                }).catch((e) => LOGGER.warn('bridge', 'project node failed', { error: String(e) }));
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
                        const projectId = await this.ensure({
                            kind: 'project',
                            label: data.projectId!,
                            ref: `proj:${data.projectId}`,
                        });
                        const taskId = await this.ensure({
                            kind: 'task',
                            label: data.title ?? data.taskId!,
                            ref: `pg:${data.taskId}`,
                        });
                        await this.link(projectId, taskId, 'contains');
                        if (data.assigneeId) {
                            const agentId = await this.ensure({
                                kind: 'agent',
                                label: data.assigneeId,
                                ref: `pg:${data.assigneeId}`,
                            });
                            await this.link(taskId, agentId, 'assigned_to');
                        }
                    } catch (e) {
                        LOGGER.warn('bridge', 'task mirror failed', { error: String(e) });
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
                        const projectId = await this.ensure({
                            kind: 'project',
                            label: data.projectId!,
                            ref: `proj:${data.projectId}`,
                        });
                        const pageId = await this.ensure({
                            kind: 'knowledge',
                            label: data.slug ?? data.pageId!,
                            ref: `pg:${data.pageId}`,
                        });
                        await this.link(projectId, pageId, 'contains');
                    } catch (e) {
                        LOGGER.warn('bridge', 'wiki mirror failed', { error: String(e) });
                    }
                })();
            }),
        );

        this.unsubscribe.push(
            eventBus.on(EVENTS.PROJECT_DEBATE_STARTED as never, (d) => {
                const data = d as { projectId?: string; debateId?: string; decision?: string };
                if (!data.projectId || !data.debateId) return;
                void (async () => {
                    try {
                        const projectId = await this.ensure({
                            kind: 'project',
                            label: data.projectId!,
                            ref: `proj:${data.projectId}`,
                        });
                        const debateId = await this.ensure({
                            kind: 'debate',
                            label: data.decision ?? data.debateId!,
                            ref: `pg:${data.debateId}`,
                        });
                        await this.link(projectId, debateId, 'contains');
                    } catch (e) {
                        LOGGER.warn('bridge', 'debate mirror failed', { error: String(e) });
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
                        const projectId = await this.ensure({
                            kind: 'project',
                            label: data.projectId!,
                            ref: `proj:${data.projectId}`,
                        });
                        const goalId = await this.ensure({
                            kind: 'goal',
                            label: data.description ?? data.goalId!,
                            ref: `pg:${data.goalId}`,
                        });
                        await this.link(projectId, goalId, 'contains');
                    } catch (e) {
                        LOGGER.warn('bridge', 'goal mirror failed', { error: String(e) });
                    }
                })();
            }),
        );
    }

    private async ensure(node: PendingNode): Promise<string> {
        const existing = this.nodeIds.get(node.ref);
        if (existing) return existing;
        const created = await this.deps.provenance.addNode(node.kind, node.label, node.ref);
        this.nodeIds.set(node.ref, created.id);
        return created.id;
    }

    private async link(
        fromId: string,
        toId: string,
        relation: ProvenanceEdgeRelation,
    ): Promise<void> {
        await this.deps.provenance.link(fromId, toId, relation);
    }

    /** Resolve a previously mirrored node id by its graph ref. */
    nodeIdOf(ref: string): string | undefined {
        return this.nodeIds.get(ref);
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
        this.nodeIds.clear();
    }

    destroy(): void {
        this.stop();
    }
}
