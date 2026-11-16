import type {
    ProjectGraphNode,
    ProjectGraphEdge,
    ProjectGraphRelation,
    ProjectGraphNodeKind,
} from '../../types/project-types';
import { ProjectGraphRepository } from './project-graph-repository';
import { projectGraphId } from './project-graph-dexie';

export interface AddNodeInput {
    projectId: string;
    kind: ProjectGraphNodeKind;
    label: string;
    refType?: string;
    refId?: string;
    payload?: Record<string, unknown>;
}

export interface AddEdgeInput {
    projectId: string;
    from: string;
    to: string;
    relation: ProjectGraphRelation;
    weight?: number;
    label?: string;
    validFrom?: number;
    validTo?: number;
}

/**
 * ProjectGraphService — Universal project graph (entity-relationship).
 * Wraps ProjectGraphRepository with domain operations: upsert by ref, linking,
 * neighbors and multi-hop traversal.
 */
export class ProjectGraphService {
    constructor(private repo: ProjectGraphRepository = new ProjectGraphRepository()) {}

    async upsertNode(input: AddNodeInput): Promise<ProjectGraphNode> {
        const existing = await this.repo.listNodes({
            projectId: input.projectId,
            kind: input.kind,
            refType: input.refType,
            refId: input.refId,
        });
        if (existing.length > 0) {
            const prev = existing[0]!;
            const updated: ProjectGraphNode = {
                ...prev,
                label: input.label,
                payload: input.payload ?? prev.payload,
                updatedAt: Date.now(),
            };
            await this.repo.putNode(updated);
            return updated;
        }
        const now = Date.now();
        const node: ProjectGraphNode = {
            id: projectGraphId('pgn'),
            projectId: input.projectId,
            kind: input.kind,
            label: input.label,
            refType: input.refType,
            refId: input.refId,
            payload: input.payload,
            createdAt: now,
            updatedAt: now,
        };
        await this.repo.putNode(node);
        return node;
    }

    async link(input: AddEdgeInput): Promise<ProjectGraphEdge | undefined> {
        const edges = await this.repo.listEdges(input.projectId);
        const dup = edges.find(
            (e) => e.from === input.from && e.to === input.to && e.relation === input.relation,
        );
        if (dup) return dup;
        const edge: ProjectGraphEdge = {
            id: projectGraphId('pge'),
            projectId: input.projectId,
            from: input.from,
            to: input.to,
            relation: input.relation,
            weight: input.weight ?? 1,
            label: input.label,
            validFrom: input.validFrom,
            validTo: input.validTo,
            createdAt: Date.now(),
        };
        await this.repo.putEdge(edge);
        return edge;
    }

    async neighbors(
        projectId: string,
        nodeId: string,
    ): Promise<{ node: ProjectGraphNode; edges: ProjectGraphEdge[] }[]> {
        const allEdges = await this.repo.listEdges(projectId);
        const incident = allEdges.filter((e) => e.from === nodeId || e.to === nodeId);
        const result: { node: ProjectGraphNode; edges: ProjectGraphEdge[] }[] = [];
        for (const e of incident) {
            const otherId = e.from === nodeId ? e.to : e.from;
            const node = await this.repo.getNode(otherId);
            if (node) result.push({ node, edges: [e] });
        }
        return result;
    }

    async findByRelation(
        projectId: string,
        relation: ProjectGraphRelation,
    ): Promise<ProjectGraphEdge[]> {
        const edges = await this.repo.listEdges(projectId);
        return edges.filter((e) => e.relation === relation);
    }

    async traverse(projectId: string, startId: string, depth = 2): Promise<ProjectGraphNode[]> {
        const visited = new Set<string>([startId]);
        const level = [startId];
        const out: ProjectGraphNode[] = [];
        const startNode = await this.repo.getNode(startId);
        if (startNode) out.push(startNode);
        for (let d = 0; d < depth; d++) {
            const next: string[] = [];
            for (const id of level) {
                const nbrs = await this.neighbors(projectId, id);
                for (const { node } of nbrs) {
                    if (!visited.has(node.id)) {
                        visited.add(node.id);
                        out.push(node);
                        next.push(node.id);
                    }
                }
            }
            if (next.length === 0) break;
            level.length = 0;
            level.push(...next);
        }
        return out;
    }

    /**
     * F6 — Knowledge Potential Graph: nodes are born as 'proposed'
     * (hypothesis), get validated into 'active', then may be 'superseded'.
     */
    async proposeNode(input: AddNodeInput, confidence = 0.5): Promise<ProjectGraphNode> {
        const node = await this.upsertNode(input);
        const updated: ProjectGraphNode = {
            ...node,
            status: node.status ?? 'proposed',
            confidence: node.confidence ?? confidence,
            updatedAt: Date.now(),
        };
        await this.repo.putNode(updated);
        return updated;
    }

    async activateNode(nodeId: string): Promise<ProjectGraphNode | undefined> {
        return this.setNodeStatus(nodeId, 'active');
    }

    async supersedeNode(nodeId: string): Promise<ProjectGraphNode | undefined> {
        return this.setNodeStatus(nodeId, 'superseded');
    }

    private async setNodeStatus(
        nodeId: string,
        status: NonNullable<ProjectGraphNode['status']>,
    ): Promise<ProjectGraphNode | undefined> {
        const node = await this.repo.getNode(nodeId);
        if (!node) return undefined;
        const updated = { ...node, status, updatedAt: Date.now() };
        await this.repo.putNode(updated);
        return updated;
    }

    /** F6 — everything that is proposed (knowledge potential), with incident edges. */
    async listPotential(
        projectId: string,
    ): Promise<Array<{ node: ProjectGraphNode; edges: ProjectGraphEdge[] }>> {
        const [nodes, edges] = await Promise.all([
            this.repo.listNodes({ projectId }),
            this.repo.listEdges(projectId),
        ]);
        return nodes
            .filter((n) => n.status === 'proposed')
            .map((node) => ({
                node,
                edges: edges.filter((e) => e.from === node.id || e.to === node.id),
            }));
    }

    async promoteEdge(edgeId: string): Promise<ProjectGraphEdge | undefined> {
        const edge = (await this.repo.listEdges()).find((e) => e.id === edgeId);
        if (!edge) return undefined;
        const updated = { ...edge, status: 'active' as const, updatedAt: Date.now() };
        await this.repo.putEdge(updated);
        return updated;
    }

    /** Полностью очистить граф проекта (узлы и рёбра с данным projectId). */
    async clearProject(projectId: string): Promise<void> {
        await this.repo.clearProject(projectId);
    }

    async listProject(
        projectId: string,
    ): Promise<{ nodes: ProjectGraphNode[]; edges: ProjectGraphEdge[] }> {
        const [nodes, edges] = await Promise.all([
            this.repo.listNodes({ projectId }),
            this.repo.listEdges(projectId),
        ]);
        return { nodes, edges };
    }
}
