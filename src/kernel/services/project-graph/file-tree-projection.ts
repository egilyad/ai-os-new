import type { ProjectGraphService } from './project-graph-service';
import type { ProjectGraphNodeKind } from '../../types/project-types';

export function fileKindFromPath(path: string): { kind: ProjectGraphNodeKind; label: string } {
    const segments = path.split('/').filter(Boolean);
    const name = segments[segments.length - 1] ?? path;
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'html') return { kind: 'website', label: name };
    if (ext === 'md') {
        if (name.toLowerCase() === 'readme.md') return { kind: 'concept', label: name };
        return { kind: 'knowledge', label: name };
    }
    return { kind: 'artifact', label: name };
}

/**
 * Строит (или дополняет) дерево файловой структуры проекта в графе:
 * проект → папки → подпапки → файл. Идемпотентно: существующие узлы/ребра
 * не дублируются (upsert по refId + дедупликация link).
 */
export async function ensureFilePathTree(
    graph: Pick<ProjectGraphService, 'upsertNode' | 'link'>,
    projectId: string,
    path: string,
    opts: { rootId?: string } = {},
): Promise<{ fileNodeId: string; parentId: string }> {
    const segments = path.split('/').filter(Boolean);
    let parentId = opts.rootId ?? projectId;

    // Промежуточные папки.
    for (let i = 0; i < segments.length - 1; i++) {
        const dirPath = segments.slice(0, i + 1).join('/');
        const dirNode = await graph.upsertNode({
            projectId,
            kind: 'subgraph',
            label: segments[i]!,
            refType: 'project-dir',
            refId: dirPath,
        });
        if (dirNode.id !== parentId) {
            await graph.link({
                projectId,
                from: parentId,
                to: dirNode.id,
                relation: 'contains',
            });
        }
        parentId = dirNode.id;
    }

    // Файл: узел + связь с непосредственным родителем.
    const file = fileKindFromPath(path);
    const fileNode = await graph.upsertNode({
        projectId,
        kind: file.kind,
        label: file.label,
        refType: 'project-file',
        refId: path,
    });
    await graph.link({
        projectId,
        from: parentId,
        to: fileNode.id,
        relation: 'contains',
    });

    return { fileNodeId: fileNode.id, parentId };
}
