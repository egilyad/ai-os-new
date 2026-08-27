import type {
    IWorkspaceService,
    FileNode,
    SearchMatch,
    FileReadRecord,
} from '../contracts/workspace';
import { WORKSPACE_EVENTS } from '../contracts/workspace';
import type { ILifecycle } from '../contracts/lifecycle';
import type { WorkspaceRepository } from '../dal';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('WorkspaceService');

type FSDirHandle = FileSystemDirectoryHandle & {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
};

const MAX_DEPTH = 4;
const MAX_FILES = 1000;
const MAX_READ_SIZE = 500_000;
const MAX_GREP_RESULTS = 20;
const MAX_GREP_FILE_SIZE = 100_000;
const BINARY_EXTENSIONS = new Set([
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.bin',
    '.dat',
    '.wasm',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.ico',
    '.webp',
    '.mp3',
    '.mp4',
    '.avi',
    '.mov',
    '.mkv',
    '.wav',
    '.flac',
    '.zip',
    '.tar',
    '.gz',
    '.rar',
    '.7z',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
]);
const SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.cache',
    '__pycache__',
    '.venv',
    'venv',
    'env',
    '.idea',
    '.vscode',
    'coverage',
    '.nyc_output',
    'target',
    'out',
]);

export interface WorkspaceServiceDeps {
    eventBus: { emit: (event: string, data?: unknown) => void };
    repo: WorkspaceRepository;
}

export class WorkspaceService implements IWorkspaceService, ILifecycle {
    private rootHandle: FileSystemDirectoryHandle | null = null;
    private attached = false;
    private workspaceName: string | null = null;
    private deps: WorkspaceServiceDeps;
    private readHistory: FileReadRecord[] = [];
    private executionReads = new Map<string, FileReadRecord[]>();
    private readonly MAX_HISTORY = 200;
    private _initialized = false;

    constructor(deps: WorkspaceServiceDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        await this.tryRestoreHandle();
    }

    async start(): Promise<void> {
        // no-op
    }

    destroy(): void {
        this.detach();
    }

    isAttached(): boolean {
        return this.attached;
    }

    getWorkspaceName(): string | null {
        return this.workspaceName;
    }

    getRootDirName(): string | null {
        return this.workspaceName;
    }

    getReadHistory(executionId?: string): FileReadRecord[] {
        if (executionId) return this.executionReads.get(executionId) ?? [];
        return this.readHistory;
    }

    async attachDirectory(): Promise<void> {
        if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
            throw new Error('File System Access API not supported in this browser');
        }

