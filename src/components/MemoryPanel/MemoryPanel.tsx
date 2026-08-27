import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { memoryService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('MemoryPanel');
import type { MemoryEntry } from '../../types/memory';
import { eventBus, EVENTS } from '../../kernel/instances';
import { CONFIG } from '../../kernel/instances';
import { configService } from '../../kernel/instances';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import { useConfirm } from '../../hooks/useConfirm';
import ModuleInfo from '../ModuleInfo';
import MemoryHeader from './MemoryHeader';
import MemoryErrorAlert from './MemoryErrorAlert';
import CollectionTabs from './CollectionTabs';
import SearchBar from './SearchBar';
import MemoryEmptyState from './MemoryEmptyState';
import MemoryCard from './MemoryCard';
import IndexStatsPanel from './IndexStatsPanel';
import KnowledgeGrowthPanel from './KnowledgeGrowthPanel';
import ForgettingCurvePanel from './ForgettingCurvePanel';
import MemoryTimeline from './MemoryTimeline';

const MemoryPanel: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [memories, setMemories] = useState<MemoryEntry[]>(() => memoryService.getMemories());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeCollection, setActiveCollection] = useState<
        'long_term' | 'ephemeral' | 'rag_sources'
    >('long_term');
    const [semanticMode, setSemanticMode] = useState(!!CONFIG?.services?.memory?.semanticEnabled);
    const [importanceFilter, setImportanceFilter] = useState(0);
    const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [isLoading, setIsLoading] = useState(memories.length === 0);
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const clearError = useAutoClearError(setError);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const innerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [avgRetrievalMs, setAvgRetrievalMs] = useState(0);
    const retrievalSamples = useRef<number[]>([]);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(
        () =>
            eventBus.onSafe(EVENTS.SETTINGS_UPDATED, () => {
                setSemanticMode(!!CONFIG?.services?.memory?.semanticEnabled);
            }),
        [],
    );

    useEffect(() => {
        const unsub = eventBus.onSafe<MemoryEntry[]>('memory:updated', (data) => {
            if (!isMountedRef.current) return;
            setMemories([...data]);
            setIsLoading(false);
            setError(null);
        });
        const loadingTimer = setTimeout(() => {
            if (isMountedRef.current) setIsLoading(false);
        }, 3000);
        if (semanticMode) void Promise.resolve();
        return () => {
            clearTimeout(loadingTimer);
            if (unsub) unsub();
        };
    }, [semanticMode]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const activityMap = useMemo(() => {
        const map: Record<string, number> = {};
        const now = currentTime;
        const dayMs = 24 * 60 * 60 * 1000;
        memories.forEach((m) => {
            const dayIndex = Math.floor((now - m.metadata.timestamp) / dayMs);
            if (dayIndex >= 0 && dayIndex < 42) map[dayIndex] = (map[dayIndex] || 0) + 1;
        });
        return map;
    }, [memories, currentTime]);

    useEffect(() => {
        const performSearch = async () => {
            if (!isMountedRef.current) return;
            const query = searchQuery.trim();
            if (!query) {
                setMemories(memoryService.getMemories());
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            setError(null);
            if (abortControllerRef.current) abortControllerRef.current.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;
            try {
                await new Promise<void>((r) => {
                    innerTimerRef.current = setTimeout(() => {
                        innerTimerRef.current = null;
                        r();
                    }, 400);
                });
                if (controller.signal.aborted || !isMountedRef.current) return;
                const t0 = performance.now();
                const results = await memoryService.search(
                    query,
                    5,
                    semanticMode ? 'semantic' : 'fulltext',
                );
                if (controller.signal.aborted || !isMountedRef.current) return;
                retrievalSamples.current.push(performance.now() - t0);
                if (retrievalSamples.current.length > 10) retrievalSamples.current.shift();
                setAvgRetrievalMs(
                    Math.round(
                        retrievalSamples.current.reduce((a, b) => a + b, 0) /
                            retrievalSamples.current.length,
                    ),
                );
                setMemories(results.map((r) => r.entry));
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                if (isMountedRef.current) {
                    setError(t('memory.error_search'));
                    clearError();
                }
            } finally {
                if (isMountedRef.current && abortControllerRef.current === controller)
                    setIsSearching(false);
            }
        };
        const debounceTimer = setTimeout(performSearch, 300);
        return () => {
            clearTimeout(debounceTimer);
            if (innerTimerRef.current !== null) {
                clearTimeout(innerTimerRef.current);
                innerTimerRef.current = null;
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [searchQuery, semanticMode, clearError, t]);

    const handleClear = async () => {
        if (
            !(await confirm({
                title: 'Wipe Memory Index',
                message: t('memory.wipe_confirm'),
                variant: 'danger',
            }))
        )
            return;
        try {
            await memoryService.clear();
            if (isMountedRef.current) {
                setMemories([]);
                setError(null);
            }
        } catch (err) {
            LOGGER.warn('Failed to wipe memory index', String(err));
            if (isMountedRef.current) {
                setError(t('memory.error_wipe'));
                clearError();
            }
        }
    };

    const handleDeleteMemory = useCallback(
        async (id: string) => {
            if (
                !(await confirm({
                    title: 'Delete Memory',
                    message: 'Delete this memory entry?',
                    variant: 'danger',
                }))
            )
                return;
            try {
                await memoryService.deleteMemory(id);
                if (isMountedRef.current) {
                    setMemories((prev) => prev.filter((m) => m.id !== id));
                    setError(null);
                }
            } catch (err) {
                LOGGER.warn('Failed to delete memory entry', String(err));
                if (isMountedRef.current) {
                    setError(t('memory.error_delete'));
                    clearError();
                }
            }
        },
        [confirm, clearError, t],
    );

    const handleExportVectors = async () => {
        try {
            const exportData = JSON.stringify(memories, null, 2);
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memory-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Memory vectors exported',
                type: 'success',
            });
        } catch (err) {
            LOGGER.warn('Export failed', String(err));
            if (isMountedRef.current) {
                setError(t('memory.error_export'));
                clearError();
            }
        }
    };

    const filteredMemories = useMemo(
        () =>
            memories.filter(
                (m) =>
                    (m.metadata.collection ?? 'long_term') === activeCollection &&
                    (m.metadata.importance ?? 0) >= importanceFilter,
            ),
        [memories, activeCollection, importanceFilter],
    );
    const totalEntries = filteredMemories.length;

    const toggleSemantic = () => {
        const next = !semanticMode;
        setSemanticMode(next);
        configService
            .updateServices({
                memory: { semanticEnabled: next, autoEmbedOnStore: true, maxEntries: 1000 },
            })
            .catch((e) => LOGGER.warn('Config update failed', e));
        if (next) void Promise.resolve();
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflowY: 'auto',
            }}
        >
            <MemoryHeader onWipe={handleClear} onExport={handleExportVectors} />
            <MemoryErrorAlert error={error} onDismiss={() => setError(null)} />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 360px',
                    gap: '1.5rem',
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <div
                    className="glass-panel"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 24,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)',
                    }}
                >
                    <div
                        style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                        }}
                    >
                        <CollectionTabs
                            activeCollection={activeCollection}
                            onChange={setActiveCollection}
                        />
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            isSearching={isSearching}
                            semanticMode={semanticMode}
                            onToggleSemantic={toggleSemantic}
                        />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: 8,
                                    padding: 2,
                                    flexShrink: 0,
                                }}
                            >
                                <button
                                    onClick={() => setViewMode('cards')}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background:
                                            viewMode === 'cards'
                                                ? 'rgba(168,85,247,0.25)'
                                                : 'transparent',
                                        color: viewMode === 'cards' ? '#a855f7' : '#64748b',
                                        transition: 'all 0.15s',
                                    }}
                                    aria-label={t('common.aria.card_view')}
                                >
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background:
                                            viewMode === 'timeline'
                                                ? 'rgba(168,85,247,0.25)'
                                                : 'transparent',
                                        color: viewMode === 'timeline' ? '#a855f7' : '#64748b',
                                        transition: 'all 0.15s',
                                    }}
                                    aria-label={t('common.aria.timeline_view')}
                                >
                                    Timeline
                                </button>
                            </div>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t('memory.importance_min')}: {importanceFilter}
                            </span>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={importanceFilter}
                                onChange={(e) => setImportanceFilter(parseFloat(e.target.value))}
                                style={{ flex: 1, accentColor: '#a855f7' }}
                                aria-label={t('memory.importance_min')}
                            />
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-500)',
                                    minWidth: 24,
                                    textAlign: 'right',
                                }}
                            >
                                {importanceFilter === 0 ? t('memory.any') : ''}
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                        role="list"
                        aria-label={t('memory.title')}
                    >
                        {viewMode === 'cards' ? (
                            <AnimatePresence mode="popLayout">
                                {isLoading || filteredMemories.length === 0 ? (
                                    <MemoryEmptyState
                                        isLoading={isLoading}
                                        hasSearch={!!searchQuery}
                                    />
                                ) : (
                                    filteredMemories.map((memory, index) => (
                                        <MemoryCard
                                            key={memory.id}
                                            memory={memory}
                                            index={index}
                                            searchQuery={searchQuery}
                                            isSearching={isSearching}
                                            onDelete={handleDeleteMemory}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        ) : (
                            <motion.div
                                key="timeline"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <MemoryTimeline
                                    entries={filteredMemories}
                                    onDelete={handleDeleteMemory}
                                />
                            </motion.div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        overflowY: 'auto',
                    }}
                >
                    <IndexStatsPanel
                        memories={memories}
                        filteredMemories={filteredMemories}
                        totalEntries={totalEntries}
                        avgRetrievalMs={avgRetrievalMs}
                    />
                    <KnowledgeGrowthPanel activityMap={activityMap} totalEntries={totalEntries} />
                    <ForgettingCurvePanel memories={memories} />
                </div>
            </div>

            <ModuleInfo moduleKey="memory" />
            <ConfirmDialog />
        </div>
    );
};

export default MemoryPanel;
