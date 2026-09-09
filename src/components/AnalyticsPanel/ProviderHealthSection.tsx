import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { ProviderMetrics } from '../../types/metrics';
import type { HealthEvent } from '../../kernel/types/interfaces';
import { SparklineMemo } from './Sparkline';

interface ProviderHealthSectionProps {
    metrics: Record<string, ProviderMetrics>;
    latencyHistory: number[];
    reliabilityHistory: number[];
    healthEvents: HealthEvent[];
    itemVariants: import('framer-motion').Variants;
    t: (key: string) => string;
}

const ProviderHealthSection: React.FC<ProviderHealthSectionProps> = ({
    metrics,
    latencyHistory,
    reliabilityHistory,
    healthEvents,
    itemVariants,
    t,
}) => {
    if (Object.values(metrics).length === 0) return null;

    const all = Object.values(metrics);
    const healthy = all.filter((m) => m.status === 'healthy').length;
    const degraded = all.filter((m) => m.status === 'degraded').length;
    const offline = all.filter((m) => m.status === 'offline').length;
    const avgEwmaLatency = all.reduce((a, m) => a + m.avgTTFT, 0) / all.length;
    const avgReliability = all.reduce((a, m) => a + m.reliability, 0) / all.length;
    const totalReqs = all.reduce((a, m) => a + m.totalRequests, 0);
    const errorRate = totalReqs > 0 ? (1 - avgReliability) * 100 : 0;

    return (
        <motion.div
            variants={itemVariants}
            style={{
                padding: '1.25rem 1.5rem',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <Activity size={18} color="#3b82f6" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                    {t('analytics.provider_health')}
                </span>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                <StatBox
                    label={t('analytics.active')}
                    value={`${healthy}`}
                    sub={`/${all.length}`}
                    color="#10b981"
                />
                <StatBox label={t('analytics.degraded')} value={`${degraded}`} color="#f59e0b" />
                <StatBox label={t('analytics.offline')} value={`${offline}`} color="#ef4444" />
                <StatBox
                    label={t('analytics.avg_ewma_latency')}
                    value={avgEwmaLatency.toFixed(0)}
                    sub="ms"
                    color={avgEwmaLatency < 500 ? '#10b981' : '#f59e0b'}
                />
                <StatBox
                    label={t('analytics.error_rate')}
                    value={errorRate.toFixed(1)}
                    sub="%"
                    color={errorRate < 5 ? '#10b981' : '#ef4444'}
                />
                <StatBox
                    label={t('analytics.reliability')}
                    value={(avgReliability * 100).toFixed(1)}
                    sub="%"
                    color={avgReliability > 0.95 ? '#10b981' : '#f59e0b'}
                />
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {all.map((m) => (
                    <span
                        key={m.id}
                        style={{
                            fontSize: '0.65rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 6,
                            fontWeight: 700,
                            background:
                                m.status === 'healthy'
                                    ? 'rgba(16,185,129,0.1)'
                                    : m.status === 'degraded'
                                      ? 'rgba(245,158,11,0.1)'
                                      : 'rgba(239,68,68,0.1)',
                            color:
                                m.status === 'healthy'
                                    ? '#10b981'
                                    : m.status === 'degraded'
                                      ? '#f59e0b'
                                      : '#ef4444',
                        }}
                    >
                        {m.id} ({m.avgTTFT.toFixed(0)}ms)
                    </span>
                ))}
            </div>
            {(latencyHistory.length >= 2 || reliabilityHistory.length >= 2) && (
                <div
                    style={{
                        marginTop: '1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                    }}
                >
                    {latencyHistory.length >= 2 && (
                        <div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    marginBottom: 6,
                                    fontWeight: 600,
                                }}
                            >
                                Fleet EWMA latency (TTFT)
                            </div>
                            <div style={{ height: 48 }}>
                                <SparklineMemo data={latencyHistory} color="#3b82f6" height={48} />
                            </div>
                        </div>
                    )}
                    {reliabilityHistory.length >= 2 && (
                        <div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    marginBottom: 6,
                                    fontWeight: 600,
                                }}
                            >
                                Fleet reliability trend
                            </div>
                            <div style={{ height: 48 }}>
                                <SparklineMemo
                                    data={reliabilityHistory}
                                    color="#10b981"
                                    height={48}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
            {healthEvents.length > 0 && (
                <div
                    style={{
                        marginTop: '1rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '0.75rem',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--slate-400)',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                        }}
                    >
                        Recent health events
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            maxHeight: 140,
                            overflowY: 'auto',
                        }}
                    >
                        {healthEvents.map((ev, i) => (
                            <div
                                key={`${ev.timestamp}-${i}`}
                                style={{
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span
                                    style={{
                                        textTransform: 'uppercase',
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        flexShrink: 0,
                                        color:
                                            ev.type === 'recovery'
                                                ? '#10b981'
                                                : ev.type === 'error_burst'
                                                  ? '#ef4444'
                                                  : '#f59e0b',
                                        background:
                                            ev.type === 'recovery'
                                                ? 'rgba(16,185,129,0.15)'
                                                : ev.type === 'error_burst'
                                                  ? 'rgba(239,68,68,0.15)'
                                                  : 'rgba(245,158,11,0.15)',
                                    }}
                                >
                                    {ev.type.replace('_', ' ')}
                                </span>
                                <span style={{ color: 'var(--slate-400)', flex: 1 }}>
                                    <strong style={{ color: 'var(--slate-200)' }}>{ev.provider}</strong> —{' '}
                                    {ev.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const StatBox: React.FC<{ label: string; value: string; sub?: string; color: string }> = ({
    label,
    value,
    sub,
    color,
}) => (
    <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>
            {value}
            {sub && (
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 400 }}>{sub}</span>
            )}
        </div>
    </div>
);

export default ProviderHealthSection;
