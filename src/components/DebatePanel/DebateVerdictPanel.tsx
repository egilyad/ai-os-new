import React, { useState, useCallback } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Minus,
    Scale,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type {
    DebateVerdict,
    ConclusionType,
    VerdictFeedbackVote,
} from '../../kernel/contracts/debate-types';

const CONCLUSION_ICONS: Record<ConclusionType, React.ReactNode> = {
    consensus: <CheckCircle size={20} color="#10b981" />,
    dominance: <TrendingUp size={20} color="#f59e0b" />,
    stalemate: <AlertTriangle size={20} color="#ef4444" />,
    partial_agreement: <Scale size={20} color="#8b5cf6" />,
    inconclusive: <Minus size={20} color="#6b7280" />,
};

const STANCE_COLORS: Record<string, string> = {
    pro: '#10b981',
    con: '#ef4444',
    neutral: '#6b7280',
};

interface DebateVerdictPanelProps {
    verdict: DebateVerdict;
    sessionId: string;
    onFeedback?: (sessionId: string, vote: VerdictFeedbackVote) => void;
}

export const DebateVerdictPanel: React.FC<DebateVerdictPanelProps> = ({
    verdict,
    sessionId,
    onFeedback,
}) => {
    const { t } = useTranslation();
    const [userVote, setUserVote] = useState<VerdictFeedbackVote | null>(null);
    const [showAllArgs, setShowAllArgs] = useState(false);
    const [expandedArgs, setExpandedArgs] = useState<Set<number>>(new Set());

    const toggleExpand = useCallback((idx: number) => {
        setExpandedArgs((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }, []);

    const handleVote = useCallback(
        (vote: VerdictFeedbackVote) => {
            setUserVote(vote);
            onFeedback?.(sessionId, vote);
        },
        [sessionId, onFeedback],
    );
    const stanceEntries = [
        {
            label: t('debate.verdict.for'),
            count: verdict.keyArguments.filter((a) => a.stance === 'pro').length,
            color: 'var(--success)',
        },
        {
            label: t('debate.verdict.against'),
            count: verdict.keyArguments.filter((a) => a.stance === 'con').length,
            color: 'var(--error)',
        },
        {
            label: t('debate.verdict.neutral'),
            count: verdict.keyArguments.filter((a) => a.stance === 'neutral').length,
            color: '#6b7280',
        },
    ];
    const maxCount = Math.max(1, ...stanceEntries.map((e) => e.count));

    return (
        <div
            style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: '1.5rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                {CONCLUSION_ICONS[verdict.conclusionType]}
                <h3
                    style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                    }}
                >
                    {t('debate.verdict.title')}
                </h3>
                <span
                    style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                    }}
                >
                    {new Date(verdict.generatedAt).toLocaleString()}
                </span>
            </div>

            <p
                style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                    margin: '0 0 1rem',
                }}
            >
                {verdict.summary}
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            marginBottom: 4,
                        }}
                    >
                        {t('debate.verdict.type_label')}
                    </div>
                    <div
                        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}
                    >
                        {t('debate.verdict.' + verdict.conclusionType)}
                    </div>
                </div>
                <div
                    style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            marginBottom: 4,
                        }}
                    >
                        {t('debate.verdict.balance_label')}
                    </div>
                    <div
                        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}
                    >
                        {t('debate.verdict.' + verdict.stanceResult)}
                    </div>
                </div>
                <div
                    style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            marginBottom: 4,
                        }}
                    >
                        {t('debate.verdict.confidence_label')}
                    </div>
                    <div
                        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}
                    >
                        {Math.round((verdict.confidence ?? 0) * 100)}%
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                    }}
                >
                    {t('debate.verdict.argument_ratio')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stanceEntries.map((entry) => (
                        <div
                            key={entry.label}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <span
                                style={{
                                    width: 80,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: entry.color,
                                    textAlign: 'right',
                                }}
                            >
                                {entry.label}
                            </span>
                            <div
                                style={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: 4,
                                    background: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${(entry.count / maxCount) * 100}%`,
                                        height: '100%',
                                        borderRadius: 4,
                                        background: entry.color,
                                        transition: 'width 0.5s ease',
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    width: 24,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                }}
                            >
                                {entry.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {verdict.keyArguments.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            marginBottom: 8,
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('debate.verdict.key_arguments')}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            maxHeight: 200,
                            overflowY: 'auto',
                        }}
                    >
                        {(showAllArgs
                            ? verdict.keyArguments
                            : verdict.keyArguments.slice(0, 5)
                        ).map((arg, _i) => {
                            const isExpanded = expandedArgs.has(_i);
                            const displayContent = isExpanded
                                ? arg.content
                                : arg.content.slice(0, 200);
                            return (
                                <div
                                    key={`${arg.agentName}-${arg.stance}-${_i}`}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.03)',
                                        borderLeft: `3px solid ${STANCE_COLORS[arg.stance]}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            color: STANCE_COLORS[arg.stance],
                                            marginBottom: 2,
                                        }}
                                    >
                                        {arg.agentName} · {arg.stance}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-main)',
                                            lineHeight: 1.4,
                                            cursor:
                                                arg.content.length > 200 ? 'pointer' : undefined,
                                        }}
                                        onClick={() => arg.content.length > 200 && toggleExpand(_i)}
                                        title={
                                            arg.content.length > 200
                                                ? isExpanded
                                                    ? t('debate.verdict.collapse')
                                                    : t('debate.verdict.expand')
                                                : undefined
                                        }
                                    >
                                        {displayContent}
                                        {arg.content.length > 200 && !isExpanded ? '...' : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {verdict.keyArguments.length > 5 && (
                        <button
                            onClick={() => setShowAllArgs((v) => !v)}
                            style={{
                                marginTop: 8,
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                width: '100%',
                            }}
                        >
                            {showAllArgs
                                ? t('debate.verdict.show_less')
                                : `${t('debate.verdict.show_all')} (${verdict.keyArguments.length})`}
                        </button>
                    )}
                </div>
            )}

            <div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                    }}
                >
                    {t('debate.verdict.reasoning')}
                </div>
                <p
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        lineHeight: 1.6,
                        margin: 0,
                    }}
                >
                    {verdict.reasoning}
                </p>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                }}
            >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('debate.verdict.your_rating')}
                </span>
                <button
                    onClick={() => handleVote('agree')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: `1px solid ${userVote === 'agree' ? '#10b981' : 'var(--border)'}`,
                        background:
                            userVote === 'agree'
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(255,255,255,0.04)',
                        color: userVote === 'agree' ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                    }}
                >
                    <ThumbsUp size={14} /> {t('debate.verdict.agree')}
                </button>
                <button
                    onClick={() => handleVote('disagree')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: `1px solid ${userVote === 'disagree' ? '#ef4444' : 'var(--border)'}`,
                        background:
                            userVote === 'disagree'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(255,255,255,0.04)',
                        color: userVote === 'disagree' ? '#ef4444' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                    }}
                >
                    <ThumbsDown size={14} /> {t('debate.verdict.disagree')}
                </button>
                {userVote && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                        {userVote === 'agree'
                            ? t('debate.verdict.thanks')
                            : t('debate.verdict.acknowledged')}
                    </span>
                )}
            </div>
        </div>
    );
};
