import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, Sparkles, Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { getAllSettings, setSetting, qualityImpactCollector } from '../../kernel/instances';
import { QUALITY_TECHNIQUES } from '../../kernel/contracts/debate-quality-settings';
import type { QualityTechnique } from '../../kernel/contracts/debate-quality-settings';
import type { TechniqueImpactMetrics } from '../../kernel/contracts/quality-impact';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const TECHNIQUE_ID = 'rhetorical-device';
const CATEGORY = 'P2';

const CONFIDENCE_COLOR: Record<string, string> = {
    very_high: '#22c55e', high: '#86efac', medium: '#facc15', low: '#f97316', none: '#6b7280',
};

const formatPct = (v: number): string => {
    if (v === 0) return '0%';
    const abs = Math.abs(v);
    if (abs < 0.001) return '<0.1%';
    return (v * 100).toFixed(1) + '%';
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
    P0: <Shield size={16} />,
    P1: <Zap size={16} />,
    P2: <Sparkles size={16} />,
};

const PanelToggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
            width: 38, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: checked ? 'var(--accent, #6366f1)' : 'var(--slate-300, #cbd5e1)',
            position: 'relative', transition: 'background 0.15s',
        }}
    >
        <span style={{
            position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16,
            borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
        }} />
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, padding: 12, background: 'var(--surface, #fff)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--slate-700, #334155)' }}>{title}</div>
        {children}
    </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
    <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--slate-400, #94a3b8)' }}>{text}</div>
);

const Row: React.FC<{ k: string; v: string; color?: string }> = ({ k, v, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ color: 'var(--slate-500, #64748b)' }}>{k}</span>
        <span style={{ fontWeight: 600, color: color ?? 'inherit' }}>{v}</span>
    </div>
);

