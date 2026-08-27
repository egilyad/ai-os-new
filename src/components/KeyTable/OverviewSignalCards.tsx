import { Gauge } from 'lucide-react';
import { glassCard, flexCenterGap2Mb1 } from '../../styles/common';

interface Props {
    fourSignals?: {
        latency: number;
        throughput: number;
        errorRate: number;
        saturation: number;
    };
    t: (key: string, params?: Record<string, string | number>) => string;
}

const SIGNALS = [
    {
        labelKey: 'overview.signal_latency',
        value: (s: Props['fourSignals']) => `${Math.round(s?.latency || 0)}ms`,
        color: 'var(--accent)',
    },
    {
        labelKey: 'overview.signal_throughput',
        value: (s: Props['fourSignals']) => `${Math.round(s?.throughput || 0)} t/s`,
        color: 'var(--success)',
    },
    {
        labelKey: 'overview.signal_error_rate',
        value: (s: Props['fourSignals']) => `${(s?.errorRate || 0).toFixed(2)}%`,
        getColor: (s: Props['fourSignals']) =>
            s?.errorRate && s.errorRate > 5 ? '#ef4444' : '#94a3b8',
    },
    {
        labelKey: 'overview.signal_saturation',
        value: (s: Props['fourSignals']) => `${Math.round((s?.saturation || 0) * 100)}%`,
        getColor: (s: Props['fourSignals']) =>
            s?.saturation && s.saturation > 0.7 ? '#ef4444' : '#94a3b8',
    },
] as const;

const OverviewSignalCards: React.FC<Props> = ({ fourSignals, t }) => {
    if (!fourSignals) return null;

    return (
        <div style={glassCard}>
            <div style={flexCenterGap2Mb1}>
                <Gauge size={14} color="#10b981" aria-hidden="true" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {t('overview.four_signals')}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {SIGNALS.map((s) => {
                    const val = s.value(fourSignals);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const color = 'getColor' in s ? (s as any).getColor(fourSignals) : s.color;
                    return (
                        <div
                            key={s.labelKey}
                            style={{
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                {t(s.labelKey)}
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{val}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OverviewSignalCards;
