/**
 * WorkspacePanel — File explorer and workspace browser.
 *
 * Allows attaching a local directory and browsing its file tree, searching
 * by filename, and previewing text file content. Agents use this panel to
 * read project files during chats and debates. Binary files and files over
 * 5 MB are excluded from preview.
 */
import React, { useState, useCallback } from 'react';
import {
    FolderOpen,
    FolderClosed,
    File,
    X,
    Search,
    Loader2,
    ChevronRight,
    ChevronDown,
    HardDrive,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { Skeleton } from '../Common/Skeleton';
import { workspaceService } from '../../kernel/instances';
import type { FileNode } from '../../kernel/contracts/workspace';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const BINARY_EXTENSIONS = new Set([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'ico',
    'webp',
    'svg',
    'tiff',
    'tif',
    'mp3',
    'mp4',
    'wav',
    'ogg',
    'flac',
    'aac',
    'wma',
    'm4a',
    'zip',
    'gz',
    'tar',
    'bz2',
    '7z',
    'rar',
    'xz',
    'zst',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'exe',
    'dll',
    'so',
    'dylib',
    'bin',
    'dat',
    'woff',
    'woff2',
    'ttf',
    'otf',
    'eot',
    'avi',
    'mov',
    'mkv',
    'wmv',
    'flv',
    'webm',
    'm4v',
    'sqlite',
    'db',
    'sqlite3',
]);

function isBinaryFile(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    return BINARY_EXTENSIONS.has(ext);
}

function findFileNode(nodes: FileNode[], path: string): FileNode | null {
    for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
            const found = findFileNode(node.children, path);
            if (found) return found;
        }
    }
    return null;
}

