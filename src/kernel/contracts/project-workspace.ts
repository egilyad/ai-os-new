/**
 * ProjectWorkspace contract (roadmapp.md §P2).
 *
 * Virtual file system backed by Dexie, scoped to a project.
 * All paths are project-relative (e.g. '/src/index.html').
 */
import type {
    WorkspaceFile,
    WorkspaceTreeEntry,
    WorkspaceSearchMatch,
    WorkspaceEdit,
} from '../types/workspace-types';

export interface IProjectWorkspaceService {
    /** Initialize workspace for a project (creates root dir) */
    init(projectId: string): Promise<void>;

    /** Create a new file (or overwrite if exists) */
    writeFile(projectId: string, path: string, content: string, agentId?: string): Promise<WorkspaceFile>;

    /** Read file content */
    readFile(projectId: string, path: string): Promise<WorkspaceFile | undefined>;

    /** Edit file using line-range operations */
    editFile(projectId: string, path: string, edits: WorkspaceEdit[], agentId?: string): Promise<WorkspaceFile>;

    /** Delete a file */
    deleteFile(projectId: string, path: string): Promise<void>;

    /** List directory contents */
    listDir(projectId: string, dirPath?: string): Promise<WorkspaceTreeEntry[]>;

    /** Get full file tree */
    getTree(projectId: string, maxDepth?: number): Promise<WorkspaceTreeEntry[]>;

    /** Search files by name pattern (glob-like) */
    searchFiles(projectId: string, pattern: string): Promise<string[]>;

    /** Search file contents by regex */
    grepContent(projectId: string, pattern: string, rootDir?: string): Promise<WorkspaceSearchMatch[]>;

    /** Get file change history for undo */
    getHistory(projectId: string, path?: string): Promise<import('../types/workspace-types').WorkspaceFileChange[]>;

    /** Copy file */
    copyFile(projectId: string, from: string, to: string): Promise<WorkspaceFile>;

    /** Move/rename file */
    moveFile(projectId: string, from: string, to: string): Promise<void>;

    /** Create directory (recursive) */
    mkdir(projectId: string, dirPath: string): Promise<void>;

    /** Delete directory (recursive) */
    rmdir(projectId: string, dirPath: string): Promise<void>;
}
