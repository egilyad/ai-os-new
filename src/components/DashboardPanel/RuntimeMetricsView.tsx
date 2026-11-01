import React from 'react';
import { useMetrics } from '../../hooks/useMetrics';
import type { MetricSeries } from '../../kernel/contracts/metrics';

/**
 * RuntimeMetricsView — компактный виджет реактивных метрик (SPEC_03).
 *
 * Подписан на metricsService через useMetrics; показывает серии, подходящие
 * под шаблон. Не зависит от конкретных панелей — может быть встроен в
 * Dashboard/диагностику.
 */
interface Props {
    pattern?: string;
    /** Максимум отображаемых серий (по умолчанию 8). */
    limit?: number;
    title?: string;
}

function seriesValue(s: MetricSeries): string {
    if (s.kind === 'counter' || s.kind === 'gauge') {
        const v = s.summary.sum;
        if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
        return String(v);
    }
    // histogram: показываем среднее и p95
    const avg = s.summary.count > 0 ? s.summary.sum / s.summary.count : 0;
    const p95 = s.summary.percentiles['0.95'] ?? 0;
    return `${avg.toFixed(1)} (p95 ${p95.toFixed(1)})`;
}

const RuntimeMetricsView: React.FC<Props> = ({ pattern, limit = 8, title }) => {
    const seriesMap = useMetrics(pattern);
    const entries = Object.entries(seriesMap).slice(0, limit);

    if (entries.length === 0) {
        return (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {title ?? 'Runtime metrics'} — no data yet
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: '0.8rem',
            }}
        >
            {title && (
                <div style={{ fontWeight: 700, color: 'var(--slate-200)' }}>{title}</div>
            )}
            {entries.map(([name, s]) => (
                <div
                    key={name}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <span style={{ color: 'var(--slate-300)', wordBreak: 'break-all' }}>
                        {name}
                    </span>
                    <span style={{ color: 'var(--slate-100)', fontWeight: 600, fontFamily: 'monospace' }}>
                        {seriesValue(s)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default RuntimeMetricsView;
