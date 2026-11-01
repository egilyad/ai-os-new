/**
 * Единый метрический слой (SPEC_03 / ROADMAP_06).
 *
 * Закрывает разбросанность метрик (AdvisorMetrics, CognitiveMetricsSnapshot,
 * AggregatedMetrics, ICustomMetricsService без реализации) единым сервисом:
 * counters, histograms (с процентилями), gauges, теги, снапшоты, подписка.
 */

export type MetricKind = 'counter' | 'histogram' | 'gauge';

export interface MetricPoint {
    ts: number;
    value: number;
    tags?: Record<string, string>;
}

export interface MetricSeries {
    name: string;
    kind: MetricKind;
    points: MetricPoint[];
    summary: {
        count: number;
        sum: number;
        min: number;
        max: number;
        percentiles: Record<string, number>;
    };
}

export interface IMetricsStorage {
    /** Батчевое сохранение серий (опциональный персистентный слой). */
    save(series: Record<string, MetricSeries>): Promise<void>;
    load(): Promise<Record<string, MetricSeries>>;
}

export interface IMetricsService {
    inc(name: string, by?: number, tags?: Record<string, string>): void;
    record(name: string, value: number, tags?: Record<string, string>): void;
    gauge(name: string, value: number, tags?: Record<string, string>): void;
    snapshot(name?: string): Record<string, MetricSeries>;
    subscribe(pattern: string, cb: (series: MetricSeries) => void): () => void;
    flush(): Promise<void>;
    /** Сброс одной серии (по точному имени/тегу) или всех. */
    clear(name?: string): void;
    /** Агрегация по процентилям (p50/p90/p99). */
    percentiles(series: MetricSeries, ps?: number[]): Record<string, number>;
    /** Легаси-методы (совместимость с AgentObservabilityTab). */
    getAgentThroughput(agentId: string): number;
    getAgentPercentiles(agentId: string): { p50: number; p90: number; p95: number; p99: number };
}