const WorkspacePanel: React.FC = () => {
    const { t } = useTranslation();
    const [attached, setAttached] = useState(() => {
        try {
            return workspaceService.isAttached();
        } catch {
            return false;
        }
    });
    const [workspaceName, setWorkspaceName] = useState(() => {
        try {
            return workspaceService.getWorkspaceName();
        } catch {
            return null;
        }
    });
    const [tree, setTree] = useState<FileNode[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [treeLoading, setTreeLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searching, setSearching] = useState(false);

    const refreshTree = useCallback(async () => {
        setTreeLoading(true);
        try {
            const nodes = await workspaceService.listTree();
            setTree(nodes);
        } finally {
            setTreeLoading(false);
        }
    }, []);

    const handleAttach = async () => {
        try {
            await workspaceService.attachDirectory();
            setAttached(true);
            setWorkspaceName(workspaceService.getWorkspaceName());
            await refreshTree();
        } catch {
            console.warn('[WorkspacePanel] Failed to load workspace');
        }
    };

    const handleDetach = () => {
        workspaceService.detach();
        setAttached(false);
        setWorkspaceName(null);
        setTree([]);
        setExpanded(new Set());
        setSelectedPath(null);
        setPreviewContent(null);
        setPreviewError(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleToggleDir = (path: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const handleSelectFile = async (path: string) => {
        setSelectedPath(path);
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewContent(null);
        try {
            if (isBinaryFile(path)) {
                setPreviewError('Binary file — preview not available.');
                return;
            }
            const node = findFileNode(tree, path);
            if (node?.size != null && node.size > MAX_FILE_SIZE) {
                setPreviewError(
                    `File too large (${formatSize(node.size)}). Maximum preview size is ${formatSize(MAX_FILE_SIZE)}.`,
                );
                return;
            }
            const content = await workspaceService.readFile(path);
            setPreviewContent(content);
        } catch (e) {
            setPreviewError(e instanceof Error ? e.message : 'Failed to read file');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const results = await workspaceService.search(query);
            setSearchResults(results);
        } finally {
            setSearching(false);
        }
    }, []);

    const renderTree = (nodes: FileNode[], depth = 0): React.ReactNode => {
        return nodes.map((node) => {
            const isDir = node.type === 'dir';
            const isExpanded = expanded.has(node.path);
            const isSelected = selectedPath === node.path;
            const paddingLeft = 12 + depth * 16;

            return (
                <div key={node.path}>
                    <div
                        onClick={() =>
                            isDir ? handleToggleDir(node.path) : handleSelectFile(node.path)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (isDir) {
                                    handleToggleDir(node.path);
                                } else {
                                    handleSelectFile(node.path);
                                }
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isDir ? isExpanded : undefined}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 8px',
                            paddingLeft,
                            cursor: 'pointer',
                            borderRadius: 6,
                            fontSize: '0.82rem',
                            background: isSelected ? 'rgba(168,85,247,0.12)' : 'transparent',
                            color: isSelected ? '#a855f7' : isDir ? '#e2e8f0' : '#94a3b8',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSelected)
                                (e.currentTarget as HTMLElement).style.background =
                                    'rgba(255,255,255,0.03)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected)
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                    >
                        {isDir ? (
                            isExpanded ? (
                                <ChevronDown size={12} color="#64748b" />
                            ) : (
                                <ChevronRight size={12} color="#64748b" />
                            )
                        ) : (
                            <span style={{ width: 12 }} />
                        )}
                        {isDir ? (
                            isExpanded ? (
                                <FolderOpen size={14} color="#a855f7" />
                            ) : (
                                <FolderClosed size={14} color="#64748b" />
                            )
                        ) : (
                            <File size={14} color="#64748b" />
                        )}
                        <span
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {node.name}
                        </span>
                        {node.type === 'file' && node.size != null && (
                            <span
                                style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--slate-600)' }}
                            >
                                {formatSize(node.size)}
                            </span>
                        )}
                    </div>
                    {isDir && isExpanded && node.children && renderTree(node.children, depth + 1)}
                </div>
            );
        });
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1.5rem 1.5rem 0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HardDrive size={20} color="#a855f7" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Workspace
                    </span>
                </div>
                {attached && (
                    <button
                        onClick={handleDetach}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.78rem',
                        }}
                        title="Detach workspace"
                        aria-label="Detach workspace"
                    >
                        <X size={14} /> Detach
                    </button>
                )}
            </div>

            {/* Attach button or workspace name */}
            {!attached ? (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        padding: '3rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <HardDrive size={48} opacity={0.3} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>
                        No workspace attached
                    </span>
                    <span
                        style={{
                            fontSize: '0.82rem',
                            color: 'var(--slate-600)',
                            textAlign: 'center',
                            maxWidth: 300,
                        }}
                    >
                        Attach a local folder for agents to browse and read files during chats and
                        debates.
                    </span>
                    <button
                        onClick={handleAttach}
                        className="btn-primary"
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 12,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: '0.5rem',
                        }}
                    >
                        <FolderOpen size={18} /> Attach Folder
                    </button>
                </div>
            ) : (
                <>
                    {/* Workspace header */}
                    <div
                        style={{
                            padding: '0.75rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}
                    >
                        <HardDrive size={14} color="#10b981" />
                        <span
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: 'var(--success)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {workspaceName}
                        </span>
                        <button
                            onClick={refreshTree}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                                padding: 2,
                                fontSize: '0.75rem',
                            }}
                            title="Refresh"
                            aria-label={t('common.aria.refresh')}
                        >
                            <Loader2 size={12} />
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '0.5rem 1rem' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 8,
                                padding: '6px 10px',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <Search size={14} color="#64748b" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search files..."
                                aria-label={t('common.aria.search')}
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.82rem',
                                }}
                            />
                            {searching && <Loader2 size={12} className="spinning" />}
                            {searchQuery && (
                                <button
                                    onClick={() => handleSearch('')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-500)',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content: tree or search results */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem 0.5rem' }}>
                        {searchQuery ? (
                            searchResults.length === 0 ? (
                                <div
                                    style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        color: 'var(--slate-600)',
                                        fontSize: '0.82rem',
                                    }}
                                >
                                    {searching ? 'Searching...' : 'No matching files'}
                                </div>
                            ) : (
                                <div>
                                    <div
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {searchResults.length} file
                                        {searchResults.length !== 1 ? 's' : ''} found
                                    </div>
                                    {searchResults.map((path) => (
                                        <div
                                            key={path}
                                            onClick={() => handleSelectFile(path)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleSelectFile(path);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '4px 12px',
                                                cursor: 'pointer',
                                                borderRadius: 6,
                                                fontSize: '0.82rem',
                                                color:
                                                    selectedPath === path ? '#a855f7' : '#94a3b8',
                                                background:
                                                    selectedPath === path
                                                        ? 'rgba(168,85,247,0.12)'
                                                        : 'transparent',
                                            }}
                                        >
                                            <File size={14} />
                                            <span
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {path}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : treeLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                                <Loader2 size={20} className="spinning" />
                            </div>
                        ) : tree.length === 0 ? (
                            <div
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--slate-600)',
                                    fontSize: '0.82rem',
                                }}
                            >
                                Empty directory
                            </div>
                        ) : (
                            <div>{renderTree(tree)}</div>
                        )}
                    </div>

                    {/* Preview panel */}
                    {selectedPath && (
                        <div
                            style={{
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '45%',
                            }}
                        >
                            <div
                                style={{
                                    padding: '0.5rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                }}
                            >
                                <File size={12} color="#64748b" />
                                <span
                                    style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--slate-400)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                    }}
                                >
                                    {selectedPath}
                                </span>
                                <button
                                    onClick={() => {
                                        setSelectedPath(null);
                                        setPreviewContent(null);
                                        setPreviewError(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-500)',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem 1rem' }}>
                                {previewLoading ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            color: 'var(--slate-500)',
                                            fontSize: '0.82rem',
                                        }}
                                    >
                                        <Skeleton width="60%" height={14} />
                                    </div>
                                ) : previewError ? (
                                    <div style={{ color: 'var(--error)', fontSize: '0.82rem' }}>
                                        {previewError}
                                    </div>
                                ) : (
                                    <pre
                                        style={{
                                            margin: 0,
                                            fontSize: '0.78rem',
                                            lineHeight: 1.5,
                                            color: 'var(--slate-300)',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {previewContent}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default WorkspacePanel;
