/**
 * ProjectWorkspaceService — virtual file system on Dexie, scoped to a project.
 *
 * All paths are project-relative (e.g. '/src/index.html').
 * Directory structure is derived from file paths (no separate dir table).
 * File history is tracked for undo.
 */
import type { IProjectWorkspaceService } from '../contracts/project-workspace';
import type {
    WorkspaceFile,
    WorkspaceTreeEntry,
    WorkspaceSearchMatch,
    WorkspaceEdit,
    WorkspaceFileChange,
} from '../types/workspace-types';
import type { DatabaseService } from './database-service';
import type { IEventBus } from '../types/interfaces';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProjectWorkspaceService');

const MIME_MAP: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'text/tsx',
    '.jsx': 'text/jsx',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.py': 'text/x-python',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function inferMime(path: string): string {
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    return MIME_MAP[ext] || 'application/octet-stream';
}

function normalizePath(p: string): string {
    if (!p.startsWith('/')) p = '/' + p;
    // Remove trailing slash except root
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    // Collapse double slashes
    return p.replace(/\/+/g, '/');
}

function parentDir(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
}

function fileToRecord(file: WorkspaceFile, projectId: string): any {
    return { ...file, projectId };
}

function recordToFile(record: any): WorkspaceFile {
    return {
        path: record.path,
        content: record.content,
        mime: record.mime,
        size: record.size,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

export class ProjectWorkspaceService implements IProjectWorkspaceService {
    private db: DatabaseService;
    private eventBus?: IEventBus;

    constructor(db: DatabaseService, eventBus?: IEventBus) {
        this.db = db;
        this.eventBus = eventBus;
    }

    async init(projectId: string): Promise<void> {
        // Create root directory marker (implicit — files create dirs automatically)
        this.emit('workspace:initialized', { projectId });
    }

    // ── Write ──

    async writeFile(projectId: string, path: string, content: string, agentId?: string): Promise<WorkspaceFile> {
        const normalized = normalizePath(path);
        const now = Date.now();
        const existing = await this.db.projectFiles.get([projectId, normalized] as any);

        const file: WorkspaceFile = {
            path: normalized,
            content,
            mime: inferMime(normalized),
            size: new TextEncoder().encode(content).byteLength,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };

        // Record change for undo
        await this.recordChange(projectId, {
            path: normalized,
            before: existing?.content,
            after: content,
            timestamp: now,
            agentId,
        });

        await this.db.projectFiles.put(fileToRecord(file, projectId) as any);
        this.emit('workspace:file:written', { projectId, path: normalized, size: file.size });
        return file;
    }

    // ── Read ──

    async readFile(projectId: string, path: string): Promise<WorkspaceFile | undefined> {
        const normalized = normalizePath(path);
        const record = await this.db.projectFiles.get([projectId, normalized] as any);
        return record ? recordToFile(record) : undefined;
    }

    // ── Edit (line-range operations) ──

    async editFile(projectId: string, path: string, edits: WorkspaceEdit[], agentId?: string): Promise<WorkspaceFile> {
        const normalized = normalizePath(path);
        const existing = await this.readFile(projectId, normalized);
        if (!existing) throw new Error(`File not found: ${normalized}`);

        const lines = existing.content.split('\n');
        // Sort edits by startLine descending to avoid offset issues
        const sorted = [...edits].sort((a, b) => b.startLine - a.startLine);

        for (const edit of sorted) {
            const start = Math.max(0, edit.startLine - 1); // 1-indexed → 0-indexed
            const end = edit.endLine ? Math.max(start, edit.endLine - 1) : start;

            switch (edit.kind) {
                case 'replace':
                    lines.splice(start, end - start + 1, ...(edit.content?.split('\n') ?? []));
                    break;
                case 'insert':
                    lines.splice(start, 0, ...(edit.content?.split('\n') ?? []));
                    break;
                case 'delete':
                    lines.splice(start, end - start + 1);
                    break;
            }
        }

        const newContent = lines.join('\n');
        return this.writeFile(projectId, normalized, newContent, agentId);
    }

    // ── Delete ──

    async deleteFile(projectId: string, path: string): Promise<void> {
        const normalized = normalizePath(path);
        const existing = await this.readFile(projectId, normalized);

        await this.recordChange(projectId, {
            path: normalized,
            before: existing?.content,
            after: undefined,
            timestamp: Date.now(),
        });

        await this.db.projectFiles.delete([projectId, normalized] as any);
        this.emit('workspace:file:deleted', { projectId, path: normalized });
    }

    // ── List directory ──

    async listDir(projectId: string, dirPath?: string): Promise<WorkspaceTreeEntry[]> {
        const dir = normalizePath(dirPath ?? '/');
        const allFiles = await this.db.projectFiles.where('projectId').equals(projectId).toArray();
        const entries = new Map<string, WorkspaceTreeEntry>();

        // Ensure the target directory exists
        entries.set(dir, { path: dir, type: 'dir', children: [] });

        for (const record of allFiles) {
            const filePath = normalizePath(record.path);
            const fileDir = parentDir(filePath);

            // Ensure parent directories exist
            let current = fileDir;
            while (current !== '/') {
                if (!entries.has(current)) {
                    entries.set(current, { path: current, type: 'dir', children: [] });
                }
                current = parentDir(current);
            }
            if (!entries.has('/')) {
                entries.set('/', { path: '/', type: 'dir', children: [] });
            }

            // Add file entry to its parent
            const fileName = filePath.split('/').pop()!;
            if (fileDir === dir) {
                entries.get(dir)!.children!.push(fileName);
            }

            // If the file is in the target dir, add it to results
            if (filePath.startsWith(dir === '/' ? '/' : dir + '/')) {
                const relativePath = filePath.substring(dir.length).replace(/^\//, '');
                // Only show direct children (one level)
                if (!relativePath.includes('/')) {
                    entries.set(filePath, {
                        path: filePath,
                        type: 'file',
                        size: record.size,
                    });
                }
            }
        }

        const dirEntry = entries.get(dir);
        if (!dirEntry) return [];

        const result: WorkspaceTreeEntry[] = [];
        if (dirEntry.children) {
            for (const childName of dirEntry.children) {
                const childPath = dir === '/' ? `/${childName}` : `${dir}/${childName}`;
                const childEntry = entries.get(childPath);
                if (childEntry) {
                    result.push(childEntry);
                } else {
                    result.push({ path: childPath, type: 'file' });
                }
            }
        }

        // Also add subdirectories
        for (const [key, entry] of entries) {
            if (entry.type === 'dir' && key !== dir) {
                const rel = key.substring(dir.length).replace(/^\//, '');
                if (dir === '/' || (key.startsWith(dir + '/') && !rel.includes('/'))) {
                    if (!result.find((r) => r.path === key)) {
                        result.push({ ...entry, children: undefined });
                    }
                }
            }
        }

        return result.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.path.localeCompare(b.path);
        });
    }

    // ── Full tree ──

    async getTree(projectId: string, maxDepth = 10): Promise<WorkspaceTreeEntry[]> {
        const allFiles = await this.db.projectFiles.where('projectId').equals(projectId).toArray();
        const dirs = new Map<string, WorkspaceTreeEntry>();

        dirs.set('/', { path: '/', type: 'dir', children: [] });

        for (const record of allFiles) {
            const filePath = normalizePath(record.path);
            const parts = filePath.split('/').filter(Boolean);

            // Ensure all parent dirs exist and are registered
            let current = '';
            for (let i = 0; i < parts.length - 1; i++) {
                current += '/' + parts[i];
                if (!dirs.has(current)) {
                    dirs.set(current, { path: current, type: 'dir', children: [] });
                }
                // Register this dir as child of its parent
                const parPath = i === 0 ? '/' : current.substring(0, current.lastIndexOf('/')) || '/';
                const par = dirs.get(parPath);
                if (par && par.children && !par.children.includes(parts[i])) {
                    par.children.push(parts[i]);
                }
            }

            // Add file to its parent
            const parentPath = parentDir(filePath);
            const parent = dirs.get(parentPath);
            if (parent && parent.children) {
                const fileName = parts[parts.length - 1];
                if (!parent.children.includes(fileName)) {
                    parent.children.push(fileName);
                }
            }
        }

        const buildTree = (dirPath: string, depth: number): WorkspaceTreeEntry[] => {
            if (depth >= maxDepth) return [];
            const dir = dirs.get(dirPath);
            if (!dir || !dir.children) return [];

            return dir.children
                .sort()
                .map((name) => {
                    const childPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;
                    const childDir = dirs.get(childPath);
                    if (childDir) {
                        return {
                            path: childPath,
                            type: 'dir' as const,
                            children: buildTree(childPath, depth + 1),
                        };
                    }
                    const file = allFiles.find((r) => normalizePath(r.path) === childPath);
                    return {
                        path: childPath,
                        type: 'file' as const,
                        size: file?.size,
                    };
                });
        };

        return buildTree('/', 0);
    }

    // ── Search files by name ──

    async searchFiles(projectId: string, pattern: string): Promise<string[]> {
        const allFiles = await this.db.projectFiles.where('projectId').equals(projectId).toArray();
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
        return allFiles
            .map((r) => normalizePath(r.path))
            .filter((p) => regex.test(p));
    }

    // ── Grep content ──

    async grepContent(projectId: string, pattern: string, rootDir?: string): Promise<WorkspaceSearchMatch[]> {
        const allFiles = await this.db.projectFiles.where('projectId').equals(projectId).toArray();
        const regex = new RegExp(pattern, 'i');
        const root = rootDir ? normalizePath(rootDir) : '/';
        const results: WorkspaceSearchMatch[] = [];

        for (const record of allFiles) {
            const filePath = normalizePath(record.path);
            if (root !== '/' && !filePath.startsWith(root + '/') && filePath !== root) continue;
            if (record.size && record.size > 100_000) continue; // skip large files

            const lines = record.content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                    results.push({ path: filePath, line: i + 1, content: lines[i] });
                    if (results.length >= 100) return results;
                }
            }
        }

        return results;
    }

    // ── History (undo) ──

    async getHistory(projectId: string, path?: string): Promise<WorkspaceFileChange[]> {
        try {
            const key = path ? `workspace-history/${projectId}/${normalizePath(path)}` : `workspace-history/${projectId}`;
            const record = await (this.db as any).kv?.get(key);
            const changes = (record?.value as WorkspaceFileChange[]) ?? [];
            return changes;
        } catch {
            return [];
        }
    }

    private async recordChange(projectId: string, change: WorkspaceFileChange): Promise<void> {
        try {
            const key = `workspace-history/${projectId}/${change.path}`;
            const existing = await (this.db as any).kv?.get(key);
            const changes = ((existing?.value as WorkspaceFileChange[]) ?? []).slice(-99);
            changes.push(change);
            await (this.db as any).kv?.set(key, changes);
        } catch { /* best-effort */ }
    }

    // ── Copy ──

    async copyFile(projectId: string, from: string, to: string): Promise<WorkspaceFile> {
        const source = await this.readFile(projectId, from);
        if (!source) throw new Error(`Source file not found: ${from}`);
        return this.writeFile(projectId, to, source.content);
    }

    // ── Move/rename ──

    async moveFile(projectId: string, from: string, to: string): Promise<void> {
        const source = await this.readFile(projectId, from);
        if (!source) throw new Error(`Source file not found: ${from}`);
        await this.writeFile(projectId, to, source.content);
        await this.deleteFile(projectId, from);
    }

    // ── Directory operations ──

    async mkdir(projectId: string, dirPath: string): Promise<void> {
        // Directories are implicit in our model — creating a file creates dirs
        // But we can create a .gitkeep to make the dir exist
        const normalized = normalizePath(dirPath);
        await this.writeFile(projectId, `${normalized}/.gitkeep`, '');
    }

    async rmdir(projectId: string, dirPath: string): Promise<void> {
        const normalized = normalizePath(dirPath);
        const allFiles = await this.db.projectFiles.where('projectId').equals(projectId).toArray();
        const prefix = normalized === '/' ? '/' : normalized + '/';
        for (const record of allFiles) {
            const filePath = normalizePath(record.path);
            if (filePath.startsWith(prefix) || filePath === normalized) {
                await this.db.projectFiles.delete([projectId, filePath] as any);
            }
        }
        this.emit('workspace:dir:deleted', { projectId, path: normalized });
    }

    private emit(event: string, data: Record<string, unknown>): void {
        try {
            this.eventBus?.emit(event, data);
        } catch { /* fire-and-forget */ }
    }
}
