import React, { useState, useCallback } from 'react';
import { usePolling } from '../Common/usePolling';
import { Thermometer, Gauge, Server, MessageCircle, RefreshCw } from 'lucide-react';
import { pressureMapService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('PressureMapPanel');
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import type {
    PressureMapSnapshot,
    PressureTrendPoint,
    PressureAlert,
} from '../../kernel/instances';
import { CARD, TAB_BTN, pLevelColor } from './pressure-map-constants';
import PressureGauge from './PressureGauge';
import TrendChart from './TrendChart';
import PressureAlerts from './PressureAlerts';
import { ProviderListItem, SessionListItem, BreakdownGrid } from './BreakdownList';
import MiniBar from './MiniBar';

const tabMeta = (t: ReturnType<typeof useTranslation>['t']) => [
    { key: 'global' as const, icon: Gauge, label: t('pressure_map.tab.global'), color: '#f97316' },
    {
        key: 'providers' as const,
        icon: Server,
        label: (count?: number) => t('pressure_map.tab.providers', { count: count ?? 0 }),
        color: 'var(--accent)',
    },
    {
        key: 'sessions' as const,
        icon: MessageCircle,
        label: (count?: number) => t('pressure_map.tab.sessions', { count: count ?? 0 }),
        color: '#a855f7',
    },
];

const PressureMapPanel: React.FC = () => {
    const { t } = useTranslation();
    const [snapshot, setSnapshot] = useState<PressureMapSnapshot | null>(null);
    const [alerts, setAlerts] = useState<PressureAlert[]>([]);
    const [trends, setTrends] = useState<PressureTrendPoint[]>([]);
    const [activeTab, setActiveTab] = useState<'global' | 'providers' | 'sessions'>('global');

    const refresh = useCallback(() => {
        try {
            const snap = pressureMapService.getSnapshot();
            setSnapshot(snap ?? null);
            setAlerts(pressureMapService.getAlerts() ?? []);
            setTrends(pressureMapService.getPressureHistory('global') ?? []);
        } catch {
            LOGGER.warn('PressureMapPanel', 'Failed to load pressure data');
        }
    }, []);

    usePolling(refresh, 10000);

    const handleAck = useCallback((id: string) => {
        pressureMapService.acknowledgeAlert(id);
        setAlerts(pressureMapService.getAlerts());
    }, []);

    if (!snapshot) {
        return (
            <div style={{ padding: 24, color: 'var(--slate-500)', textAlign: 'center' }}>
                {t('pressure_map.loading_text')}
            </div>
        );
    }

    const gc = pLevelColor(snapshot.global.level);
    const tabs = tabMeta(t);

    const tabBtnStyle = (key: string, color: string): React.CSSProperties => ({
        ...TAB_BTN,
        background: activeTab === key ? `${color}26` : 'transparent',
        color: activeTab === key ? color : 'var(--slate-400)',
        borderColor: activeTab === key ? `${color}66` : 'rgba(148,163,184,0.15)',
    });

    return (
        <div
            style={{
                padding: 20,
                maxWidth: 1400,
                margin: '0 auto',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Thermometer size={22} color="#f97316" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                    {t('pressure_map.runtime_title')}
                </h2>
            </div>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                {t('pressure_map.subtitle')}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                {tabs.map((tab) => {
                    const count = tab.key === 'global' ? undefined : snapshot[tab.key]?.length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={tabBtnStyle(tab.key, tab.color)}
                        >
                            <tab.icon size={14} />{' '}
                            {tab.key === 'global'
                                ? tab.label
                                : typeof tab.label === 'function'
                                  ? tab.label(count)
                                  : tab.label}
                        </button>
                    );
                })}
                <div style={{ flex: 1 }} />
                <button
                    onClick={refresh}
                    style={{
                        ...TAB_BTN,
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--slate-400)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <RefreshCw size={14} /> {t('pressure_map.refresh')}
                </button>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr',
                    gap: 16,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        ...CARD,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <PressureGauge score={snapshot.global.score} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: gc.text }}>
                        {(snapshot.global.score * 100).toFixed(0)}
                    </div>
                    <div
                        style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: gc.text,
                        }}
                    >
                        {snapshot.global.level}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            marginTop: 8,
                            fontSize: '0.7rem',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <span>
                            {t('pressure_map.providers_count', {
                                count: snapshot.providers.length,
                            })}
                        </span>
                        <span>
                            {t('pressure_map.sessions_count', { count: snapshot.sessions.length })}
                        </span>
                        <span style={{ color: snapshot.alertCount > 0 ? '#ef4444' : '#22c55e' }}>
                            {t('pressure_map.alerts_count', { count: snapshot.alertCount })}
                        </span>
                    </div>
                </div>
                <TrendChart trends={trends} />
            </div>

            <PressureAlerts alerts={alerts} onAck={handleAck} />

            {activeTab === 'global' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={CARD}>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                                marginBottom: 8,
                            }}
                        >
                            {t('pressure_map.providers_label')}
                        </div>
                        {snapshot.providers.length === 0 ? (
                            <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                                {t('pressure_map.no_providers')}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {snapshot.providers.map((p) => (
                                    <ProviderListItem
                                        key={p.provider}
                                        provider={p.provider}
                                        score={p.score}
                                        level={p.level}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={CARD}>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                                marginBottom: 8,
                            }}
                        >
                            {t('pressure_map.sessions_label')}
                        </div>
                        {snapshot.sessions.length === 0 ? (
                            <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                                {t('pressure_map.no_sessions')}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {snapshot.sessions.map((s) => (
                                    <SessionListItem
                                        key={s.sessionId}
                                        topic={s.topic}
                                        sessionId={s.sessionId}
                                        level={s.level}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'providers' && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 12,
                    }}
                >
                    {snapshot.providers.length === 0 ? (
                        <div
                            style={{ ...CARD, textAlign: 'center', color: 'var(--slate-500)', padding: 40 }}
                        >
                            {t('pressure_map.no_provider_data')}
                        </div>
                    ) : (
                        snapshot.providers.map((p) => {
                            const c = pLevelColor(p.level);
                            return (
                                <div
                                    key={p.provider}
                                    style={{ ...CARD, borderLeft: `3px solid ${c.border}` }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Server size={16} color={c.text} />
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            {p.provider}
                                        </span>
                                        <div style={{ flex: 1 }} />
                                        <span
                                            style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                color: c.text,
                                            }}
                                        >
                                            {(p.score * 100).toFixed(0)}
                                        </span>
                                    </div>
                                    <BreakdownGrid breakdown={p.breakdown} />
                                    <div style={{ marginTop: 8 }}>
                                        <MiniBar pct={p.score} color={c.text} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'sessions' && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 12,
                    }}
                >
                    {snapshot.sessions.length === 0 ? (
                        <div
                            style={{ ...CARD, textAlign: 'center', color: 'var(--slate-500)', padding: 40 }}
                        >
                            {t('pressure_map.no_session_data')}
                        </div>
                    ) : (
                        snapshot.sessions.map((s) => {
                            const c = pLevelColor(s.level);
                            return (
                                <div
                                    key={s.sessionId}
                                    style={{ ...CARD, borderLeft: `3px solid ${c.border}` }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <MessageCircle size={16} color={c.text} />
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            {s.topic || s.sessionId.slice(0, 16)}
                                        </span>
                                        <div style={{ flex: 1 }} />
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                textTransform: 'uppercase',
                                                fontWeight: 600,
                                                color: c.text,
                                            }}
                                        >
                                            {s.level}
                                        </span>
                                    </div>
                                    <BreakdownGrid breakdown={s.breakdown} />
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <ModuleInfo
                moduleKey="runtime_pressure_map"
                relatedModules={['health', 'debate_runtime']}
            />
        </div>
    );
};

export default PressureMapPanel;
