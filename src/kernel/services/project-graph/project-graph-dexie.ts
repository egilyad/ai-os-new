import Dexie, { type Table } from 'dexie';
import type { ProjectGraphNode, ProjectGraphEdge } from '../../types/project-types';

/**
 * ProjectGraphDB — separate Dexie instance for the entity-relationship project
 * graph. Kept apart from the main schema so its versioning never touches the
 * product-wide DB (same pattern as WikiBrain).
 */
export class ProjectGraphDB extends Dexie {
    nodes!: Table<ProjectGraphNode, string>;
    edges!: Table<ProjectGraphEdge, string>;

    constructor(dbName = 'aios-project-graph') {
        super(dbName);
        this.version(1).stores({
            nodes: 'id, projectId, kind, refType, refId, createdAt',
            edges: 'id, projectId, from, to, relation, validFrom, validTo, createdAt, [from+to]',
        });
    }
}

let _db: ProjectGraphDB | undefined;

export function createProjectGraphDB(dbName = 'aios-project-graph'): ProjectGraphDB {
    if (!_db) _db = new ProjectGraphDB(dbName);
    return _db;
}

export function getProjectGraphDB(): ProjectGraphDB {
    if (!_db) throw new Error('ProjectGraphDB not initialized — call createProjectGraphDB() first');
    return _db;
}

export function projectGraphId(prefix: string): string {
    const uuid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${uuid}`;
}
