import { motion } from 'framer-motion';
import { TrendingUp, GitMerge, HardDrive } from 'lucide-react';
import type { ProviderMetrics } from '../../types/metrics';
import { h3ChartTitle, workloadInfoBox } from '../../styles/common';
import { SparklineMemo } from './Sparkline';

interface ChartsSectionProps {
    metrics: Record<string, ProviderMetrics>;
    tokenHistory: number[];
    costHistory: number[];
    cacheStats: { hits: number; misses: number; hitRate: number } | null;
    itemVariants: import('framer-motion').Variants;
    t: (key: string) => string;
}

const TokenChart: React.FC<{
    tokenHistory: number[];
    costHistory: number[];
    t: (k: string) => string;
}> = ({ tokenHistory, costHistory, t }) => (
    <motion.div
        variants={{}}
        className="glass-panel"
        style={{ padding: '1.5rem', borderRadius: 16, display: 'flex', flexDirection: 'column' }}
    >
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
            }}
        >
            <div>
                <h3 style={{ ...h3ChartTitle, margin: '0 0 0.25rem' }}>
                    <TrendingUp size={18} color="#a855f7" /> {t('analytics.chart.token_throughput')}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    Real-time telemetry aggregated over the last 24 hours.
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                        style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }}
                    />{' '}
                    Tokens
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                        style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}
                    />{' '}
                    Spend ($)
                </span>
            </div>
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: 250 }}>
            <div style={{ position: 'absolute', inset: 0, paddingBottom: 20 }}>
                <SparklineMemo
                    data={tokenHistory.length >= 2 ? tokenHistory : [100, 200]}
                    color="#a855f7"
                    height={230}
                />
            </div>
            <div style={{ position: 'absolute', inset: 0, paddingBottom: 20 }}>
                <SparklineMemo
                    data={costHistory.length >= 2 ? costHistory : [0.1, 0.2]}
                    color="#10b981"
                    height={230}
                />
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: 'var(--slate-500)',
                    fontWeight: 600,
                }}
            >
                <span>{t('analytics.time_24h')}</span>
                <span>{t('analytics.time_12h')}</span>
                <span>{t('analytics.time_6h')}</span>
                <span>{t('analytics.time_now')}</span>
            </div>
        </div>
    </motion.div>
);

const WorkloadChart: React.FC<{
    metrics: Record<string, ProviderMetrics>;
    t: (k: string) => string;
}> = ({ metrics, t }) => (
    <motion.div
        variants={{}}
        className="glass-panel"
        style={{ padding: '1.5rem', borderRadius: 16 }}
    >
        <h3 style={h3ChartTitle}>
            <GitMerge size={18} color="#3b82f6" /> {t('analytics.traffic_distribution')}
        </h3>
        {Object.values(metrics).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.values(metrics).map((m) => (
                    <div key={m.id}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                                fontSize: '0.85rem',
                            }}
                        >
                            <span style={{ fontWeight: 700, color: 'var(--slate-200)' }}>{m.id}</span>
                            <span style={{ color: 'var(--slate-400)', fontWeight: 600 }}>
                                {(m.selectionRate * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div
                            style={{
                                height: 8,
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 4,
                                overflow: 'hidden',
                            }}
                        >
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${m.selectionRate * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                style={{
                                    height: '100%',
                                    background:
                                        m.avgTTFT < 500
                                            ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                            : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                    borderRadius: 4,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div
                style={{
                    height: 150,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--slate-500)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                }}
            >
                {t('analytics.empty_traffic_line1')}
                <br />
                {t('analytics.empty_traffic_line2')}
            </div>
        )}
        <div style={workloadInfoBox}>
            <div
                style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    fontWeight: 800,
                    marginBottom: '0.25rem',
                }}
            >
                {t('analytics.optimization_engine')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                {t('analytics.optimization_desc')}
            </div>
        </div>
    </motion.div>
);

const CacheBlock: React.FC<{
    cacheStats: { hits: number; misses: number; hitRate: number } | null;
    t: (k: string) => string;
}> = ({ cacheStats, t }) => (
    <motion.div
        variants={{}}
        style={{
            padding: '1rem 1.5rem',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HardDrive size={20} color="#a855f7" />
            <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                    {t('analytics.cache_hit_rate')}
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: 2 }}>
                    {cacheStats?.hits ?? 0} {t('analytics.cache_hits')} /{' '}
                    {(cacheStats?.hits ?? 0) + (cacheStats?.misses ?? 0)}{' '}
                    {t('analytics.cache_requests')}
                </div>
            </div>
        </div>
        <div
            style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color:
                    (cacheStats?.hitRate ?? 0) > 0.3
                        ? '#10b981'
                        : (cacheStats?.hitRate ?? 0) > 0.1
                          ? '#f59e0b'
                          : '#64748b',
            }}
        >
            {((cacheStats?.hitRate ?? 0) * 100).toFixed(1)}%
        </div>
    </motion.div>
);

const ChartsSection: React.FC<ChartsSectionProps> = ({
    metrics,
    tokenHistory,
    costHistory,
    cacheStats,
    itemVariants,
    t,
}) => (
    <motion.div
        variants={itemVariants}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <TokenChart tokenHistory={tokenHistory} costHistory={costHistory} t={t} />
            <WorkloadChart metrics={metrics} t={t} />
        </div>
        <CacheBlock cacheStats={cacheStats} t={t} />
    </motion.div>
);

export default ChartsSection;
