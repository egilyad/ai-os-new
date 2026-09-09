import { useTranslation } from '../../i18n/useTranslation';
import { metricCardCenter, labelMetricSub } from '../../styles/common';

interface Props {
    avgLatency?: number;
    errorRate?: number;
    costPerRequest?: number;
    suggestions: number;
}

const colorFor = (val: number, thresholds: [number, number]): string =>
    val < thresholds[0] ? '#10b981' : val < thresholds[1] ? '#f59e0b' : '#ef4444';

const MetricCards: React.FC<Props> = ({ avgLatency, errorRate, costPerRequest, suggestions }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
            }}
        >
            <div style={metricCardCenter}>
                <div style={labelMetricSub}>{t('sre.metric.avg_latency')}</div>
                <div
                    style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: colorFor(avgLatency ?? 0, [1000, 3000]),
                    }}
                >
                    {Math.round(avgLatency ?? 0)}
                    <span style={{ fontSize: '0.7rem' }}>ms</span>
                </div>
            </div>
            <div style={metricCardCenter}>
                <div style={labelMetricSub}>{t('sre.metric.error_rate')}</div>
                <div
                    style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: colorFor(errorRate ?? 0, [0.05, 0.15]),
                    }}
                >
                    {((errorRate ?? 0) * 100).toFixed(1)}%
                </div>
            </div>
            <div style={metricCardCenter}>
                <div style={labelMetricSub}>{t('sre.metric.cost_per_req')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                    ${(costPerRequest ?? 0).toFixed(4)}
                </div>
            </div>
            <div style={metricCardCenter}>
                <div style={labelMetricSub}>{t('sre.metric.suggestions')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--purple-muted)' }}>
                    {suggestions}
                </div>
            </div>
        </div>
    );
};

export default MetricCards;
