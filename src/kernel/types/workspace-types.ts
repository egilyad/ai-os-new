/**
 * Workspace domain types (roadmapp.md §P2).
 *
 * A Workspace wraps a project's virtual file system on Dexie/IndexedDB.
 * Provides create/read/write/edit/list operations.
 */

export type WorkspaceId = string;

export interface WorkspaceFile {
    /** Project-scoped path (e.g. '/src/index.html') */
    path: string;
    content: string;
    /** MIME type (inferred from extension) */
    mime: string;
    size: number;
    createdAt: number;
    updatedAt: number;
}

export interface WorkspaceDir {
    path: string;
    children: string[]; // child names
    createdAt: number;
}

export interface WorkspaceTreeEntry {
    path: string;
    type: 'file' | 'dir';
    size?: number;
    children?: WorkspaceTreeEntry[];
}

export interface WorkspaceSearchMatch {
    path: string;
    line: number;
    content: string;
}

// ── Edit operation ──

export type EditKind = 'replace' | 'insert' | 'delete';

export interface WorkspaceEdit {
    kind: EditKind;
    /** Line range (1-indexed, inclusive) */
    startLine: number;
    endLine?: number;
    /** New content for replace/insert */
    content?: string;
}

// ── Create input ──

export interface CreateWorkspaceInput {
    projectId: string;
    name?: string;
}

// ── File change record for undo ──

export interface WorkspaceFileChange {
    path: string;
    before?: string; // content before edit (null for create)
    after?: string;  // content after edit (null for delete)
    timestamp: number;
    agentId?: string;
    taskId?: string;
}
