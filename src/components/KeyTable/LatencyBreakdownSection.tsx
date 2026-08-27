import { Clock } from 'lucide-react';
import type { LatencyBreakdown } from '../../kernel/types/metrics-types';
import { glassCard } from '../../styles/common';

interface Props {
    latencyBreakdown?: LatencyBreakdown;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LatencyBreakdownSection: React.FC<Props> = ({ latencyBreakdown, t }) => {
    const hasData = latencyBreakdown && latencyBreakdown.total > 0;

    return (
        <div style={glassCard}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                }}
            >
                <Clock size={14} color="#3b82f6" aria-hidden="true" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {t('overview.ttft_breakdown')}
                </span>
            </div>
            {hasData ? (
                <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden' }}>
                    <div
                        style={{
                            width: `${((latencyBreakdown.dns || 0) / latencyBreakdown.total) * 100}%`,
                            background: 'var(--accent)',
                        }}
                        title="DNS"
                    />
                    <div
                        style={{
                            width: `${((latencyBreakdown.tls || 0) / latencyBreakdown.total) * 100}%`,
                            background: '#a855f7',
                        }}
                        title="TLS"
                    />
                    <div
                        style={{
                            width: `${((latencyBreakdown.connect || 0) / latencyBreakdown.total) * 100}%`,
                            background: '#ec4899',
                        }}
                        title="Connect"
                    />
                    <div
                        style={{
                            width: `${(Math.max(0, latencyBreakdown.ttft - ((latencyBreakdown.dns || 0) + (latencyBreakdown.tls || 0) + (latencyBreakdown.connect || 0))) / latencyBreakdown.total) * 100}%`,
                            background: 'var(--success)',
                        }}
                        title="Processing"
                    />
                </div>
            ) : (
                <div
                    style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        padding: '0.5rem 0',
                    }}
                >
                    {t('overview.no_latency_data')}
                </div>
            )}
        </div>
    );
};

export default LatencyBreakdownSection;