        try {
            const handle = await (
                window as unknown as { showDirectoryPicker: () => Promise<FSDirHandle> }
            ).showDirectoryPicker();
            this.rootHandle = handle as FileSystemDirectoryHandle;
            this.workspaceName = handle.name;
            this.attached = true;
            await this.persistHandle();
            LOGGER.info('WorkspaceService', 'Workspace attached', { name: this.workspaceName });
            this.deps.eventBus.emit(WORKSPACE_EVENTS.ATTACHED, {
                name: this.workspaceName,
                fileCount: 0,
            });
        } catch (e: unknown) {
            if (e instanceof DOMException && e.name === 'AbortError') return;
            this.attached = false;
            this.rootHandle = null;
            this.workspaceName = null;
            throw e;
        }
    }

    detach(): void {
        if (!this.attached) return;
        this.attached = false;
        this.rootHandle = null;
        this.workspaceName = null;
        this.readHistory = [];
        this.removePersistedHandle();
        this.deps.eventBus.emit(WORKSPACE_EVENTS.DETACHED, {});
    }

    async listTree(dirPath?: string): Promise<FileNode[]> {
        const handle = this.rootHandle;
        if (!handle) return [];
        const dirHandle = dirPath ? await this.resolveDirHandle(handle, dirPath) : handle;
        return this.traverseDir(dirHandle, dirPath || '', 0);
    }

    async readFile(path: string, executionId?: string): Promise<string> {
        const handle = this.rootHandle;
        if (!handle) throw new Error('No workspace attached');
        const start = performance.now();
        try {
            const fileHandle = await this.resolveFileHandle(handle, path);
            const file = await fileHandle.getFile();

            if (file.size > MAX_READ_SIZE) {
                throw new Error(`File too large (${file.size} bytes). Max ${MAX_READ_SIZE} bytes`);
            }
            const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
            if (BINARY_EXTENSIONS.has(ext)) {
                throw new Error(`Cannot read binary file: ${path}`);
            }

            const text = await file.text();
            const latency = Math.round(performance.now() - start);
            LOGGER.info('WorkspaceService', 'File read', { path, size: file.size, latency });
            this.recordRead(path, file.size, latency, undefined, executionId);
            this.deps.eventBus.emit(WORKSPACE_EVENTS.FILE_READ, { path, executionId });
            return text;
        } catch (e) {
            const latency = Math.round(performance.now() - start);
            this.recordRead(
                path,
                0,
                latency,
                e instanceof Error ? e.message : 'Unknown error',
                executionId,
            );
            throw e;
        }
    }

    async search(pattern: string, rootDir?: string, _executionId?: string): Promise<string[]> {
        const handle = this.rootHandle;
        if (!handle) return [];
        const dirHandle = rootDir ? await this.resolveDirHandle(handle, rootDir) : handle;
        const results: string[] = [];
        await this.searchDir(dirHandle, rootDir || '', pattern.toLowerCase(), results);
        return results;
    }

    async grepContent(
        pattern: string,
        rootDir?: string,
        _executionId?: string,
    ): Promise<SearchMatch[]> {
        const handle = this.rootHandle;
        if (!handle) return [];
        const dirHandle = rootDir ? await this.resolveDirHandle(handle, rootDir) : handle;
        const results: SearchMatch[] = [];
        const lowerPattern = pattern.toLowerCase();
        await this.grepDir(dirHandle, rootDir || '', lowerPattern, results);
        return results;
    }

    async getFileTreeSnapshot(maxDepth = 3): Promise<string> {
        const handle = this.rootHandle;
        if (!handle) return '(no workspace attached)';
        const name = this.workspaceName || 'workspace';
        const tree = await this.traverseDir(handle, '', 0, maxDepth);
        if (tree.length === 0) return `/${name}/\n  (empty)`;
        return `/${name}/\n${this.formatTree(tree, '')}`;
    }

    private async persistHandle(): Promise<void> {
        if (!this.rootHandle) return;
        try {
            await this.deps.repo.saveHandle(this.rootHandle);
        } catch (e) {
            LOGGER.warn('WorkspaceService', 'Failed to persist handle', { error: String(e) });
        }
    }

    private removePersistedHandle(): void {
        try {
            this.deps.repo.deleteHandle();
        } catch (e) {
            LOGGER.warn('WorkspaceService', 'Failed to remove persisted handle', {
                error: String(e),
            });
        }
    }

    private async tryRestoreHandle(): Promise<void> {
        try {
            const record = await this.deps.repo.getHandle();
            if (!record) return;
            const handle = record as FileSystemDirectoryHandle & {
                queryPermission?: (descriptor?: {
                    mode?: 'read' | 'readwrite';
                }) => Promise<PermissionState>;
                requestPermission?: (descriptor?: {
                    mode?: 'read' | 'readwrite';
                }) => Promise<PermissionState>;
            };
            const opts = { mode: 'read' as const };
            let permitted: PermissionState = handle.queryPermission
                ? await handle.queryPermission(opts)
                : 'prompt';
            if (permitted !== 'granted') {
                permitted = handle.requestPermission
                    ? await handle.requestPermission(opts)
                    : 'denied';
            }
            if (permitted === 'granted') {
                this.rootHandle = handle;
                this.workspaceName = handle.name;
                this.attached = true;
                this.deps.eventBus.emit(WORKSPACE_EVENTS.ATTACHED, {
                    name: this.workspaceName,
                    fileCount: 0,
                });
            } else {
                this.removePersistedHandle();
            }
        } catch (e) {
            LOGGER.warn('WorkspaceService', 'Failed to restore handle', { error: String(e) });
            this.removePersistedHandle();
        }
    }

    private recordRead(
        path: string,
        size: number,
        latency: number,
        error?: string,
        executionId?: string,
    ): void {
        const record: FileReadRecord = {
            path,
            size,
            latency,
            timestamp: Date.now(),
            error,
            executionId,
        };
        this.readHistory.unshift(record);
        if (this.readHistory.length > this.MAX_HISTORY) {
            this.readHistory = this.readHistory.slice(0, this.MAX_HISTORY);
        }
        if (executionId) {
            const execRecords = this.executionReads.get(executionId) ?? [];
            execRecords.push(record);
            this.executionReads.set(executionId, execRecords);
        }
    }

    private async resolveDirHandle(
        root: FileSystemDirectoryHandle,
        dirPath: string,
    ): Promise<FileSystemDirectoryHandle> {
        const parts = dirPath.split('/').filter(Boolean);
        let handle = root;
        for (const part of parts) {
            handle = await handle.getDirectoryHandle(part);
        }
        return handle;
    }

    private async resolveFileHandle(
        root: FileSystemDirectoryHandle,
        filePath: string,
    ): Promise<FileSystemFileHandle> {
        const parts = filePath.split('/').filter(Boolean);
        const fileName = parts.pop();
        if (!fileName) throw new Error(`Invalid file path: ${filePath}`);
        let handle: FileSystemDirectoryHandle = root;
        for (const part of parts) {
            handle = await handle.getDirectoryHandle(part);
        }
        return handle.getFileHandle(fileName);
    }

    private async traverseDir(
        handle: FileSystemDirectoryHandle,
        prefix: string,
        depth: number,
        maxDepth = MAX_DEPTH,
    ): Promise<FileNode[]> {
        if (depth > maxDepth) return [];
        const nodes: FileNode[] = [];
        let count = 0;

        for await (const [name, entry] of (handle as FSDirHandle).entries()) {
            if (count >= MAX_FILES) break;
            const fullPath = prefix ? `${prefix}/${name}` : name;

            if (entry.kind === 'directory') {
                if (SKIP_DIRS.has(name)) continue;
                const children = await this.traverseDir(
                    entry as FileSystemDirectoryHandle,
                    fullPath,
                    depth + 1,
                    maxDepth,
                );
                count += children.length + 1;
                nodes.push({
                    name,
                    path: fullPath,
                    type: 'dir',
                    children: children.length > 0 ? children : undefined,
                });
            } else {
                count++;
                try {
                    const file = await (entry as FileSystemFileHandle).getFile();
                    nodes.push({
                        name,
                        path: fullPath,
                        type: 'file',
                        size: file.size,
                        lastModified: file.lastModified,
                    });
                } catch (e) {
                    LOGGER.warn('WorkspaceService', 'Failed to read file during traversal', {
                        path: fullPath,
                        error: e,
                    });
                }
            }
        }

        nodes.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        return nodes;
    }

    private async searchDir(
        handle: FileSystemDirectoryHandle,
        prefix: string,
        pattern: string,
        results: string[],
    ): Promise<void> {
        for await (const [name, entry] of (handle as FSDirHandle).entries()) {
            const fullPath = prefix ? `${prefix}/${name}` : name;
            if (entry.kind === 'directory') {
                if (SKIP_DIRS.has(name)) continue;
                await this.searchDir(
                    entry as FileSystemDirectoryHandle,
                    fullPath,
                    pattern,
                    results,
                );
            } else if (name.toLowerCase().includes(pattern)) {
                results.push(fullPath);
            }
        }
    }

    private async grepDir(
        handle: FileSystemDirectoryHandle,
        prefix: string,
        pattern: string,
        results: SearchMatch[],
    ): Promise<void> {
        for await (const [name, entry] of (handle as FSDirHandle).entries()) {
            if (results.length >= MAX_GREP_RESULTS) return;
            const fullPath = prefix ? `${prefix}/${name}` : name;
            if (entry.kind === 'directory') {
                if (SKIP_DIRS.has(name)) continue;
                await this.grepDir(entry as FileSystemDirectoryHandle, fullPath, pattern, results);
            } else {
                const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
                if (BINARY_EXTENSIONS.has(ext)) continue;
                try {
                    const file = await (entry as FileSystemFileHandle).getFile();
                    if (file.size > MAX_GREP_FILE_SIZE) continue;
                    const text = await file.text();
                    const lines = text.split('\n');
                    for (let i = 0; i < lines.length && results.length < MAX_GREP_RESULTS; i++) {
                        if (lines[i]!.toLowerCase().includes(pattern)) {
                            results.push({
                                path: fullPath,
                                line: i + 1,
                                content: lines[i]!.trim(),
                            });
                        }
                    }
                } catch (e) {
                    LOGGER.warn('WorkspaceService', 'Failed to read file during grep', {
                        path: fullPath,
                        error: e,
                    });
                }
            }
        }
    }

    private formatTree(nodes: FileNode[], indent: string): string {
        let out = '';
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!;
            const isLast = i === nodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const sizeInfo =
                node.type === 'file' && node.size != null ? ` (${this.formatSize(node.size)})` : '';
            out += `${indent}${connector}${node.name}${sizeInfo}\n`;
            if (node.type === 'dir' && node.children) {
                const childIndent = indent + (isLast ? '    ' : '│   ');
                out += this.formatTree(node.children, childIndent);
            }
        }
        return out;
    }

    private formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
}
