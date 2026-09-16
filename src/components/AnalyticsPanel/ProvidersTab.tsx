import { motion, type Variants } from 'framer-motion';
import { Cpu } from 'lucide-react';
import type { ProviderMetrics } from '../../types/metrics';
import { providerMetricBox } from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';

interface ProvidersTabProps {
    metrics: Record<string, ProviderMetrics>;
    itemVariants: Variants;
}

export const ProvidersTab: React.FC<ProvidersTabProps> = ({ metrics, itemVariants }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            key="providers"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.5rem',
            }}
        >
            {Object.values(metrics).map((m) => {
                const maxTTFT = Math.max(...Object.values(metrics).map((p) => p.avgTTFT), 1);
                const maxTPS = Math.max(...Object.values(metrics).map((p) => p.avgTPS), 1);
                return (
                    <motion.div
                        key={m.id}
                        variants={itemVariants}
                        className="glass-panel"
                        style={{ padding: '1.5rem', borderRadius: 16 }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background:
                                            m.status === 'healthy'
                                                ? 'rgba(16,185,129,0.1)'
                                                : 'rgba(239,68,68,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${m.status === 'healthy' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                    }}
                                >
                                    <Cpu
                                        size={20}
                                        color={m.status === 'healthy' ? '#10b981' : '#ef4444'}
                                        aria-hidden="true"
                                    />
                                </div>
                                <div>
                                    <h4
                                        style={{
                                            margin: 0,
                                            fontSize: '1.1rem',
                                            fontWeight: 800,
                                            color: 'var(--slate-50)',
                                        }}
                                    >
                                        {m.id}
                                    </h4>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            marginTop: '0.2rem',
                                        }}
                                    >
                                        {m.totalRequests} requests
                                    </div>
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.05em',
                                    color: m.status === 'healthy' ? '#10b981' : '#ef4444',
                                    background:
                                        m.status === 'healthy'
                                            ? 'rgba(16,185,129,0.1)'
                                            : 'rgba(239,68,68,0.1)',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: 8,
                                }}
                            >
                                {m.status.toUpperCase()}
                            </span>
                        </div>

                        <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                        >
                            <div style={providerMetricBox}>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: '0.4rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                    }}
                                >
                                    {t('analytics.avg_ttft')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: m.avgTTFT < 500 ? '#10b981' : '#f59e0b',
                                    }}
                                >
                                    {m.avgTTFT.toFixed(0)}
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--slate-500)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        ms
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: '0.3rem',
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            width: `${Math.min((m.avgTTFT / maxTTFT) * 100, 100)}%`,
                                            background: m.avgTTFT < 500 ? '#10b981' : '#f59e0b',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={providerMetricBox}>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: '0.4rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                    }}
                                >
                                    {t('analytics.reliability')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: m.reliability > 0.95 ? '#10b981' : '#ef4444',
                                    }}
                                >
                                    {(m.reliability * 100).toFixed(1)}
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--slate-500)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        %
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: '0.3rem',
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            width: `${Math.min(m.reliability * 100, 100)}%`,
                                            background:
                                                m.reliability > 0.95 ? '#10b981' : '#ef4444',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={providerMetricBox}>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: '0.4rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                    }}
                                >
                                    {t('analytics.tps')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: m.avgTPS > 50 ? '#10b981' : '#f59e0b',
                                    }}
                                >
                                    {m.avgTPS.toFixed(1)}
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--slate-500)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {' '}
                                        t/s
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: '0.3rem',
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            width: `${Math.min((m.avgTPS / maxTPS) * 100, 100)}%`,
                                            background: m.avgTPS > 50 ? '#10b981' : '#f59e0b',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={providerMetricBox}>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: '0.4rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                    }}
                                >
                                    {t('analytics.selection_rate')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: m.selectionRate > 0.3 ? '#3b82f6' : '#64748b',
                                    }}
                                >
                                    {(m.selectionRate * 100).toFixed(1)}
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--slate-500)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        %
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: '0.3rem',
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            width: `${Math.min(m.selectionRate * 100, 100)}%`,
                                            background: 'var(--accent)',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};
