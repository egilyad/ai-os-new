/**
 * Cognitive-aux / research panel (Experimental).
 * Interactive OS exploration — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Code, X } from 'lucide-react';
import { workspaceService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ProjectOsExplorer');
import type { FileNode } from '../../kernel/contracts/workspace';
import { useTranslation } from '../../i18n/useTranslation';
import { StorageAdapter } from '../../kernel/services/storage-adapter';
import type { FilterKey, SortKey } from './project-os-utils';
import { flattenTree, estimateLines, getExt, RECENT_KEY } from './project-os-utils';
import { FileTreeSection } from './FileTreeSection';
import { FilePreviewPanel } from './FilePreviewPanel';
import ProjectToolbar from './ProjectToolbar';
import StatsPanel from './StatsPanel';
import EmptyStateSection from './EmptyStateSection';
import RecentFilesSection from './RecentFilesSection';

const ProjectOsExplorer: React.FC = () => {
    useTranslation();
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
    const [filter, setFilter] = useState<FilterKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searching, setSearching] = useState(false);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [showStats, setShowStats] = useState(false);
    const [sortBy, setSortBy] = useState<SortKey>('name');
    const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
    const [showSensitive, setShowSensitive] = useState(false);
    const [goToLine, setGoToLine] = useState('');

    const refreshTree = useCallback(async () => {
        try {
            setTreeLoading(true);
            const t = await workspaceService.listTree();
            setTree(t);
        } catch (e) {
            LOGGER.warn('ProjectOsExplorer', 'refreshTree error', { error: e });
        } finally {
            setTreeLoading(false);
        }
    }, []);

    const persistRecent = useCallback((path: string) => {
        try {
            const raw = StorageAdapter.UI.getSync<string[]>(RECENT_KEY) || [];
            const updated = [path, ...raw.filter((p: string) => p !== path)].slice(0, 20);
            StorageAdapter.UI.setSync(RECENT_KEY, updated);
            setRecentFiles(updated);
        } catch {
            /* silent */
        }
    }, []);

    const handleGoToLine = useCallback(() => {
        const lineNum = parseInt(goToLine, 10);
        if (isNaN(lineNum) || lineNum < 1) return;
        const el = document.querySelector(`[data-line="${lineNum}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [goToLine]);

    useEffect(() => {
        const raw = StorageAdapter.UI.getSync<string[]>(RECENT_KEY);
        if (raw) setRecentFiles(raw);
    }, []);

    useEffect(() => {
        if (attached) refreshTree();
    }, [attached, refreshTree]);

    const handleAttach = async () => {
        try {
            await workspaceService.attachDirectory();
            setAttached(true);
            setWorkspaceName(workspaceService.getWorkspaceName());
            await refreshTree();
        } catch (e) {
            LOGGER.warn('ProjectOsExplorer', 'attach error', { error: e });
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
        setFilter('all');
        setSearchQuery('');
        setSearchResults([]);
        setBreadcrumbs([]);
    };

    const handleToggleDir = (path: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const handleSelectFile = useCallback(
        async (path: string) => {
            setSelectedPath(path);
            setPreviewLoading(true);
            setPreviewError(null);
            setPreviewContent(null);
            setGoToLine('');
            setBreadcrumbs(path.split('/'));
            try {
                const content = await workspaceService.readFile(path);
                setPreviewContent(content);
                persistRecent(path);
            } catch (e) {
                setPreviewError(e instanceof Error ? e.message : 'Failed to read file');
            } finally {
                setPreviewLoading(false);
            }
        },
        [persistRecent],
    );

    const handleCopyPath = async (path: string) => {
        try {
            await navigator.clipboard.writeText(path);
        } catch {
            /* silent */
        }
    };
    const handleCreateHypothesis = (_path: string) => {
        /* navigate to hypothesis-gen */
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

    const projectStats = useMemo(() => {
        const byExt: Record<string, number> = {};
        let totalSize = 0;
        const allF = flattenTree(tree).filter((n) => n.type === 'file');
        for (const f of allF) {
            const ext = getExt(f.name);
            byExt[ext] = (byExt[ext] || 0) + 1;
            totalSize += f.size || 0;
        }
        const sorted = Object.entries(byExt).sort((a, b) => b[1] - a[1]);
        const codeFiles = allF.filter((f) => /\.(ts|tsx|js|jsx|mjs)$/i.test(f.name));
        return {
            byExt: sorted,
            total: allF.length,
            totalSize,
            totalLines: estimateLines(totalSize),
            codeFiles: codeFiles.length,
        };
    }, [tree]);

    const allFiles = useMemo(() => flattenTree(tree).filter((n) => n.type === 'file'), [tree]);

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div
                style={{
                    padding: '0.85rem 1.25rem 0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Code size={18} color="#8b5cf6" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Project OS Explorer
                    </span>
                    {attached && workspaceName && (
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--success)',
                                background: 'var(--success-tint)',
                                padding: '0.1rem 0.45rem',
                                borderRadius: 4,
                            }}
                        >
                            {workspaceName}
                        </span>
                    )}
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
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: '0.72rem',
                        }}
                    >
                        <X size={12} /> Detach
                    </button>
                )}
            </div>

            {!attached ? (
                <EmptyStateSection onAttach={handleAttach} />
            ) : (
                <>
                    <ProjectToolbar
                        filter={filter}
                        sortBy={sortBy}
                        showSensitive={showSensitive}
                        showStats={showStats}
                        searchQuery={searchQuery}
                        searching={searching}
                        onSetFilter={setFilter}
                        onSetSortBy={setSortBy}
                        onToggleSensitive={() => setShowSensitive((v) => !v)}
                        onToggleStats={() => setShowStats((v) => !v)}
                        onSearch={handleSearch}
                    />

                    {showStats && <StatsPanel stats={projectStats} />}

                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <FileTreeSection
                            tree={tree}
                            treeLoading={treeLoading}
                            searchQuery={searchQuery}
                            searchResults={searchResults}
                            selectedPath={selectedPath}
                            expanded={expanded}
                            showSensitive={showSensitive}
                            filter={filter}
                            sortBy={sortBy}
                            onToggleDir={handleToggleDir}
                            onSelectFile={handleSelectFile}
                            onCopyPath={handleCopyPath}
                            onCreateHypothesis={handleCreateHypothesis}
                        />

                        {selectedPath ? (
                            <FilePreviewPanel
                                selectedPath={selectedPath}
                                previewContent={previewContent}
                                previewLoading={previewLoading}
                                previewError={previewError}
                                breadcrumbs={breadcrumbs}
                                allFiles={allFiles}
                                goToLine={goToLine}
                                onClose={() => {
                                    setSelectedPath(null);
                                    setPreviewContent(null);
                                    setPreviewError(null);
                                    setBreadcrumbs([]);
                                }}
                                onGoToLine={handleGoToLine}
                                onSetGoToLine={setGoToLine}
                                onCopyPath={handleCopyPath}
                                onCreateHypothesis={handleCreateHypothesis}
                            />
                        ) : (
                            <RecentFilesSection
                                recentFiles={recentFiles}
                                onSelectFile={handleSelectFile}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectOsExplorer;
