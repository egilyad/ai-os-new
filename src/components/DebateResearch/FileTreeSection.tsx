import React from 'react';
import {
    ChevronRight,
    ChevronDown,
    FolderOpen,
    FolderClosed,
    File,
    Loader2,
    Copy,
    Lightbulb,
} from 'lucide-react';
import type { FileNode } from '../../kernel/contracts/workspace';
import type { FilterKey } from './project-os-utils';
import {
    getExt,
    formatSize,
    isSensitivePath,
    matchesFilter,
    dirSort,
    EXT_ICONS,
} from './project-os-utils';

interface FileTreeSectionProps {
    tree: FileNode[];
    treeLoading: boolean;
    searchQuery: string;
    searchResults: string[];
    selectedPath: string | null;
    expanded: Set<string>;
    showSensitive: boolean;
    filter: FilterKey;
    sortBy: 'name' | 'size' | 'type';
    onToggleDir: (path: string) => void;
    onSelectFile: (path: string) => void;
    onCopyPath: (path: string) => void;
    onCreateHypothesis: (path: string) => void;
}

export const FileTreeSection: React.FC<FileTreeSectionProps> = ({
    tree,
    treeLoading,
    searchQuery,
    searchResults,
    selectedPath,
    expanded,
    showSensitive,
    filter,
    sortBy,
    onToggleDir,
    onSelectFile,
    onCopyPath,
    onCreateHypothesis,
}) => {
    const [contextMenu, setContextMenu] = React.useState<{
        x: number;
        y: number;
        path: string;
    } | null>(null);

    React.useEffect(() => {
        if (contextMenu) {
            const close = () => setContextMenu(null);
            window.addEventListener('click', close);
            return () => window.removeEventListener('click', close);
        }
    }, [contextMenu]);

    const handleContextMenu = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, path });
    };

    const renderTree = (nodes: FileNode[], depth = 0): React.ReactNode => {
        const sorted = dirSort(nodes, sortBy);
        return sorted.map((node) => {
            const isDir = node.type === 'dir';
            const isSense = isSensitivePath(node.path);
            if (isSense && !showSensitive) return null;
            if (!isDir && !matchesFilter(node.path, filter)) return null;
            const ext = isDir ? '' : getExt(node.name);
            const fileIcon = EXT_ICONS[ext];
            const paddingLeft = 6 + depth * 14;
            return (
                <div key={node.path}>
                    <div
                        onClick={() => (isDir ? onToggleDir(node.path) : onSelectFile(node.path))}
                        onContextMenu={(e) => {
                            if (!isDir) handleContextMenu(e, node.path);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (isDir) onToggleDir(node.path);
                                else onSelectFile(node.path);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 6px',
                            paddingLeft,
                            cursor: 'pointer',
                            borderRadius: 5,
                            fontSize: '0.78rem',
                            background:
                                selectedPath === node.path
                                    ? 'rgba(168,85,247,0.12)'
                                    : 'transparent',
                            color:
                                selectedPath === node.path
                                    ? '#c084fc'
                                    : isDir
                                      ? '#e2e8f0'
                                      : '#94a3b8',
                            opacity: isSense ? 0.35 : 1,
                            transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => {
                            if (selectedPath !== node.path)
                                (e.currentTarget as HTMLElement).style.background =
                                    'rgba(255,255,255,0.025)';
                        }}
                        onMouseLeave={(e) => {
                            if (selectedPath !== node.path)
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                        title={isSense ? 'Sensitive path' : node.path}
                    >
                        {isDir ? (
                            expanded.has(node.path) ? (
                                <ChevronDown size={10} color="#64748b" />
                            ) : (
                                <ChevronRight size={10} color="#64748b" />
                            )
                        ) : (
                            <span style={{ width: 10 }} />
                        )}
                        {isDir ? (
                            expanded.has(node.path) ? (
                                <FolderOpen size={12} color="#a855f7" />
                            ) : (
                                <FolderClosed size={12} color="#64748b" />
                            )
                        ) : fileIcon ? (
                            <span style={{ color: fileIcon.color }}>{fileIcon.icon}</span>
                        ) : (
                            <File size={12} color="#64748b" />
                        )}
                        <span
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                            }}
                        >
                            {node.name}
                        </span>
                        {node.type === 'file' && node.size != null && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--slate-600)' }}>
                                {formatSize(node.size)}
                            </span>
                        )}
                    </div>
                    {isDir &&
                        expanded.has(node.path) &&
                        node.children &&
                        renderTree(node.children, depth + 1)}
                </div>
            );
        });
    };

    return (
        <div
            style={{
                width: '42%',
                minWidth: 200,
                overflowY: 'auto',
                padding: '0.15rem 0',
                borderRight: '1px solid rgba(255,255,255,0.03)',
            }}
        >
            {searchQuery ? (
                searchResults.length === 0 ? (
                    <div
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--slate-600)',
                            fontSize: '0.75rem',
                        }}
                    >
                        No matching files
                    </div>
                ) : (
                    <div>
                        <div
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.65rem',
                                color: 'var(--slate-500)',
                                fontWeight: 600,
                            }}
                        >
                            {searchResults.length} results
                        </div>
                        {searchResults.map((path) => (
                            <div
                                key={path}
                                onClick={() => onSelectFile(path)}
                                onContextMenu={(e) => handleContextMenu(e, path)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSelectFile(path);
                                }}
                                role="button"
                                tabIndex={0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '2px 10px',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    fontSize: '0.72rem',
                                    color: selectedPath === path ? '#c084fc' : '#94a3b8',
                                    background:
                                        selectedPath === path
                                            ? 'rgba(168,85,247,0.12)'
                                            : 'transparent',
                                }}
                            >
                                <span
                                    style={{ color: EXT_ICONS[getExt(path)]?.color || '#64748b' }}
                                >
                                    {EXT_ICONS[getExt(path)]?.icon || <File size={11} />}
                                </span>
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
                    <Loader2 size={16} />
                </div>
            ) : tree.length === 0 ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--slate-600)',
                        fontSize: '0.75rem',
                    }}
                >
                    Empty directory
                </div>
            ) : (
                <div>{renderTree(tree)}</div>
            )}

            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        left: contextMenu.x,
                        top: contextMenu.y,
                        zIndex: 10000,
                        background: 'var(--slate-800)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '0.25rem',
                        minWidth: 180,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        onClick={() => {
                            onCopyPath(contextMenu.path);
                            setContextMenu(null);
                        }}
                        style={{
                            padding: '0.4rem 0.7rem',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: 'var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                    >
                        <Copy size={12} /> Copy Path
                    </div>
                    <div
                        onClick={() => {
                            onCreateHypothesis(contextMenu.path);
                            setContextMenu(null);
                        }}
                        style={{
                            padding: '0.4rem 0.7rem',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#a855f7',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                'rgba(168,85,247,0.08)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                    >
                        <Lightbulb size={12} /> Create Hypothesis
                    </div>
                </div>
            )}
        </div>
    );
};
