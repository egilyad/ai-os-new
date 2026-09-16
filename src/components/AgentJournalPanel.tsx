import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    BookOpen,
    Plus,
    Trash2,
    X,
    Search,
    Tag,
    Clock,
    Zap,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/useTranslation';
import { eventBus, EVENTS } from '../kernel/instances';
import { agentJournalService } from '../kernel/instances';
import type { JournalEntry } from '../kernel/services/agent-journal-service';
import { errorContainer, dismissBtnRed } from '../styles/common';
import { useConfirm } from '../hooks/useConfirm';
import { StatMini } from './AgentJournalPanel/StatMini';
import { JournalAddForm } from './AgentJournalPanel/JournalAddForm';
import { JournalEntryCard } from './AgentJournalPanel/JournalEntryCard';

const service = agentJournalService;

const AgentJournalPanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEntry, setNewEntry] = useState({
        agentId: '',
        agentName: '',
        taskType: 'general',
        taskDescription: '',
        outcome: 'success' as JournalEntry['outcome'],
        durationMs: 0,
        tokensUsed: 0,
        notes: '',
        tags: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isMountedRef = useRef(true);

    const refresh = useCallback(() => {
        const list = search.trim() ? service.search(search) : service.listAll();
        let filtered = list;
        if (activeTag) filtered = filtered.filter((e) => e.tags.includes(activeTag));
        if (activeAgent) filtered = filtered.filter((e) => e.agentId === activeAgent);
        setEntries(filtered);
    }, [search, activeTag, activeAgent]);

    useEffect(() => {
        isMountedRef.current = true;
        service
            .init()
            .then(() => {
                if (isMountedRef.current) {
                    refresh();
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMountedRef.current) {
                    setError(String(err));
                    setLoading(false);
                }
            });
        const unsub1 = eventBus.on(EVENTS.AGENT_JOURNAL_ADDED, () => {
            if (isMountedRef.current) refresh();
        });
        const unsub2 = eventBus.on(EVENTS.AGENT_JOURNAL_REMOVED, () => {
            if (isMountedRef.current) refresh();
        });
        const unsub3 = eventBus.on(EVENTS.AGENT_JOURNAL_CLEARED, () => {
            if (isMountedRef.current) refresh();
        });
        return () => {
            isMountedRef.current = false;
            unsub1();
            unsub2();
            unsub3();
        };
    }, [refresh]);

    useEffect(() => {
        refresh();
    }, [search, activeTag, activeAgent, refresh]);

    const handleAdd = useCallback(async () => {
        if (!newEntry.agentId.trim() || !newEntry.taskDescription.trim()) {
            setError(t('agent_journal.required_fields'));
            return;
        }
        try {
            await service.record({
                agentId: newEntry.agentId.trim(),
                agentName: newEntry.agentName.trim() || newEntry.agentId.trim(),
                taskType: newEntry.taskType,
                taskDescription: newEntry.taskDescription,
                outcome: newEntry.outcome,
                durationMs: newEntry.durationMs,
                tokensUsed: newEntry.tokensUsed,
                notes: newEntry.notes || undefined,
                tags: newEntry.tags
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            });
            setNewEntry({
                agentId: '',
                agentName: '',
                taskType: 'general',
                taskDescription: '',
                outcome: 'success',
                durationMs: 0,
                tokensUsed: 0,
                notes: '',
                tags: '',
            });
            setShowAddForm(false);
        } catch (err) {
            setError(String(err));
        }
    }, [newEntry, t]);

    const handleDelete = useCallback(
        async (id: string) => {
            if (
                !(await confirm({
                    title: 'Delete Entry',
                    message: 'Delete this journal entry?',
                    variant: 'danger',
                }))
            )
                return;
            try {
                await service.remove(id);
            } catch (e) {
                setError(String(e));
            }
        },
        [confirm],
    );

    const handleClear = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Clear Agent Journal',
                message: t('agent_journal.confirm_clear'),
                variant: 'danger',
            }))
        )
            return;
        try {
            await service.clear();
        } catch (e) {
            setError(String(e));
        }
    }, [t, confirm]);

    const allTags = service.getAllTags();
    const totalEntries = service.count();

    const stats = React.useMemo(() => {
        if (entries.length === 0)
            return {
                success: 0,
                failure: 0,
                partial: 0,
                inProgress: 0,
                totalDuration: 0,
                totalTokens: 0,
            };
        return {
            success: entries.filter((e) => e.outcome === 'success').length,
            failure: entries.filter((e) => e.outcome === 'failure').length,
            partial: entries.filter((e) => e.outcome === 'partial').length,
            inProgress: entries.filter((e) => e.outcome === 'in_progress').length,
            totalDuration: entries.reduce((s, e) => s + e.durationMs, 0),
            totalTokens: entries.reduce((s, e) => s + e.tokensUsed, 0),
        };
    }, [entries]);

    const agentStatsMap = React.useMemo(() => {
        const map = new Map<string, number>();
        const counts = new Map<string, number>();
        for (const e of entries) {
            counts.set(e.agentId, (counts.get(e.agentId) || 0) + 1);
        }
        for (const [agentId] of counts) {
            map.set(agentId, service.getAgentStats(agentId).totalTasks);
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries, service]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
            >
                <Loader2 size={20} className="animate-spin" />
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem',
                overflow: 'auto',
            }}
        >
            <div
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <BookOpen size={26} color="#8b5cf6" /> {t('agent_journal.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('agent_journal.subtitle', { count: totalEntries })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowAddForm((s) => !s)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--purple)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 600,
                        }}
                    >
                        <Plus size={14} /> {t('agent_journal.add')}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={totalEntries === 0}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: totalEntries > 0 ? '#ef4444' : 'rgba(239,68,68,0.2)',
                            color: '#fff',
                            cursor: totalEntries > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Trash2 size={14} /> {t('agent_journal.clear_all')}
                    </button>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={errorContainer}
                >
                    {error}
                    <button onClick={() => setError(null)} style={dismissBtnRed}>
                        <X size={18} />
                    </button>
                </motion.div>
            )}

            <JournalAddForm
                show={showAddForm}
                entry={newEntry}
                onChange={setNewEntry}
                onSave={handleAdd}
                onCancel={() => setShowAddForm(false)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <StatMini
                    icon={<CheckCircle2 size={14} color="#10b981" />}
                    label={t('agent_journal.success')}
                    value={stats.success}
                    color="#10b981"
                />
                <StatMini
                    icon={<AlertCircle size={14} color="#ef4444" />}
                    label={t('agent_journal.failure')}
                    value={stats.failure}
                    color="#ef4444"
                />
                <StatMini
                    icon={<Clock size={14} color="#3b82f6" />}
                    label={t('agent_journal.total_duration')}
                    value={`${(stats.totalDuration / 1000).toFixed(1)}s`}
                    color="#3b82f6"
                />
                <StatMini
                    icon={<Zap size={14} color="#f59e0b" />}
                    label={t('agent_journal.total_tokens')}
                    value={stats.totalTokens.toLocaleString()}
                    color="#f59e0b"
                />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                    <Search
                        size={14}
                        style={{ position: 'absolute', left: 8, top: 8, color: 'var(--slate-400)' }}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('agent_journal.search_placeholder')}
                        style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem 0.4rem 28px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.8rem',
                        }}
                    />
                </div>
                {activeAgent && (
                    <button
                        onClick={() => setActiveAgent(null)}
                        style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 12,
                            border: '1px solid #ef4444',
                            background: 'var(--error-tint)',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        ✕ {entries.find((e) => e.agentId === activeAgent)?.agentName || activeAgent}
                    </button>
                )}
            </div>

            {allTags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Tag size={12} color="#94a3b8" />
                    {allTags.slice(0, 20).map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                            style={{
                                padding: '0.1rem 0.5rem',
                                borderRadius: 10,
                                border: `1px solid ${activeTag === tag ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                background:
                                    activeTag === tag ? 'rgba(139,92,246,0.2)' : 'transparent',
                                color: activeTag === tag ? '#c4b5fd' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.65rem',
                            }}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                {entries.map((e) => (
                    <JournalEntryCard
                        key={e.id}
                        entry={e}
                        totalTasks={agentStatsMap.get(e.agentId) ?? 0}
                        onFilterByAgent={setActiveAgent}
                        onDelete={handleDelete}
                    />
                ))}
                {entries.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                        <BookOpen size={48} color="#475569" />
                        <p style={{ marginTop: '1rem' }}>{t('agent_journal.empty')}</p>
                    </div>
                )}
            </div>

            <ConfirmDialog />
        </div>
    );
};

export default AgentJournalPanel;
