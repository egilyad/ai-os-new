import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Activity,
    Globe,
    Clock,
    TrendingUp,
    CheckCircle2,
    Zap,
    Shield,
    DollarSign,
} from 'lucide-react';
import { usePolling } from './Common/usePolling';
import ProviderIcon from './ProviderIcon/ProviderIcon';
import { kernel, keyStateStore } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { useNow } from '../hooks/useNow';
import type { HealthEvent } from '../kernel/instances';
import type { SystemState } from '../kernel/types/metrics-types';

const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({
    data,
    color,
    height = 32,
}) => {
    if (data.length < 2)
        return (
            <div
                style={{
                    height,
                    fontSize: '0.65rem',
                    color: 'var(--slate-500)',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                insufficient data
            </div>
        );
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80;
    const points = data
        .map(
            (v, i) =>
                `${((i / (data.length - 1)) * w).toFixed(0)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(0)}`,
        )
        .join(' ');
    return (
        <svg width={w} height={height} style={{ display: 'block' }}>
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            </defs>
            <polyline
                fill={`url(#sg-${color.replace('#', '')})`}
                points={`0,${height} ${points} ${w},${height}`}
            />
            <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} />
        </svg>
    );
};

const SparklineMemo = React.memo(Sparkline);

const ProviderDashboard: React.FC = () => {
    const { t } = useTranslation();
    const now = useNow(30_000);
    const [state, setState] = useState<SystemState>(() => {
        try {
            return kernel.getState();
        } catch {
            return null!;
        }
    });
    const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
    const [keyStates, setKeyStates] = useState(() => {
        try {
            return keyStateStore.getAll();
        } catch {
            return [];
        }
    });
    const [lastUpdated, setLastUpdated] = useState(Date.now);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    usePolling(() => {
        if (!mountedRef.current) return;
        try {
            setState(kernel.getState());
            setHealthEvents(kernel.getHealthEvents());
            setKeyStates(keyStateStore.getAll());
            setLastUpdated(Date.now());
        } catch {
            /* kernel not ready */
        }
    }, 5000);

    const providers = useMemo(() => {
        const all = Object.entries(state?.providers || {}).map(([name, p]) => ({ name, ...p }));
        const keys = keyStates || [];
        return all.map((p) => {
            const matchingKeys = keys.filter((k) => k.provider === p.name);
            const totalQuota = matchingKeys.reduce((s, k) => s + (k?.quota?.limitRequests || 0), 0);
            const usedQuota = matchingKeys.reduce((s, k) => s + (k?.quota?.usedRequests || 0), 0);
            const circuitOpen = matchingKeys.some((k) => k?.flags?.circuitOpen);
            const rateLimited = matchingKeys.some((k) => k?.flags?.rateLimited);
            const avgHealth = matchingKeys.length
                ? matchingKeys.reduce((s, k) => s + (k?.healthScore || 0), 0) / matchingKeys.length
                : 0;
            const lats = matchingKeys
                .map((k) => k?.lastProbe?.latency)
                .filter((l): l is number => typeof l === 'number' && l > 0)
                .sort((a, b) => a - b);
            const p50 = lats.length ? lats[Math.floor(lats.length * 0.5)] : 0;
            const p95 = lats.length ? lats[Math.floor(lats.length * 0.95)] : 0;
            const p99 = lats.length ? lats[Math.floor(lats.length * 0.99)] : 0;
            return {
                ...p,
                matchingKeys,
                totalQuota,
                usedQuota,
                circuitOpen,
                rateLimited,
                avgHealth,
                p50,
                p95,
                p99,
                lats,
            };
        });
    }, [state?.providers, keyStates]);

    const latencyHistory = state?.history?.slice(-30).map((h) => h.ttft) || [];
    const totalKeys = keyStates?.length || 0;
    const activeKeys =
        keyStates?.filter((k) => k.status === 'ready' || k.status === 'limited').length || 0;
    const avgLatency = providers.length
        ? providers.reduce((s, p) => s + p.avgTTFT, 0) / providers.length
        : 0;
    const totalRequests = state?.totalRequests || 0;
    const totalCost = state?.estimatedCost || 0;

    return (
        <div
            style={{
                padding: '1.5rem',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                }}
            >
                <Activity size={20} color="#8b5cf6" aria-hidden="true" />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                    {t('provider_dashboard.title')}
                </h2>
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                    Last updated: {Math.round((now - lastUpdated) / 1000)}s ago
                </span>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {[
                    {
                        icon: <Globe size={18} />,
                        label: t('provider_dashboard.providers'),
                        value: providers.length.toString(),
                        color: 'var(--purple)',
                    },
                    {
                        icon: <CheckCircle2 size={18} />,
                        label: t('provider_dashboard.active_keys'),
                        value: `${activeKeys}/${totalKeys}`,
                        color: 'var(--success)',
                    },
                    {
                        icon: <Clock size={18} />,
                        label: t('provider_dashboard.avg_latency'),
                        value: `${avgLatency.toFixed(0)}ms`,
                        color: 'var(--warning)',
                    },
                    {
                        icon: <TrendingUp size={18} />,
                        label: t('provider_dashboard.total_requests'),
                        value: totalRequests.toLocaleString(),
                        color: 'var(--accent)',
                    },
                    {
                        icon: <DollarSign size={18} />,
                        label: t('provider_dashboard.estimated_cost'),
                        value: `$${totalCost.toFixed(4)}`,
                        color: 'var(--success)',
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        style={{
                            padding: '1rem',
                            borderRadius: 12,
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                color: card.color,
                                fontSize: '0.75rem',
                            }}
                        >
                            {card.icon}
                            {card.label}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-200)' }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {providers.map((p) => {
                    const statusColor =
                        p.status === 'healthy'
                            ? '#22c55e'
                            : p.status === 'degraded'
                              ? '#f59e0b'
                              : '#ef4444';
                    return (
                        <div
                            key={p.name}
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <ProviderIcon provider={p.name} size={16} />
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {p.name}
                                </span>
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        padding: '2px 8px',
                                        borderRadius: 10,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: statusColor,
                                        background: `${statusColor}20`,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {p.status}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {/* Note: uses global latency history — per-provider history requires kernel data model change */}
                                <SparklineMemo data={latencyHistory} color="#8b5cf6" height={28} />
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        textAlign: 'right',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <div>
                                        TTFT{' '}
                                        <span style={{ color: 'var(--slate-400)' }}>
                                            {p.avgTTFT.toFixed(0)}ms
                                        </span>
                                    </div>
                                    <div>
                                        TPS{' '}
                                        <span style={{ color: 'var(--slate-400)' }}>
                                            {p.avgTPS.toFixed(1)}
                                        </span>
                                    </div>
                                    <div>
                                        Rel{' '}
                                        <span style={{ color: 'var(--slate-400)' }}>
                                            {(p.reliability * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.35rem',
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                }}
                            >
                                <div>
                                    Requests:{' '}
                                    <span style={{ color: 'var(--slate-200)' }}>{p.totalRequests}</span>
                                </div>
                                <div>
                                    Selection:{' '}
                                    <span style={{ color: 'var(--slate-200)' }}>
                                        {(p.selectionRate * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div>
                                    Health:{' '}
                                    <span
                                        style={{
                                            color:
                                                p.avgHealth > 60
                                                    ? '#22c55e'
                                                    : p.avgHealth > 30
                                                      ? '#f59e0b'
                                                      : '#ef4444',
                                        }}
                                    >
                                        {p.avgHealth.toFixed(0)}
                                    </span>
                                </div>
                                {p.matchingKeys.length > 0 && (
                                    <div>
                                        Keys:{' '}
                                        <span style={{ color: 'var(--slate-200)' }}>
                                            {p.matchingKeys.length}
                                        </span>
                                    </div>
                                )}
                                {p.lats && p.lats.length > 0 && (
                                    <div
                                        style={{
                                            gridColumn: '1 / -1',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            borderTop: '1px solid rgba(255,255,255,0.04)',
                                            paddingTop: '0.35rem',
                                            marginTop: '0.15rem',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                            P50 <span style={{ color: 'var(--success)' }}>{p.p50}ms</span>
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                            P95 <span style={{ color: 'var(--warning)' }}>{p.p95}ms</span>
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                            P99 <span style={{ color: 'var(--error)' }}>{p.p99}ms</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            {(p.circuitOpen || p.rateLimited) && (
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        gap: '0.35rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {p.circuitOpen && (
                                        <span
                                            style={{
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                fontSize: '0.6rem',
                                                fontWeight: 600,
                                                color: 'var(--error)',
                                                background: '#ef444420',
                                            }}
                                        >
                                            CIRCUIT OPEN
                                        </span>
                                    )}
                                    {p.rateLimited && (
                                        <span
                                            style={{
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                fontSize: '0.6rem',
                                                fontWeight: 600,
                                                color: '#f97316',
                                                background: '#f9731620',
                                            }}
                                        >
                                            RATE LIMITED
                                        </span>
                                    )}
                                </div>
                            )}
                            {p.totalQuota > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.6rem',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        <span>Quota</span>
                                        <span>
                                            {p.usedQuota}/{p.totalQuota}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: 4,
                                            borderRadius: 2,
                                            background: 'rgba(255,255,255,0.06)',
                                            overflow: 'hidden',
                                            marginTop: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${Math.min(100, (p.usedQuota / p.totalQuota) * 100)}%`,
                                                height: '100%',
                                                borderRadius: 2,
                                                background:
                                                    p.usedQuota / p.totalQuota > 0.8
                                                        ? '#ef4444'
                                                        : '#22c55e',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {healthEvents.length > 0 && (
                <div
                    style={{
                        padding: '1rem',
                        borderRadius: 12,
                        background: 'rgba(139,92,246,0.02)',
                        border: '1px solid rgba(139,92,246,0.08)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <Zap size={16} color="#8b5cf6" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {t('provider_dashboard.recent_events')}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            maxHeight: 160,
                            overflowY: 'auto',
                        }}
                    >
                        {healthEvents.slice(0, 20).map((ev, i) => {
                            const c =
                                ev.type === 'latency_spike'
                                    ? '#f59e0b'
                                    : ev.type === 'error_burst'
                                      ? '#ef4444'
                                      : ev.type === 'status_change'
                                        ? '#8b5cf6'
                                        : ev.type === 'rate_limit'
                                          ? '#f97316'
                                          : '#10b981';
                            const ago = Math.floor((now - ev.timestamp) / 1000);
                            return (
                                <div
                                    key={`${ev.provider}-${ev.timestamp}-${i}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: 6,
                                        background: 'rgba(0,0,0,0.1)',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: '50%',
                                            background: c,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <ProviderIcon provider={ev.provider} size={10} />
                                    <span
                                        style={{
                                            color: c,
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {ev.type.replace('_', ' ')}
                                    </span>
                                    <span
                                        style={{
                                            color: 'var(--slate-400)',
                                            maxWidth: 180,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {ev.detail}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            color: 'var(--slate-500)',
                                            fontSize: '0.6rem',
                                        }}
                                    >
                                        {ago < 60 ? `${ago}s` : `${Math.floor(ago / 60)}m`} ago
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {state?.decisions?.length > 0 && (
                <div
                    style={{
                        padding: '1rem',
                        borderRadius: 12,
                        background: 'rgba(59,130,246,0.02)',
                        border: '1px solid rgba(59,130,246,0.08)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <Shield size={16} color="#3b82f6" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {t('provider_dashboard.recent_decisions')}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            maxHeight: 160,
                            overflowY: 'auto',
                        }}
                    >
                        {state.decisions.slice(0, 10).map((d, i) => (
                            <div
                                key={`dec-${i}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: 6,
                                    background: 'rgba(0,0,0,0.1)',
                                    fontSize: '0.7rem',
                                }}
                            >
                                <ProviderIcon provider={d.selected} size={10} />
                                <span style={{ color: 'var(--slate-200)', fontWeight: 500 }}>
                                    {d.selected}
                                </span>
                                {d.secondBest && (
                                    <>
                                        <span style={{ color: 'var(--slate-500)' }}>→</span>
                                        <ProviderIcon provider={d.secondBest} size={10} />
                                        <span style={{ color: 'var(--slate-500)' }}>{d.secondBest}</span>
                                    </>
                                )}
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        color: 'var(--slate-500)',
                                        fontSize: '0.6rem',
                                    }}
                                >
                                    {d.strategy}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderDashboard;