const FocusSection: React.FC<{ mode: string; args: any[]; agents: any[]; t: (k: string) => string }> = ({ mode, args, agents, t }) => {
    if (mode === 'qa') {
        return (
            <Section title={t('technique.focus_qa')}>
                {args.length === 0 ? <Empty text={t('technique.no_live')} /> : (
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                        {args.slice(0, 12).map((a, i) => (
                            <li key={a.id} style={{ marginBottom: 6 }}>
                                <strong>Q{i + 1}</strong> ({a.agentId}): {a.text ? a.text.slice(0, 180) : ''}
                            </li>
                        ))}
                    </ol>
                )}
            </Section>
        );
    }
    if (mode === 'claims') {
        return (
            <Section title={t('technique.focus_claims')}>
                {args.length === 0 ? <Empty text={t('technique.no_live')} /> : (
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                        {args.slice(0, 14).map((a) => (
                            <li key={a.id} style={{ marginBottom: 6 }}>
                                <span style={{ color: 'var(--slate-500, #64748b)' }}>{a.agentId}</span>: {a.text ? a.text.slice(0, 180) : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        );
    }
    if (mode === 'agents') {
        return (
            <Section title={t('technique.focus_agents')}>
                {agents.length === 0 ? <Empty text={t('technique.no_agents')} /> : (
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                        {agents.slice(0, 14).map((a) => (
                            <li key={a.id}><strong>{a.name}</strong>{a.role ? ' — ' + a.role : ''}</li>
                        ))}
                    </ul>
                )}
            </Section>
        );
    }
    if (mode === 'metrics') {
        return (
            <Section title={t('technique.focus_metrics')}>
                <Empty text={t('technique.metrics_hint')} />
            </Section>
        );
    }
    return (
        <Section title={t('technique.focus_args')}>
            {args.length === 0 ? <Empty text={t('technique.no_live')} /> : (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                    {args.slice(0, 16).map((a) => (
                        <li key={a.id} style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--slate-500, #64748b)' }}>{a.agentId}</span>: {a.text ? a.text.slice(0, 160) : ''}
                        </li>
                    ))}
                </ul>
            )}
        </Section>
    );
};

export const RhetoricalDevicePanel: React.FC = () => {
    const { t, lang } = useTranslation();
    const [enabled, setEnabled] = useState<boolean>(() => {
        try { return getAllSettings()[TECHNIQUE_ID] ?? true; } catch { return true; }
    });
    const [metrics, setMetrics] = useState<TechniqueImpactMetrics | undefined>(undefined);
    const agents = useRealAgents();
    const { args, hasLiveDebate } = useDebateArguments();
    const technique = useMemo<QualityTechnique | undefined>(
        () => QUALITY_TECHNIQUES.find((tc) => tc.id === TECHNIQUE_ID),
        [],
    );

    useEffect(() => {
        const update = () => {
            try {
                const all = qualityImpactCollector.getAllMetrics();
                setMetrics(all.find((m) => m.techniqueId === TECHNIQUE_ID));
            } catch { /* collector not ready */ }
        };
        update();
        const interval = setInterval(update, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = (v: boolean) => {
        setEnabled(v);
        try { setSetting(TECHNIQUE_ID, v); } catch { /* ignore */ }
    };

    const title = technique ? (lang === 'ru' ? (technique.nameRu || technique.name) : technique.name) : TECHNIQUE_ID;
    const description = technique ? (lang === 'ru' ? (technique.descriptionRu || technique.description) : technique.description) : '';

    return (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--slate-800, #1e293b)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-alt, #f1f5f9)', color: 'var(--accent, #6366f1)' }}>
                    {CATEGORY_ICON[CATEGORY] ?? <Activity size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500, #64748b)' }}>{t('nav.' + TECHNIQUE_ID)}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: CATEGORY === 'P0' ? '#fee2e2' : CATEGORY === 'P1' ? '#ede9fe' : '#e0f2fe', color: CATEGORY === 'P0' ? '#b91c1c' : CATEGORY === 'P1' ? '#6d28d9' : '#0369a1' }}>{CATEGORY}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent, #6366f1)', color: '#fff' }}>Live</span>
                <PanelToggle checked={enabled} onChange={handleToggle} />
            </div>

            {description && (
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--slate-600, #475569)' }}>{description}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <Section title={t('technique.agents')}>
                    {agents.length === 0 ? (
                        <Empty text={t('technique.no_agents')} />
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                            {agents.slice(0, 12).map((a) => (
                                <li key={a.id}><strong>{a.name}</strong>{a.role ? ' — ' + a.role : ''}</li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title={t('technique.live_args')}>
                    {!hasLiveDebate ? (
                        <Empty text={t('technique.no_live')} />
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, maxHeight: 220, overflow: 'auto' }}>
                            {args.slice(0, 20).map((arg) => (
                                <li key={arg.id} style={{ marginBottom: 6 }}>
                                    <span style={{ color: 'var(--slate-500, #64748b)' }}>{arg.agentId}</span>
                                    {arg.text ? ': ' + arg.text.slice(0, 160) + (arg.text.length > 160 ? '…' : '') : ''}
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title={t('technique.impact')}>
                    {!metrics || metrics.totalSessions === 0 ? (
                        <Empty text={t('technique.no_impact')} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                            <Row k={t('technique.judge_delta')} v={(metrics.avgJudgeScoreDelta >= 0 ? '+' : '') + formatPct(metrics.avgJudgeScoreDelta)} />
                            <Row k={t('technique.confidence')} v={metrics.confidence} color={CONFIDENCE_COLOR[metrics.confidence] ?? '#6b7280'} />
                            <Row k={t('technique.activations')} v={String(metrics.totalActivations)} />
                            <Row k={t('technique.sessions')} v={metrics.sampleSizeOn + '/' + metrics.totalSessions} />
                        </div>
                    )}
                </Section>
            </div>

            <FocusSection mode="arguments" args={args} agents={agents} t={t} />
        </div>
    );
};

export default RhetoricalDevicePanel;
