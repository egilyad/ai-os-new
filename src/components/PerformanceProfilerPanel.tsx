import React, { useState, useMemo, useRef } from 'react';
import { Gauge, Activity, Clock, Zap, BarChart3, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNow } from '../hooks/useNow';
import { rootLogger } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { usePolling } from './Common/usePolling';
import { errorContainer, dismissBtnRed, textMutedXs } from '../styles/common';
import type { LogEntry } from '../kernel/contracts/logger';
import { aggregate } from './PerformanceProfilerPanel/profiler-utils';
import { StatBox } from './PerformanceProfilerPanel/components';
import { ServiceDetailPanel } from './PerformanceProfilerPanel/ServiceDetailPanel';

export const PerformanceProfilerPanel: React.FC = () => {
    const { t } = useTranslation();
    const now = useNow(60_000);
    const [entries, setEntries] = useState<ReadonlyArray<LogEntry>>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    // C-95: usePolling gates on document.hidden
    usePolling(() => {
        if (isMountedRef.current) setEntries(rootLogger.getBuffer());
    }, 1500);

    const stats = useMemo(() => aggregate(entries), [entries]);
    const totalSamples = stats.reduce((s, x) => s + x.count, 0);
    const overallAvg =
        totalSamples === 0 ? 0 : stats.reduce((s, x) => s + x.totalLatency, 0) / totalSamples;
    const totalErrors = entries.filter((e) => e.level === 'error').length;
    const totalWarns = entries.filter((e) => e.level === 'warn').length;
    const slowServices = useMemo(() => stats.filter((s) => s.p95 > 2000).slice(0, 5), [stats]);

    if (stats.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                <Activity size={48} color="#475569" />
                <p>{t('performance_profiler.empty')}</p>
                <p style={textMutedXs}>{t('performance_profiler.empty_hint')}</p>
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1rem',
                overflow: 'auto',
            }}
        >
            <div
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '0.75rem',
                }}
            >
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
                    <Gauge size={26} color="#a855f7" /> {t('performance_profiler.title')}
                </h2>
                <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                    {t('performance_profiler.subtitle')}
                </p>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <StatBox
                    icon={<BarChart3 size={14} color="#3b82f6" />}
                    label={t('performance_profiler.services')}
                    value={stats.length}
                    color="#3b82f6"
                />
                <StatBox
                    icon={<Activity size={14} color="#10b981" />}
                    label={t('performance_profiler.samples')}
                    value={totalSamples}
                    color="#10b981"
                />
                <StatBox
                    icon={<Clock size={14} color="#f59e0b" />}
                    label={t('performance_profiler.avg_latency')}
                    value={`${overallAvg.toFixed(0)}ms`}
                    color="#f59e0b"
                />
                <StatBox
                    icon={<AlertCircle size={14} color="#ef4444" />}
                    label={t('performance_profiler.errors_warns')}
                    value={`${totalErrors} / ${totalWarns}`}
                    color="#ef4444"
                />
            </div>

            {slowServices.length > 0 && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid rgba(245,158,11,0.2)',
                        background: 'rgba(245,158,11,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Zap size={14} color="#f59e0b" />
                    <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>
                        {t('performance_profiler.slow_warning', {
                            count: slowServices.length,
                            services: slowServices.map((s) => s.service).join(', '),
                        })}
                    </span>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr',
                        gap: 4,
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.7rem',
                        color: 'var(--slate-400)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <span>{t('performance_profiler.col_service')}</span>
                    <span style={{ textAlign: 'right' }}>
                        {t('performance_profiler.col_count')}
                    </span>
                    <span style={{ textAlign: 'right' }}>{t('performance_profiler.col_avg')}</span>
                    <span style={{ textAlign: 'right' }}>{t('performance_profiler.col_p50')}</span>
                    <span style={{ textAlign: 'right' }}>{t('performance_profiler.col_p95')}</span>
                    <span style={{ textAlign: 'right' }}>{t('performance_profiler.col_p99')}</span>
                    <span style={{ textAlign: 'right' }}>{t('performance_profiler.col_err')}</span>
                    <span style={{ textAlign: 'right' }}>{t('performance_profiler.col_warn')}</span>
                </div>
                {stats.map((s) => (
                    <button
                        key={s.service}
                        onClick={() =>
                            setSelectedService(selectedService === s.service ? null : s.service)
                        }
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr',
                            gap: 4,
                            padding: '0.4rem 0.5rem',
                            borderRadius: 6,
                            border: `1px solid ${selectedService === s.service ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.03)'}`,
                            background:
                                selectedService === s.service
                                    ? 'rgba(168,85,247,0.05)'
                                    : 'rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            textAlign: 'left',
                            alignItems: 'center',
                        }}
                    >
                        <span
                            style={{
                                color: 'var(--slate-300)',
                                fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
                            }}
                        >
                            {s.service}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--slate-400)' }}>{s.count}</span>
                        <LatencyCell value={s.avgLatency} />
                        <LatencyCell value={s.p50} />
                        <LatencyCell value={s.p95} highlight />
                        <LatencyCell value={s.p99} highlight />
                        <span
                            style={{
                                textAlign: 'right',
                                color: s.errorCount > 0 ? '#fca5a5' : '#475569',
                            }}
                        >
                            {s.errorCount}
                        </span>
                        <span
                            style={{
                                textAlign: 'right',
                                color: s.warnCount > 0 ? '#fcd34d' : '#475569',
                            }}
                        >
                            {s.warnCount}
                        </span>
                    </button>
                ))}
            </div>

            {selectedService &&
                (() => {
                    const sel = stats.find((s) => s.service === selectedService);
                    if (!sel) return null;
                    return (
                        <ServiceDetailPanel
                            service={sel}
                            entries={entries}
                            now={now}
                            onClose={() => setSelectedService(null)}
                        />
                    );
                })()}
        </div>
    );
};

const LatencyCell: React.FC<{ value: number; highlight?: boolean }> = ({ value, highlight }) => {
    const color = value > 2000 ? '#fca5a5' : value > 500 ? '#fcd34d' : '#86efac';
    return (
        <span
            style={{
                textAlign: 'right',
                color: highlight ? color : 'var(--slate-300)',
                fontWeight: highlight ? 600 : 400,
            }}
        >
            {value.toFixed(0)}ms
        </span>
    );
};

export default PerformanceProfilerPanel;
