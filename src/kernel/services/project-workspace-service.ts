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
        const entries = this.buildEntryMap(
            (await this.db.projectFiles.where('projectId').equals(projectId).toArray()).map((r) => ({
                path: normalizePath(r.path),
                content: r.content,
            })),
        );
        const target = entries.get(dir);
        if (!target || target.type !== 'dir') return [];
        // Direct children within the requested scope only
        return (target.children ?? [])
            .filter((c) => c.path.startsWith(dir === '/' ? '/' : dir + '/'))
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.path.localeCompare(b.path);
            });
    }

    // ── Full tree ──

    private buildEntryMap(files: Array<{ path: string; content: string }>): Map<string, WorkspaceTreeEntry> {
        const entries = new Map<string, WorkspaceTreeEntry>();
        const ensureDir = (p: string): void => {
            if (!entries.has(p)) entries.set(p, { path: p, type: 'dir', children: [] });
        };
        ensureDir('/');
        for (const f of files) {
            let current = parentDir(f.path);
            while (true) {
                ensureDir(current);
                if (current === '/') break;
                current = parentDir(current);
            }
            entries.set(f.path, { path: f.path, type: 'file', size: f.content.length });
        }
        for (const [p, e] of entries) {
            if (e.type !== 'dir') continue;
            e.children = [...entries.values()]
                .filter((c) => c.path !== p && parentDir(c.path) === p)
                .sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                    return a.path.localeCompare(b.path);
                });
        }
        return entries;
    }

    async getTree(projectId: string, maxDepth = 10): Promise<WorkspaceTreeEntry[]> {
        const allFiles = await this.db.projectFiles.where('projectId').equals(projectId).toArray();
        const dirs = this.buildEntryMap(
            allFiles.map((r) => ({ path: normalizePath(r.path), content: r.content })),
        );

        const buildTree = (dirPath: string, depth: number): WorkspaceTreeEntry[] => {
            if (depth >= maxDepth) return [];
            const dir = dirs.get(dirPath);
            if (!dir || !dir.children) return [];

            return dir.children.map((child) => {
                if (child.type === 'dir') {
                    return {
                        path: child.path,
                        type: 'dir' as const,
                        children: buildTree(child.path, depth + 1),
                    };
                }
                return {
                    path: child.path,
                    type: 'file' as const,
                    size: child.size,
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
            if (record.content && record.content.length > 100_000) continue; // skip large files

            const lines = record.content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line === undefined) continue;
                if (regex.test(line)) {
                    results.push({ path: filePath, line: i + 1, content: line });
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
