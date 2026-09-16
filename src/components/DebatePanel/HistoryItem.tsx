import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    ChevronDown,
    ChevronRight,
    RotateCcw,
    Archive,
    Trash2,
    Filter,
} from 'lucide-react';
import { flex1Min0 } from '../../styles/common';
import { ROLE_ICONS } from './history-constants';
import HistoryArgumentRow from './HistoryArgumentRow';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

interface Participant {
    id: string;
    name?: string;
    role?: string;
}

interface DebateArgument {
    id: string;
    agentId: string;
    agentName?: string;
    round: number;
    position?: string;
    content: string;
    confidence: number;
    provider?: string;
    model?: string;
}

interface DebateSession {
    id: string;
    topic: string;
    createdAt?: number;
    participants?: Participant[];
    currentRound: number;
    maxRounds: number;
    arguments?: DebateArgument[];
    convergenceScore: number;
    strategy?: string;
    consensus?: string;
}

interface HistoryItemProps {
    session: DebateSession;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onRestore: (id: string) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
    sessionManager: { archiveDebateSession: (id: string) => void };
    t: (key: string) => string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
    session: h,
    isExpanded,
    onToggleExpand,
    onRestore,
    onDelete,
    onRefresh,
    sessionManager,
    t,
}) => {
    const [argDisplayCount, setArgDisplayCount] = useState(6);
    const [agentFilter, setAgentFilter] = useState('all');

    const date = new Date(h.createdAt || 0);
    const agentOptions = Array.from(
        (h.arguments ?? []).reduce(
            (acc, arg) => acc.set(arg.agentId, arg.agentName || arg.agentId),
            new Map<string, string>(),
        ),
    );
    const filteredArguments =
        agentFilter === 'all'
            ? (h.arguments ?? [])
            : (h.arguments ?? []).filter((arg) => arg.agentId === agentFilter);
    const visibleArguments = filteredArguments.slice(0, argDisplayCount);

    const handleArchive = (e: React.MouseEvent) => {
        e.stopPropagation();
        sessionManager.archiveDebateSession(h.id);
        onRefresh();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
            <div
                onClick={onToggleExpand}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleExpand();
                    }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                style={{
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(59,130,246,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <MessageSquare size={20} color="#3b82f6" />
                </div>
                <div style={flex1Min0}>
                    <div
                        style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: 'var(--slate-50)',
                            marginBottom: '0.25rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {h.topic}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.8rem',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <span>
                            {(h.participants ?? []).length} {t('debate.participants')}
                        </span>
                        <span>
                            {h.currentRound}/{h.maxRounds} {t('debate.rounds')}
                        </span>
                        <span>
                            {(h.arguments ?? []).length} {t('debate.arguments')}
                        </span>
                        {date.getTime() > 0 && (
                            <span>
                                {date.toLocaleDateString()} {date.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRestore(h.id);
                        }}
                        style={{
                            background: 'var(--success-tint)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: 8,
                            padding: 6,
                            color: 'var(--success)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                        }}
                        title={t('debate.restore')}
                        aria-label={t('debate.restore')}
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        onClick={handleArchive}
                        style={{
                            background: 'var(--warning-tint)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 8,
                            padding: 6,
                            color: 'var(--warning)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                        }}
                        title={t('debate.archive')}
                        aria-label={t('debate.archive')}
                    >
                        <Archive size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(h.id);
                        }}
                        style={{
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 8,
                            padding: 6,
                            color: 'var(--error)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                        }}
                        title={t('debate.delete')}
                        aria-label={t('debate.delete')}
                    >
                        <Trash2 size={14} />
                    </button>
                    <div
                        style={{
                            padding: '2px 10px',
                            borderRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                                h.convergenceScore > 75
                                    ? 'rgba(16,185,129,0.15)'
                                    : h.convergenceScore > 40
                                      ? 'rgba(245,158,11,0.15)'
                                      : 'rgba(239,68,68,0.15)',
                            color:
                                h.convergenceScore > 75
                                    ? '#10b981'
                                    : h.convergenceScore > 40
                                      ? '#f59e0b'
                                      : '#ef4444',
                        }}
                    >
                        {Math.round(h.convergenceScore)}%
                    </div>
                    {isExpanded ? (
                        <ChevronDown size={18} color="#64748b" />
                    ) : (
                        <ChevronRight size={18} color="#64748b" />
                    )}
                </div>
            </div>

            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        padding: '1rem 1.25rem',
                        maxHeight: 400,
                        overflowY: 'auto',
                    }}
                >
                    {h.consensus && (
                        <div
                            style={{
                                marginBottom: '1rem',
                                padding: '0.75rem 1rem',
                                background: 'rgba(16,185,129,0.08)',
                                borderRadius: 12,
                                border: '1px solid rgba(16,185,129,0.15)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: 'var(--success)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {t('debate.consensus')}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--slate-200)', lineHeight: 1.5 }}>
                                {h.consensus}
                            </div>
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                        }}
                    >
                        {(h.participants ?? []).map((p) => (
                            <span
                                key={p.id}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background:
                                        p.role === 'pro'
                                            ? 'rgba(59,130,246,0.15)'
                                            : p.role === 'con'
                                              ? 'rgba(239,68,68,0.15)'
                                              : 'rgba(148,163,184,0.15)',
                                    color:
                                        p.role === 'pro'
                                            ? '#3b82f6'
                                            : p.role === 'con'
                                              ? '#ef4444'
                                              : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {(ROLE_ICONS as Record<string, React.ReactNode>)[p.role ?? ''] ||
                                    null}{' '}
                                {p.name || resolveAgentIdentity(p.id).displayName}
                            </span>
                        ))}
                    </div>
                    {agentOptions.length > 1 && (
                        <div
                            style={{
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <Filter size={12} color="#64748b" />
                            <select
                                value={agentFilter}
                                onChange={(e) => {
                                    setAgentFilter(e.target.value);
                                    setArgDisplayCount(6);
                                }}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 6,
                                    border: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--slate-200)',
                                    fontSize: '0.7rem',
                                    outline: 'none',
                                }}
                                aria-label={t('debate.filter_agent')}
                            >
                                <option value="all">{t('debate.all_agents')}</option>
                                {agentOptions.map(([agentId, agentName]) => (
                                    <option key={agentId} value={agentId}>
                                        {agentName}
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                {filteredArguments.length}/{h.arguments?.length ?? 0}{' '}
                                {t('debate.arguments')}
                            </span>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {visibleArguments.map((arg) => (
                            <HistoryArgumentRow key={arg.id} arg={arg} />
                        ))}
                    </div>
                    {filteredArguments.length > argDisplayCount ? (
                        <button
                            onClick={() =>
                                setArgDisplayCount((p) =>
                                    Math.min(p + 10, filteredArguments.length),
                                )
                            }
                            style={{
                                marginTop: '0.75rem',
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: '0.35rem 1rem',
                                color: 'var(--slate-500)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                fontWeight: 600,
                            }}
                        >
                            +{filteredArguments.length - argDisplayCount}{' '}
                            {t('debate.more_arguments') || 'more arguments'}
                        </button>
                    ) : filteredArguments.length > 6 ? (
                        <button
                            onClick={() => setArgDisplayCount(6)}
                            style={{
                                marginTop: '0.75rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-500)',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            {t('debate.show_less') || 'Show less'}
                        </button>
                    ) : null}
                </motion.div>
            )}
        </motion.div>
    );
};

export default HistoryItem;
