import type { ProjectGraphNode, ProjectGraphEdge } from '../../types/project-types';
import { getProjectGraphDB } from './project-graph-dexie';

export interface ProjectGraphFilters {
    projectId?: string;
    kind?: ProjectGraphNode['kind'];
    refType?: string;
    refId?: string;
}

export class ProjectGraphRepository {
    async putNode(node: ProjectGraphNode): Promise<void> {
        await getProjectGraphDB().nodes.put(node as never);
    }

    async getNode(id: string): Promise<ProjectGraphNode | undefined> {
        return (await getProjectGraphDB().nodes.get(id)) as unknown as ProjectGraphNode | undefined;
    }

    async listNodes(filters: ProjectGraphFilters = {}): Promise<ProjectGraphNode[]> {
        let rows: ProjectGraphNode[];
        if (filters.projectId) {
            rows = (await getProjectGraphDB()
                .nodes.where('projectId')
                .equals(filters.projectId)
                .toArray()) as unknown as ProjectGraphNode[];
        } else {
            rows = (await getProjectGraphDB().nodes.toArray()) as unknown as ProjectGraphNode[];
        }
        if (filters.kind) rows = rows.filter((n) => n.kind === filters.kind);
        if (filters.refType) rows = rows.filter((n) => n.refType === filters.refType);
        if (filters.refId) rows = rows.filter((n) => n.refId === filters.refId);
        return rows.sort((a, b) => a.createdAt - b.createdAt);
    }

    async removeNode(id: string): Promise<void> {
        const db = getProjectGraphDB();
        await db.nodes.delete(id);
        await db.edges.where('from').equals(id).delete();
        await db.edges.where('to').equals(id).delete();
    }

    /** Полностью очистить граф проекта (узлы и рёбра с данным projectId). */
    async clearProject(projectId: string): Promise<void> {
        const db = getProjectGraphDB();
        await db.nodes.where('projectId').equals(projectId).delete();
        await db.edges.where('projectId').equals(projectId).delete();
    }

    async putEdge(edge: ProjectGraphEdge): Promise<void> {
        await getProjectGraphDB().edges.put(edge as never);
    }

    async getEdge(id: string): Promise<ProjectGraphEdge | undefined> {
        return (await getProjectGraphDB().edges.get(id)) as unknown as ProjectGraphEdge | undefined;
    }

    async listEdges(projectId?: string): Promise<ProjectGraphEdge[]> {
        let rows: ProjectGraphEdge[];
        if (projectId) {
            rows = (await getProjectGraphDB()
                .edges.where('projectId')
                .equals(projectId)
                .toArray()) as unknown as ProjectGraphEdge[];
        } else {
            rows = (await getProjectGraphDB().edges.toArray()) as unknown as ProjectGraphEdge[];
        }
        return rows.sort((a, b) => a.createdAt - b.createdAt);
    }

    async listEdgesTo(nodeId: string, projectId?: string): Promise<ProjectGraphEdge[]> {
        const all = await this.listEdges(projectId);
        return all.filter((e) => e.to === nodeId || e.from === nodeId);
    }

    async removeEdge(id: string): Promise<void> {
        await getProjectGraphDB().edges.delete(id);
    }
}
