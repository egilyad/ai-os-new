import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronsDown } from 'lucide-react';
import type { DebateSession } from '../../kernel/instances';
import { sessionManager } from '../../kernel/instances';
import { ConfirmDialog } from '../ConfirmDialog';
import EmptyHistoryState from './EmptyHistoryState';
import HistoryHeader from './HistoryHeader';
import HistoryItem from './HistoryItem';
import { PAGE_SIZE } from './history-constants';

interface DebateHistoryPanelProps {
    history: DebateSession[];
    expandedHistory: Set<string>;
    onToggleExpand: (id: string) => void;
    onRefresh: () => void;
    t: (key: string) => string;
}

const DebateHistoryPanel: React.FC<DebateHistoryPanelProps> = ({
    history,
    expandedHistory,
    onToggleExpand,
    onRefresh,
    t,
}) => {
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const [searchQuery, setSearchQuery] = useState('');
    const [strategyFilter, setStrategyFilter] = useState<string>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const strategies = useMemo(() => [...new Set(history.map((h) => h.strategy))], [history]);

    const filtered = useMemo(() => {
        let f = history;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            f = f.filter((h) => h.topic.toLowerCase().includes(q));
        }
        if (strategyFilter !== 'all') f = f.filter((h) => h.strategy === strategyFilter);
        return f;
    }, [history, searchQuery, strategyFilter]);

    const stats = useMemo(() => {
        if (filtered.length === 0) return null;
        const totalArgs = filtered.reduce((s, h) => s + (h.arguments?.length ?? 0), 0);
        const allRounds = filtered.map((h) => h.currentRound);
        return {
            total: filtered.length,
            avgArgs: Math.round(totalArgs / filtered.length),
            avgRounds: Math.round(allRounds.reduce((s, r) => s + r, 0) / filtered.length),
            longestArgs: Math.max(...filtered.map((h) => h.arguments?.length ?? 0)),
            longestRounds: Math.max(...allRounds),
        };
    }, [filtered]);

    const handleRestore = (id: string) => {
        const session = sessionManager.restoreDebateSession(id);
        if (session) onRefresh();
    };

    const handleDelete = (id: string) => setDeleteConfirm(id);
    const confirmDelete = () => {
        if (deleteConfirm) {
            sessionManager.deleteDebateHistory(deleteConfirm);
            onRefresh();
            setDeleteConfirm(null);
        }
    };

    const visible = filtered.slice(0, displayCount);
    const hasMore = visible.length < filtered.length;

    if (history.length === 0) return <EmptyHistoryState t={t} />;

    return (
        <div
            className="glass-panel"
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <HistoryHeader
                count={history.length}
                filteredCount={filtered.length}
                stats={stats}
                searchQuery={searchQuery}
                strategyFilter={strategyFilter}
                strategies={strategies}
                onSearchChange={setSearchQuery}
                onStrategyChange={setStrategyFilter}
                onRefresh={onRefresh}
                t={t}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <AnimatePresence>
                    {visible.map((h) => (
                        <HistoryItem
                            key={h.id}
                            session={h}
                            isExpanded={expandedHistory.has(h.id)}
                            onToggleExpand={() => onToggleExpand(h.id)}
                            onRestore={handleRestore}
                            onArchive={() => {}}
                            onDelete={handleDelete}
                            onRefresh={onRefresh}
                            sessionManager={sessionManager}
                            t={t}
                        />
                    ))}
                </AnimatePresence>

                {hasMore && (
                    <button
                        onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                        }}
                    >
                        <ChevronsDown size={16} />
                        {t('debate.load_more').replace(
                            '{0}',
                            String(filtered.length - visible.length),
                        )}
                    </button>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteConfirm}
                title={t('debate.delete')}
                message={t('debate.delete_confirm')}
                variant="danger"
                confirmLabel={t('debate.delete')}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
};

export default DebateHistoryPanel;
