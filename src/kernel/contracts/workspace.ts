export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  lastModified?: number;
  children?: FileNode[];
}

export interface WorkspaceAttachPayload {
  name: string;
  fileCount: number;
}

export interface WorkspaceFileReadPayload {
  path: string;
  executionId?: string;
}

export interface SearchMatch {
  path: string;
  line: number;
  content: string;
}

export interface FileReadRecord {
  path: string;
  size: number;
  latency: number;
  timestamp: number;
  error?: string;
  executionId?: string;
}

export interface IWorkspaceService {
  attachDirectory(): Promise<void>;
  detach(): void;
  listTree(dirPath?: string): Promise<FileNode[]>;
  readFile(path: string, executionId?: string): Promise<string>;
  search(pattern: string, rootDir?: string, executionId?: string): Promise<string[]>;
  grepContent(pattern: string, rootDir?: string, executionId?: string): Promise<SearchMatch[]>;
  getWorkspaceName(): string | null;
  isAttached(): boolean;
  getFileTreeSnapshot(maxDepth?: number): Promise<string>;
  getRootDirName(): string | null;
  getReadHistory(executionId?: string): FileReadRecord[];
}

export const WORKSPACE_EVENTS = {
  ATTACHED: 'workspace:attached',
  DETACHED: 'workspace:detached',
  FILE_READ: 'workspace:file:read',
} as const;
