import { useEffect, useState } from 'react';
import { realtimeMetricsService } from '../kernel/instances';
import type { MetricSeries } from '../kernel/contracts/metrics';

/**
 * useMetrics — реактивная подписка на серии единого MetricsService (SPEC_03).
 *
 * Отдаёт снапшот серий по необязательному шаблону имени и обновляется при
 * изменении серий, подходящих под шаблон (через subscribe).
 */
export function useMetrics(pattern?: string): Record<string, MetricSeries> {
    const [series, setSeries] = useState<Record<string, MetricSeries>>(() =>
        pattern ? realtimeMetricsService.snapshot(pattern) : realtimeMetricsService.snapshot(),
    );

    useEffect(() => {
        let mounted = true;
        const refresh = () => {
            if (!mounted) return;
            setSeries(pattern ? realtimeMetricsService.snapshot(pattern) : realtimeMetricsService.snapshot());
        };
        refresh();
        const unsub = realtimeMetricsService.subscribe(pattern ?? '*', refresh);
        return () => {
            mounted = false;
            unsub();
        };
    }, [pattern]);

    return series;
}
