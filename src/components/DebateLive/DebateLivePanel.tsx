import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import { CircularLayout } from './CircularLayout';
import { JudgeCenter } from './JudgeCenter';
import { SocratesMascot } from './SocratesMascot';
import { debateEngine, qualityImpactCollector } from '../../kernel/instances';
import { ARENA_LAYOUTS } from '../../kernel/contracts/debate-emotion';
import type { ArenaLayout } from '../../kernel/contracts/debate-emotion';
import { useTranslation } from '../../i18n/useTranslation';
import { getTechniques } from '../../kernel/services/debate-runtime/quality-settings-store';

const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
};

const CATEGORY_COLORS: Record<string, string> = {
    P0: '#22c55e',
    P1: '#3b82f6',
    P2: '#a855f7',
};

const TECHNIQUE_CATEGORY_MAP = new Map<string, string>(
    getTechniques().map((t) => [t.id, t.category]),
);

export const DebateLivePanel: React.FC = () => {
    const { t } = useTranslation();
    const agentEvents = useDebateLiveStore((s) => s.agentEvents);
    const streamingContent = useDebateLiveStore((s) => s.streamingContent);
    const currentThinking = useDebateLiveStore((s) => s.currentThinking);
    void agentEvents;

    const sessions = debateEngine.getAllSessions();
    const [activeSessionId, setActiveSessionId] = React.useState<string | null>(() =>
        sessions.length > 0 ? sessions[sessions.length - 1]!.id : null,
    );
    const [layout, setLayout] = React.useState<ArenaLayout>('circle');
    const [metricsByCategory, setMetricsByCategory] = useState<Record<string, number>>({});
    const [totalActivations, setTotalActivations] = useState(0);

    const refreshImpact = useCallback(() => {
        try {
            const all = qualityImpactCollector.getAllMetrics();
            const total = all.reduce((s, m) => s + m.totalActivations, 0);
            setTotalActivations(total);
            const byCat: Record<string, number> = {};
            for (const m of all) {
                const cat = TECHNIQUE_CATEGORY_MAP.get(m.techniqueId) ?? 'P2';
                byCat[cat] = (byCat[cat] ?? 0) + m.totalActivations;
            }
            setMetricsByCategory(byCat);
        } catch {
            /* not initialized */
        }
    }, []);

    useEffect(() => {
        refreshImpact();
        const id = setInterval(refreshImpact, 5000);
        return () => clearInterval(id);
    }, [refreshImpact]);

    React.useEffect(() => {
        if (activeSessionId === null && sessions.length > 0) {
            setActiveSessionId(sessions[sessions.length - 1]!.id);
        }
    }, [activeSessionId, sessions]);

    const sessionIndex = useMemo(
        () => sessions.findIndex((s) => s.id === activeSessionId),
        [sessions, activeSessionId],
    );
    const session = sessionIndex >= 0 ? sessions[sessionIndex] : null;
    const participants = session?.topology.nodes.filter((n) => n.role !== 'judge') ?? [];
    const judge = session?.topology.nodes.find((n) => n.role === 'judge') ?? null;

    let activeSpeakerId: string | null = null;
    if (session) {
        for (const p of participants) {
            if (streamingContent.get(`${session.id}:${p.id}`)) {
                activeSpeakerId = p.id;
                break;
            }
        }
        if (!activeSpeakerId) {
            for (const p of participants) {
                if (currentThinking.get(`${session.id}:${p.id}`)) {
                    activeSpeakerId = p.id;
                    break;
                }
            }
        }
    }

    return (
        <div style={containerStyle}>
            <div
                style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    zIndex: 10,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <select
                    value={activeSessionId ?? ''}
                    onChange={(e) => setActiveSessionId(e.target.value || null)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                    }}
                >
                    {sessions.length === 0 && (
                        <option value="">{t('debate_live.no_active')}</option>
                    )}
                    {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.topic} (R{s.round})
                        </option>
                    ))}
                </select>

                <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as ArenaLayout)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                    }}
                >
                    {ARENA_LAYOUTS.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.icon} {l.label}
                        </option>
                    ))}
                </select>

                {session && (
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-500)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.3)',
                        }}
                        aria-live="polite"
                        role="status"
                    >
                        {session.phase} · {t('debate_live.round_label', { n: session.round })}
                    </span>
                )}
                {totalActivations > 0 && (
                    <span
                        style={{
                            display: 'flex',
                            gap: 4,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {['P0', 'P1', 'P2'].map((cat) => {
                            const count = metricsByCategory[cat] ?? 0;
                            if (count === 0) return null;
                            return (
                                <span
                                    key={cat}
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: CATEGORY_COLORS[cat],
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        background: `${CATEGORY_COLORS[cat]}22`,
                                        border: `1px solid ${CATEGORY_COLORS[cat]}44`,
                                    }}
                                    title={`${cat} technique activations: ${count}`}
                                >
                                    ✦{cat} {count}
                                </span>
                            );
                        })}
                    </span>
                )}
            </div>
            {session ? (
                <>
                    <CircularLayout
                        participants={participants}
                        activeSpeakerId={activeSpeakerId}
                        sessionId={session.id}
                        layout={layout}
                    />
                    {judge && (
                        <JudgeCenter judge={judge} sessionId={session.id} phase={session.phase} />
                    )}
                    <SocratesMascot />
                </>
            ) : (
                <div style={{ color: 'var(--slate-500)', fontSize: '0.9rem', textAlign: 'center' }}>
                    {t('debate_live.empty')}
                </div>
            )}
        </div>
    );
};

export default DebateLivePanel;
