import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Lightbulb,
    Plus,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hypothesisService, eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('HypothesisMarketplace');
import { glassPanel } from '../../styles/common';
import { StorageAdapter } from '../../kernel/services/storage-adapter';
import { useConfirm } from '../../hooks/useConfirm';
import type {
    ResearchHypothesis,
    HypothesisCategory,
    HypothesisStatus,
} from '../../kernel/types/research-types';
import { HYPOTHESIS_CATEGORIES, HYPOTHESIS_STATUSES } from '../../kernel/types/research-types';

const categoryColors: Record<HypothesisCategory, string> = {
    arch: '#3b82f6',
    prompt: '#a855f7',
    routing: '#10b981',
    gov: '#f59e0b',
};

const categoryLabels: Record<HypothesisCategory, string> = {
    arch: 'Architecture',
    prompt: 'Prompt',
    routing: 'Routing',
    gov: 'Governance',
};

const statusColors: Record<HypothesisStatus, string> = {
    proposed: '#64748b',
    active: '#3b82f6',
    debating: '#f59e0b',
    accepted: '#10b981',
    rejected: '#ef4444',
};

const statusIcons: Record<HypothesisStatus, typeof Clock> = {
    proposed: Clock,
    active: Zap,
    debating: MessageSquare,
    accepted: CheckCircle2,
    rejected: XCircle,
};

interface VoteStore {
    [id: string]: { up: number; down: number; myVote?: 'up' | 'down' | null };
}

const loadVotes = (): VoteStore => {
    return StorageAdapter.RESEARCH.getSync<VoteStore>('hypothesis_votes') ?? {};
};

const saveVotes = (votes: VoteStore) => {
    StorageAdapter.RESEARCH.setSync('hypothesis_votes', votes);
};

