/**
 * Cognitive-aux / research panel (Experimental).
 * Research engine surface — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useVisibilityInterval } from '../../utils/visibility-interval';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Layers, Plus } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { SourceType } from '../../kernel/contracts/research-engine';
import { researchEngine, sourceAdapterRegistry } from '../../kernel/instances';
import { SOURCE_COLORS } from './research-constants';
import SessionCard from './SessionCard';
import type { ResearchSession } from '../../kernel/contracts/research-engine';

const ResearchEnginePanel: React.FC = () => {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState<ResearchSession[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showSourceConfig, setShowSourceConfig] = useState(false);
    const [enabledSources, setEnabledSources] = useState<SourceType[]>(
        sourceAdapterRegistry.getConfig().enabledSources,
    );
    const refresh = useCallback(() => {
        setSessions(researchEngine.getAllSessions());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);
    useVisibilityInterval(refresh, 2000);

    const handleCreate = async () => {
        if (!newTitle.trim() || !newQuestion.trim()) return;
        try {
            await researchEngine.startSession(newTitle.trim(), newQuestion.trim());
            setNewTitle('');
            setNewQuestion('');
            setShowForm(false);
            refresh();
        } catch {
            /**/
        }
    };

    const handleRun = async (id: string) => {
        try {
            await researchEngine.runLoop(id);
        } catch {
            /* non-critical — run loop failed */
        } finally {
            refresh();
        }
    };

    const handleDelete = (id: string) => {
        researchEngine.deleteSession(id);
        if (expandedId === id) setExpandedId(null);
        refresh();
    };

    const toggleSource = (name: SourceType) => {
        const next = enabledSources.includes(name)
            ? enabledSources.filter((s) => s !== name)
            : [...enabledSources, name];
        setEnabledSources(next);
        sourceAdapterRegistry.updateConfig({ enabledSources: next });
    };

    const allAdapters = sourceAdapterRegistry.getAllAdapters();
    const sourceStats = { total: allAdapters.length, enabled: enabledSources.length };

    return (
        <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: 'var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Layers size={22} color="#8b5cf6" /> {t('research_engine.title')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: 2 }}>
                        {t('research_engine.subtitle')}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setShowSourceConfig(!showSourceConfig)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: 'rgba(100,116,139,0.15)',
                            border: '1px solid rgba(100,116,139,0.3)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                        }}
                        title={`${sourceStats.enabled}/${sourceStats.total} sources enabled`}
                    >
                        <Search size={14} /> {sourceStats.enabled}/{sourceStats.total}{' '}
                        {t('research_engine.sources')}
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: 'rgba(139,92,246,0.15)',
                            border: '1px solid rgba(139,92,246,0.3)',
                            color: 'var(--purple-muted)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                        }}
                    >
                        <Plus size={16} /> {t('research_engine.new_session')}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showSourceConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '1rem' }}
                    >
                        <div
                            style={{
                                background: 'rgba(100,116,139,0.05)',
                                border: '1px solid rgba(100,116,139,0.15)',
                                borderRadius: 12,
                                padding: '0.75rem 1rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: 8,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--slate-400)',
                                }}
                            >
                                <Search size={14} /> {t('research_engine.available_sources')} (
                                {sourceStats.total})
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.65rem',
                                        fontWeight: 400,
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    {sourceStats.enabled} active
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {allAdapters.map((adapter) => {
                                    const isEnabled = enabledSources.includes(adapter.name);
                                    return (
                                        <label
                                            key={adapter.name}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '3px 6px',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: '0.72rem',
                                                color: isEnabled ? '#e2e8f0' : '#475569',
                                                opacity: adapter.isRestricted ? 0.5 : 1,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => toggleSource(adapter.name)}
                                                style={{ accentColor: '#8b5cf6' }}
                                            />
                                            <span
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    background:
                                                        SOURCE_COLORS[adapter.name] || '#64748b',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span style={{ fontWeight: isEnabled ? 600 : 400 }}>
                                                {adapter.displayName}
                                            </span>
                                            {adapter.needsKey && (
                                                <span
                                                    style={{ fontSize: '0.6rem', color: 'var(--warning)' }}
                                                >
                                                    🔑
                                                </span>
                                            )}
                                            {adapter.isRestricted && (
                                                <span
                                                    style={{ fontSize: '0.6rem', color: 'var(--error)' }}
                                                >
                                                    🔒
                                                </span>
                                            )}
                                            <span
                                                style={{
                                                    fontSize: '0.6rem',
                                                    color: 'var(--slate-500)',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                {adapter.category}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '1rem' }}
                    >
                        <div
                            style={{
                                background: 'rgba(139,92,246,0.05)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                borderRadius: 12,
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder={t('research_engine.title_placeholder')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                }}
                            />
                            <textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder={t('research_engine.question_placeholder')}
                                rows={3}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowForm(false)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'transparent',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim() || !newQuestion.trim()}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'rgba(139,92,246,0.3)',
                                        color: '#c4b5fd',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        opacity: !newTitle.trim() || !newQuestion.trim() ? 0.5 : 1,
                                    }}
                                >
                                    {t('research_engine.start')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {sessions.length === 0 && !showForm && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.85rem',
                        border: '1px dashed rgba(255,255,255,0.06)',
                        borderRadius: 12,
                    }}
                >
                    <Layers size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <div>{t('research_engine.empty')}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                        {t('research_engine.empty_desc')}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((session) => (
                    <SessionCard
                        key={session.id}
                        session={session}
                        expanded={expandedId === session.id}
                        onToggle={() =>
                            setExpandedId(expandedId === session.id ? null : session.id)
                        }
                        onRun={() => handleRun(session.id)}
                        onDelete={() => handleDelete(session.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResearchEnginePanel;
