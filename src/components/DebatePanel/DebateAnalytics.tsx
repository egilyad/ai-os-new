import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, Shield, TrendingUp, Zap, Users } from 'lucide-react';
import type { DebateSession } from '../../kernel/instances';
import {
    glassPanelRounded24,
    flexColGap6,
    grid2,
    flexColGap3MarginTop3,
    textMuted,
    textWeight600,
} from '../../styles/common';
import { badgeGreen, badgeAmber } from './debate-analytics-badges';
import GraphMetricsSection from './GraphMetricsSection';
import CausalAnalysisSection from './CausalAnalysisSection';
import QualityMetricsSection from './QualityMetricsSection';
import ActivitySection from './ActivitySection';
import RoundTimeline from './RoundTimeline';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { AgentAvatar } from '../AgentsPanel/AgentAvatar';

interface DebateAnalyticsProps {
    session: DebateSession;
    getAgentLabel: (id: string) => string;
    t: (key: string) => string;
}

const DebateAnalytics: React.FC<DebateAnalyticsProps> = ({ session, getAgentLabel, t }) => {
    const args = React.useMemo(() => session.arguments ?? [], [session.arguments]);
    const voteAlignment = useMemo(() => {
        if (!session.roundVotes) return [];
        return Object.entries(session.roundVotes)
            .map(([roundStr, votes]) => {
                const round = Number(roundStr);
                const roundArgs = args.filter((a) => a.round === round && a.agentId !== 'human');
                const aiPick =
                    roundArgs.length > 0
                        ? roundArgs.reduce((best, arg) =>
                              arg.confidence > best.confidence ? arg : best,
                          ).agentId
                        : null;
                const humanPicks = votes.filter((v) => v.score >= 5).map((v) => v.votedAgentId);
                return {
                    round,
                    humanPicks,
                    aiPick,
                    aligned: aiPick !== null && humanPicks.includes(aiPick),
                };
            })
            .sort((a, b) => a.round - b.round);
    }, [session, args]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            <div className="glass-panel" style={glassPanelRounded24}>
                <h3 className="debate-panel-header">
                    <BarChart3 size={18} color="#10b981" /> {t('debate.analytics')}
                </h3>
                <div style={flexColGap6}>
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem',
                                marginBottom: '0.75rem',
                                fontWeight: 700,
                            }}
                        >
                            <span style={textMuted}>{t('debate.convergence_score')}</span>
                            <span
                                style={{
                                    color:
                                        session.convergenceScore > 75
                                            ? '#10b981'
                                            : session.convergenceScore > 40
                                              ? '#f59e0b'
                                              : '#ef4444',
                                }}
                            >
                                {Math.round(session.convergenceScore)}%
                            </span>
                        </div>
                        <div
                            className="debate-progress-track"
                            role="progressbar"
                            aria-valuenow={Math.round(session.convergenceScore)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={t('debate.convergence_score')}
                        >
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${session.convergenceScore}%` }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    height: '100%',
                                    background:
                                        session.convergenceScore > 75
                                            ? '#10b981'
                                            : session.convergenceScore > 40
                                              ? '#f59e0b'
                                              : '#ef4444',
                                    borderRadius: 4,
                                    boxShadow: `0 0 10px ${session.convergenceScore > 75 ? '#10b981' : session.convergenceScore > 40 ? '#f59e0b' : '#ef4444'}`,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: 'var(--slate-500)',
                                marginTop: '0.75rem',
                                textAlign: 'right',
                                fontWeight: 600,
                            }}
                        >
                            {session.convergenceScore > 85
                                ? t('debate.consensus_strong')
                                : session.convergenceScore > 60
                                  ? t('debate.consensus_moderate')
                                  : session.convergenceScore > 30
                                    ? t('debate.consensus_divergent')
                                    : t('debate.consensus_early')}
                        </div>
                    </div>
                    <div style={grid2}>
                        <div className="debate-stat">
                            <div className="debate-sub-label">{t('debate.total_arguments')}</div>
                            <div className="debate-stat-value">{args.length}</div>
                        </div>
                        <div className="debate-stat">
                            <div className="debate-sub-label">{t('debate.strategy_label')}</div>
                            <div className="debate-stat-value debate-stat-value--sm">
                                {(session.strategy ?? '').replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {voteAlignment.length > 0 && (
                <div className="glass-panel" style={glassPanelRounded24}>
                    <h3 className="debate-panel-header">
                        <Target size={18} color="#a855f7" /> Human vs AI verdict
                    </h3>
                    <div style={flexColGap3MarginTop3}>
                        {voteAlignment.map((row) => (
                            <div
                                key={row.round}
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    padding: '0.3rem',
                                    borderRadius: 6,
                                    background: 'rgba(255,255,255,0.03)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.3rem',
                                    }}
                                >
                                    <span style={textWeight600}>Round {row.round}</span>
                                    <span style={row.aligned ? badgeGreen : badgeAmber}>
                                        {row.aligned ? 'Aligned' : 'Divergent'}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        marginTop: '0.35rem',
                                    }}
                                >
                                    You:{' '}
                                    {row.humanPicks.length > 0
                                        ? row.humanPicks
                                              .map(
                                                  (p) =>
                                                      resolveAgentIdentity(p).displayName ||
                                                      getAgentLabel(p),
                                              )
                                              .join(', ')
                                        : '\u2014'}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        marginTop: '0.2rem',
                                    }}
                                >
                                    AI (top confidence):{' '}
                                    {row.aiPick
                                        ? resolveAgentIdentity(row.aiPick).displayName ||
                                          getAgentLabel(row.aiPick)
                                        : '\u2014'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <GraphMetricsSection session={session} t={t} />

            <CausalAnalysisSection args={args} participants={session.participants ?? []} t={t} />

            {session.status === 'completed' &&
                session.strategy === 'constrained' &&
                session.interpretation?.constraintCorrelation && (
                    <div className="glass-panel" style={glassPanelRounded24}>
                        <h3 className="debate-panel-header">
                            <Shield size={18} color="#10b981" /> {t('debate.constraint_compliance')}
                        </h3>
                        <div style={flexColGap3MarginTop3}>
                            {Object.entries(
                                session.interpretation.constraintCorrelation.byConstraint,
                            ).map(([constraint, data]) => {
                                const pct = Math.round(data.compliance * 100);
                                const color =
                                    pct > 70 ? '#10b981' : pct > 40 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={constraint} style={{ fontSize: '0.78rem' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: 'var(--slate-200)',
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {constraint.replace('_', ' ')}
                                            </span>
                                            <span style={{ color }}>{pct}%</span>
                                        </div>
                                        <div
                                            style={{
                                                height: 6,
                                                borderRadius: 3,
                                                background: 'rgba(255,255,255,0.05)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${pct}%`,
                                                    height: '100%',
                                                    background: color,
                                                    borderRadius: 3,
                                                    transition: 'width 0.5s ease',
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.75rem',
                                                marginTop: '0.25rem',
                                                color: 'var(--slate-500)',
                                                fontSize: '0.65rem',
                                            }}
                                        >
                                            <span>
                                                {t('debate.constraint_depth')}: {data.avgDepth}
                                            </span>
                                            <span>
                                                {t('debate.constraint_confidence')}:{' '}
                                                {data.avgConfidence}
                                            </span>
                                            <span>
                                                {t('debate.constraint_challenge')}:{' '}
                                                {Math.round(data.challengeRate * 100)}%
                                            </span>
                                            <span>
                                                {t('debate.constraint_args')}: {data.count}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            {session.status === 'completed' && session.interpretation && (
                <div className="glass-panel" style={glassPanelRounded24}>
                    <h3 className="debate-panel-header">
                        <TrendingUp size={18} color="#a855f7" /> {t('debate.analysis')}
                    </h3>
                    <p
                        style={{
                            fontSize: '0.78rem',
                            color: 'var(--slate-400)',
                            lineHeight: 1.5,
                            margin: '0.75rem 0',
                        }}
                    >
                        {session.interpretation.summary}
                    </p>
                    {session.interpretation.disagreementPeak && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 8,
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.15)',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <Zap size={14} color="#ef4444" />
                            <div style={{ fontSize: '0.72rem', color: 'var(--slate-200)' }}>
                                <strong>{t('debate.disagreement_peak')}</strong>{' '}
                                {t('debate.at_round')}{' '}
                                {session.interpretation.disagreementPeak.round} (
                                {t('debate.intensity')}:{' '}
                                {Math.round(
                                    session.interpretation.disagreementPeak.intensity * 100,
                                )}
                                %)
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {session.interpretation.insights.map((insight, idx) => (
                            <div
                                key={`insight-${idx}`}
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    fontSize: '0.72rem',
                                    color: 'var(--slate-300)',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span style={{ color: '#a855f7', flexShrink: 0 }}>{'\u25B8'}</span>
                                <span>{insight}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <QualityMetricsSection session={session} args={args} t={t} />
            <ActivitySection session={session} t={t} />
            <RoundTimeline session={session} args={args} t={t} />

            <div
                className="glass-panel"
                style={{
                    padding: '1.5rem',
                    borderRadius: 24,
                    border: '1px solid rgba(255,255,255,0.05)',
                    flex: 1,
                }}
            >
                <h3 className="debate-panel-header">
                    <Users size={18} color="#3b82f6" /> {t('debate.active_participants')}
                </h3>
                <motion.div
                    layout
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                    {[...(session.participants ?? [])]
                        .reduce<typeof session.participants>((acc, p) => {
                            if (!acc.find((e) => e.id === p.id)) acc.push(p);
                            return acc;
                        }, [])
                        .map((p, idx) => {
                            const agentCount = args.filter((a) => a.agentId === p.id).length;
                            const identity = resolveAgentIdentity(p.id);
                            return (
                                <motion.div
                                    key={`${p.id}-${idx}`}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: 'spring', delay: idx * 0.1 }}
                                    className="debate-participant"
                                >
                                    <AgentAvatar
                                        agentId={p.id}
                                        name={identity.displayName}
                                        size={44}
                                        emoji={identity.avatar.emoji}
                                        color={identity.avatar.color}
                                        url={identity.avatar.url}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div
                                            className="debate-agent-name"
                                            style={{ fontSize: '0.95rem' }}
                                        >
                                            {identity.displayName || getAgentLabel(p.id)}
                                        </div>
                                        <div className="debate-secondary-text">
                                            {identity.baseRole ? `${identity.baseRole} · ` : ''}
                                            {agentCount} {t('debate.total_arguments').toLowerCase()}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                </motion.div>
            </div>
        </div>
    );
};

export default DebateAnalytics;
