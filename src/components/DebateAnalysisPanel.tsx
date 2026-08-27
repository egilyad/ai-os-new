import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Brain, AlertTriangle, TrendingUp, Activity, BarChart3, X } from 'lucide-react';
import { PanelSkeleton } from './Common/Skeleton';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/useTranslation';
import { sessionManager, debateService } from '../kernel/instances';
import { analyzeDebate } from '../kernel/utils/debate-analysis';
import type { DebateAnalysis } from '../kernel/utils/debate-analysis';
import { errorContainer, dismissBtnRed } from '../styles/common';
import { StatCard, FallacyCard, PersuasionCard, ToneChart } from './components';

const DebateAnalysisPanel: React.FC = () => {
    const { t, lang } = useTranslation();
    const [sessionId, setSessionId] = useState<string>('');
    const [availableSessions, setAvailableSessions] = useState<
        Array<{ id: string; topic: string }>
    >([]);
    const [analysis, setAnalysis] = useState<DebateAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        try {
            const active = debateService.getActiveDebateSession();
            if (active && isMountedRef.current) {
                setAvailableSessions([{ id: active.id, topic: active.topic }]);
                if (!sessionId) setSessionId(active.id);
            }
        } catch (err) {
            if (isMountedRef.current) setError(String(err));
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [sessionId]);

    const runAnalysis = useMemo(() => {
        if (!sessionId) return null;
        try {
            const active = debateService.getActiveDebateSession();
            const session =
                active?.id === sessionId
                    ? active
                    : sessionManager.getDebateHistory().find((s) => s.id === sessionId);
            if (!session) return null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const args = (session.arguments ?? []).map((a: any) => ({
                agentId: a.agentId,
                content: a.content,
                confidence: typeof a.confidence === 'number' ? a.confidence : 0.5,
                round: a.round ?? 0,
                parentId: a.parentId,
            }));
            return analyzeDebate(args);
        } catch {
            return null;
        }
    }, [sessionId]);

    useEffect(() => {
        if (runAnalysis) setAnalysis(runAnalysis);
    }, [runAnalysis]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}
            >
                <PanelSkeleton />
            </div>
        );
    }

    if (availableSessions.length === 0) {
        return (
            <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
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
                    <Brain size={26} color="#a855f7" /> {t('debate_analysis.title')}
                </h2>
                <p style={{ color: 'var(--slate-400)' }}>{t('debate_analysis.no_sessions')}</p>
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
                        <Brain size={26} color="#a855f7" /> {t('debate_analysis.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('debate_analysis.subtitle')}
                    </p>
                </div>
                <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                        minWidth: 240,
                    }}
                >
                    {availableSessions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.topic.slice(0, 60)}
                            {s.topic.length > 60 ? '...' : ''}
                        </option>
                    ))}
                </select>
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

            {analysis && (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '0.75rem',
                        }}
                    >
                        <StatCard
                            icon={<AlertTriangle size={18} color="#ef4444" />}
                            label={t('debate_analysis.total_fallacies')}
                            value={String(analysis.totalFallacies)}
                            color="#ef4444"
                        />
                        <StatCard
                            icon={<TrendingUp size={18} color="#10b981" />}
                            label={t('debate_analysis.overall_shift')}
                            value={`${(analysis.persuasion.overallShift * 100).toFixed(0)}%`}
                            color="#10b981"
                        />
                        <StatCard
                            icon={<Activity size={18} color="#3b82f6" />}
                            label={t('debate_analysis.volatility')}
                            value={analysis.tone.volatility.toFixed(2)}
                            color="#3b82f6"
                        />
                        <StatCard
                            icon={<BarChart3 size={18} color="#f59e0b" />}
                            label={t('debate_analysis.trend')}
                            value={t(`debate_analysis.trend_${analysis.tone.trend}`)}
                            color="#f59e0b"
                        />
                    </div>

                    {analysis.fallacyStats.length > 0 && (
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                border: '1px solid rgba(239,68,68,0.2)',
                                background: 'rgba(239,68,68,0.04)',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: '#fca5a5',
                                    margin: '0 0 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <AlertTriangle size={16} /> {t('debate_analysis.fallacy_breakdown')}
                            </h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '0.5rem',
                                }}
                            >
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {analysis.fallacyStats.map((f: any) => (
                                    <FallacyCard
                                        key={f.type}
                                        type={f.type}
                                        count={f.count}
                                        severity={f.severity}
                                        description={f.description}
                                        lang={lang}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {analysis.persuasion.byAgent.length > 0 && (
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                border: '1px solid rgba(16,185,129,0.2)',
                                background: 'rgba(16,185,129,0.04)',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: '#6ee7b7',
                                    margin: '0 0 0.75rem',
                                }}
                            >
                                {t('debate_analysis.persuasion')}
                            </h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                    gap: '0.5rem',
                                }}
                            >
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {analysis.persuasion.byAgent.map((p: any) => (
                                    <PersuasionCard key={p.agentId} p={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {analysis.tone.points.length > 0 && (
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                border: '1px solid rgba(59,130,246,0.2)',
                                background: 'rgba(59,130,246,0.04)',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: '#93c5fd',
                                    margin: '0 0 0.75rem',
                                }}
                            >
                                {t('debate_analysis.tone_timeline')}
                            </h3>
                            <ToneChart points={analysis.tone.points} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DebateAnalysisPanel;