export const HypothesisMarketplace: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [hypotheses, setHypotheses] = useState<ResearchHypothesis[]>([]);
    const [votes, setVotes] = useState<VoteStore>(loadVotes);
    const [categoryFilter, setCategoryFilter] = useState<HypothesisCategory | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<HypothesisStatus | 'all'>('all');
    const [showPropose, setShowPropose] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState<HypothesisCategory>('arch');
    const [newSourceFile, setNewSourceFile] = useState('');
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const load = async () => {
            try {
                const all = hypothesisService.getAll();
                if (isMountedRef.current) setHypotheses(all);
            } catch (e) {
                LOGGER.warn('HypothesisMarketplace', 'Failed to load', { error: e });
            }
        };
        load();
        const unsub = eventBus.on(EVENTS.HYPOTHESES_UPDATED, load);
        return () => {
            isMountedRef.current = false;
            unsub();
        };
    }, []);

    const filtered = useMemo(() => {
        return hypotheses.filter((h) => {
            if (categoryFilter !== 'all' && h.category !== categoryFilter) return false;
            if (statusFilter !== 'all' && h.status !== statusFilter) return false;
            return true;
        });
    }, [hypotheses, categoryFilter, statusFilter]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const va = votes[a.id];
            const vb = votes[b.id];
            const scoreA = (va?.up || 0) - (va?.down || 0);
            const scoreB = (vb?.up || 0) - (vb?.down || 0);
            return scoreB - scoreA;
        });
    }, [filtered, votes]);

    const handleVote = (id: string, dir: 'up' | 'down') => {
        setVotes((prev) => {
            const current = prev[id] || { up: 0, down: 0, myVote: null };
            const next = { ...prev };
            if (current.myVote === dir) {
                next[id] = { ...current, [dir]: current[dir] - 1, myVote: null };
            } else {
                next[id] = { ...current, [dir]: current[dir] + 1, myVote: dir };
            }
            saveVotes(next);
            return next;
        });
    };

    const handlePropose = async () => {
        if (!newTitle.trim() || !newDescription.trim()) return;
        try {
            await hypothesisService.propose({
                title: newTitle.trim(),
                description: newDescription.trim(),
                category: newCategory,
                sourceFile: newSourceFile.trim() || undefined,
            });
            setNewTitle('');
            setNewDescription('');
            setNewSourceFile('');
            setShowPropose(false);
            setHypotheses(hypothesisService.getAll());
        } catch (e) {
            LOGGER.warn('HypothesisMarketplace', 'Failed to propose', { error: e });
        }
    };

    const handleStatusChange = async (id: string, status: HypothesisStatus) => {
        await hypothesisService.setStatus(id, status);
        setHypotheses(hypothesisService.getAll());
    };

    const handleDelete = async (id: string) => {
        if (
            !(await confirm({
                title: 'Delete Hypothesis',
                message: 'Delete this hypothesis?',
                variant: 'danger',
            }))
        )
            return;
        await hypothesisService.remove(id);
        setHypotheses(hypothesisService.getAll());
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const categoryCounts = hypotheses.reduce(
        (acc, h) => {
            acc[h.category] = (acc[h.category] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );
    const statusCounts = hypotheses.reduce(
        (acc, h) => {
            acc[h.status] = (acc[h.status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    return (
        <div
            style={{
                ...glassPanel,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            padding: '0.5rem',
                            background: 'rgba(245,158,11,0.15)',
                            borderRadius: 10,
                            border: '1px solid rgba(245,158,11,0.3)',
                        }}
                    >
                        <Lightbulb size={20} color="#f59e0b" />
                    </div>
                    <div>
                        <h3
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                margin: 0,
                            }}
                        >
                            Hypothesis Marketplace
                        </h3>
                        <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)', margin: 0 }}>
                            {hypotheses.length} hypotheses • {sorted.length} shown
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowPropose(!showPropose)}
                    style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                        border: 'none',
                        borderRadius: 8,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                    }}
                >
                    <Plus size={14} /> Propose
                </button>
            </div>

            {/* Propose form */}
            <AnimatePresence>
                {showPropose && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '1rem', flexShrink: 0 }}
                    >
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                background: 'rgba(245,158,11,0.05)',
                                border: '1px solid rgba(245,158,11,0.2)',
                            }}
                        >
                            <div
                                style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}
                            >
                                <input
                                    type="text"
                                    placeholder="Hypothesis title..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.8rem',
                                        outline: 'none',
                                    }}
                                />
                                <select
                                    value={newCategory}
                                    onChange={(e) =>
                                        setNewCategory(e.target.value as HypothesisCategory)
                                    }
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.8rem',
                                        outline: 'none',
                                    }}
                                >
                                    {HYPOTHESIS_CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {categoryLabels[c]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                rows={3}
                                placeholder="Describe the hypothesis, expected impact, and supporting evidence..."
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.8rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    marginBottom: '0.5rem',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Source file (optional)..."
                                    value={newSourceFile}
                                    onChange={(e) => setNewSourceFile(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: 'var(--slate-400)',
                                        fontSize: '0.7rem',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    onClick={handlePropose}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: 6,
                                        background: 'var(--warning)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Submit
                                </button>
                                <button
                                    onClick={() => setShowPropose(false)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 6,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-400)',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.3rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={() => setCategoryFilter('all')}
                    style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        borderRadius: 6,
                        border: `1px solid ${categoryFilter === 'all' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                        background:
                            categoryFilter === 'all' ? 'rgba(245,158,11,0.15)' : 'transparent',
                        color: categoryFilter === 'all' ? '#f59e0b' : '#94a3b8',
                        cursor: 'pointer',
                    }}
                >
                    All ({hypotheses.length})
                </button>
                {HYPOTHESIS_CATEGORIES.map((c) => (
                    <button
                        key={c}
                        onClick={() => setCategoryFilter(categoryFilter === c ? 'all' : c)}
                        style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            borderRadius: 6,
                            border: `1px solid ${categoryFilter === c ? categoryColors[c] : 'rgba(255,255,255,0.1)'}`,
                            background:
                                categoryFilter === c ? `${categoryColors[c]}15` : 'transparent',
                            color: categoryFilter === c ? categoryColors[c] : '#94a3b8',
                            cursor: 'pointer',
                        }}
                    >
                        {categoryLabels[c]} ({categoryCounts[c] || 0})
                    </button>
                ))}
                <div
                    style={{
                        width: 1,
                        height: 16,
                        background: 'var(--border-default)',
                        margin: '0 0.2rem',
                    }}
                />
                <button
                    onClick={() => setStatusFilter('all')}
                    style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        borderRadius: 6,
                        border: `1px solid ${statusFilter === 'all' ? '#64748b' : 'rgba(255,255,255,0.1)'}`,
                        background:
                            statusFilter === 'all' ? 'rgba(100,116,139,0.15)' : 'transparent',
                        color: statusFilter === 'all' ? '#94a3b8' : '#94a3b8',
                        cursor: 'pointer',
                    }}
                >
                    Any Status
                </button>
                {HYPOTHESIS_STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                        style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            borderRadius: 6,
                            border: `1px solid ${statusFilter === s ? statusColors[s] : 'rgba(255,255,255,0.1)'}`,
                            background: statusFilter === s ? `${statusColors[s]}15` : 'transparent',
                            color: statusFilter === s ? statusColors[s] : '#94a3b8',
                            cursor: 'pointer',
                        }}
                    >
                        {s} ({statusCounts[s] || 0})
                    </button>
                ))}
            </div>

            {/* Hypothesis list */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                {sorted.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--slate-500)',
                            gap: '0.5rem',
                        }}
                    >
                        <Lightbulb size={32} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            No hypotheses match filters
                        </p>
                    </div>
                ) : (
                    sorted.map((h) => {
                        const v = votes[h.id] || { up: 0, down: 0 };
                        const score = v.up - v.down;
                        const isExpanded = expandedId === h.id;
                        const StatusIcon = statusIcons[h.status]!;
                        return (
                            <motion.div
                                key={h.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s',
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : h.id)}
                            >
                                {/* Votes column */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        minWidth: 40,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => handleVote(h.id, 'up')}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            background:
                                                v.myVote === 'up'
                                                    ? 'rgba(16,185,129,0.2)'
                                                    : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${v.myVote === 'up' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                                            color: v.myVote === 'up' ? '#10b981' : '#94a3b8',
                                            cursor: 'pointer',
                                            display: 'grid',
                                            placeItems: 'center',
                                            padding: 0,
                                        }}
                                    >
                                        <ThumbsUp size={12} />
                                    </button>
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color:
                                                score > 0
                                                    ? '#10b981'
                                                    : score < 0
                                                      ? '#ef4444'
                                                      : '#94a3b8',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {score}
                                    </span>
                                    <button
                                        onClick={() => handleVote(h.id, 'down')}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            background:
                                                v.myVote === 'down'
                                                    ? 'rgba(239,68,68,0.2)'
                                                    : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${v.myVote === 'down' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                            color: v.myVote === 'down' ? '#ef4444' : '#94a3b8',
                                            cursor: 'pointer',
                                            display: 'grid',
                                            placeItems: 'center',
                                            padding: 0,
                                        }}
                                    >
                                        <ThumbsDown size={12} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: '0.3rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                color: 'var(--slate-50)',
                                            }}
                                        >
                                            {h.title}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            marginBottom: '0.4rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.55rem',
                                                fontWeight: 700,
                                                color: categoryColors[h.category],
                                                background: `${categoryColors[h.category]}15`,
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: 4,
                                            }}
                                        >
                                            {categoryLabels[h.category]}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.55rem',
                                                fontWeight: 700,
                                                color: statusColors[h.status],
                                                background: `${statusColors[h.status]}15`,
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 3,
                                            }}
                                        >
                                            <StatusIcon size={8} /> {h.status}
                                        </span>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--slate-500)' }}>
                                            {formatDate(h.createdAt)}
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                            margin: 0,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {isExpanded
                                            ? h.description
                                            : h.description.slice(0, 120) +
                                              (h.description.length > 120 ? '…' : '')}
                                    </p>

                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            style={{
                                                marginTop: '0.6rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                            }}
                                        >
                                            {h.sourceFile && (
                                                <div
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        color: 'var(--slate-500)',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    Source:{' '}
                                                    <span style={{ color: 'var(--slate-400)' }}>
                                                        {h.sourceFile}
                                                    </span>
                                                </div>
                                            )}
                                            {h.metricsDelta && (
                                                <div
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--success)',
                                                        background: 'rgba(16,185,129,0.08)',
                                                        padding: '0.3rem 0.5rem',
                                                        borderRadius: 6,
                                                    }}
                                                >
                                                    Expected impact: {h.metricsDelta}
                                                </div>
                                            )}
                                            {h.evidenceRefs.length > 0 && (
                                                <div
                                                    style={{ fontSize: '0.6rem', color: 'var(--slate-400)' }}
                                                >
                                                    Evidence: {h.evidenceRefs.join(', ')}
                                                </div>
                                            )}
                                            {h.linkedDebateId && (
                                                <div
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        color: '#a855f7',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <MessageSquare size={10} /> Linked debate:{' '}
                                                    {h.linkedDebateId}
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.3rem',
                                                    marginTop: '0.3rem',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {HYPOTHESIS_STATUSES.filter((s) => s !== h.status)
                                                    .slice(0, 3)
                                                    .map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() =>
                                                                handleStatusChange(h.id, s)
                                                            }
                                                            style={{
                                                                padding: '0.2rem 0.4rem',
                                                                fontSize: '0.55rem',
                                                                fontWeight: 700,
                                                                borderRadius: 4,
                                                                border: `1px solid ${statusColors[s]}40`,
                                                                background: `${statusColors[s]}10`,
                                                                color: statusColors[s],
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            → {s}
                                                        </button>
                                                    ))}
                                                <button
                                                    onClick={() => handleDelete(h.id)}
                                                    style={{
                                                        padding: '0.2rem 0.4rem',
                                                        fontSize: '0.55rem',
                                                        fontWeight: 700,
                                                        borderRadius: 4,
                                                        border: '1px solid rgba(239,68,68,0.3)',
                                                        background: 'var(--error-tint)',
                                                        color: 'var(--error)',
                                                        cursor: 'pointer',
                                                        marginLeft: 'auto',
                                                    }}
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
            <ConfirmDialog />
        </div>
    );
};
