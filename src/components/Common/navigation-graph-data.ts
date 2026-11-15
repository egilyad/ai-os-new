import { NAV_SECTIONS } from '../../route-registry';
import type { ProjectGraphNode, ProjectGraphEdge } from '../../kernel/types/project-types';

export function buildNavigationGraphData(t: (key: string) => string): {
    nodes: ProjectGraphNode[];
    edges: ProjectGraphEdge[];
} {
    const nodes: ProjectGraphNode[] = [];
    const edges: ProjectGraphEdge[] = [];
    const now = Date.now();

    NAV_SECTIONS.forEach((section) => {
        const sectionNodeId = `section:${section.id}`;
        nodes.push({
            id: sectionNodeId,
            projectId: '',
            kind: 'subgraph',
            label: t(section.labelKey),
            createdAt: now,
            updatedAt: now,
        });

        for (const item of section.items) {
            const nodeId = `nav:${item.id}`;
            nodes.push({
                id: nodeId,
                projectId: '',
                kind: 'document',
                label: t(item.labelKey),
                refType: 'nav-item',
                refId: item.id,
                createdAt: now,
                updatedAt: now,
            });
            edges.push({
                id: `e:${section.id}:${item.id}`,
                projectId: '',
                from: nodeId,
                to: sectionNodeId,
                relation: 'contains',
                weight: 1,
                createdAt: now,
            });
        }
    });

    return { nodes, edges };
}

export const NAV_GRAPH_SOURCE = 'navigation';
