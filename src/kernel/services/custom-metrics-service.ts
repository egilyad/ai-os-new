import type {
    CustomMetric,
    MetricValue,
    MetricDashboard,
    ICustomMetricsService,
    MetricAggregation,
} from '../contracts/custom-metrics';
import type { MemoryStats } from '../types/memory-types';
import type { IProviderTracker } from './provider-tracker';

const METRICS_KEY = 'custom_metrics';
const HISTORY_KEY = 'metric_history';
const DASHBOARDS_KEY = 'metric_dashboards';

async function readJSON<T>(key: string): Promise<T[]> {
    const { storageAdapter } = await import('../instances');
    const raw = storageAdapter.getItem(key);
    return raw ? JSON.parse(raw) : [];
}

async function writeJSON<T>(key: string, data: T[]): Promise<void> {
    const { storageAdapter } = await import('../instances');
    storageAdapter.setItem(key, JSON.stringify(data));
}

function getNested(obj: Record<string, unknown>, path: string): number {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return 0;
        current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'number' ? current : 0;
}

export class CustomMetricsService implements ICustomMetricsService {
    constructor(private providerTracker: IProviderTracker) {}

    async listMetrics(): Promise<CustomMetric[]> {
        return readJSON<CustomMetric>(METRICS_KEY);
    }

    async getMetric(id: string): Promise<CustomMetric | undefined> {
        const all = await this.listMetrics();
        return all.find((m) => m.id === id);
    }

    async createMetric(metric: Omit<CustomMetric, 'id' | 'createdAt'>): Promise<string> {
        const all = await this.listMetrics();
        const id = crypto.randomUUID();
        all.push({ ...metric, id, createdAt: Date.now() });
        await writeJSON(METRICS_KEY, all);
        return id;
    }

    async updateMetric(id: string, updates: Partial<CustomMetric>): Promise<void> {
        const all = await this.listMetrics();
        const idx = all.findIndex((m) => m.id === id);
        if (idx < 0) throw new Error(`Metric ${id} not found`);
        all[idx] = { ...all[idx]!, ...updates };
        await writeJSON(METRICS_KEY, all);
    }

    async deleteMetric(id: string): Promise<void> {
        const all = await this.listMetrics();
        await writeJSON(
            METRICS_KEY,
            all.filter((m) => m.id !== id),
        );
    }

    async computeValue(metricId: string): Promise<MetricValue> {
        const metric = await this.getMetric(metricId);
        if (!metric) throw new Error(`Metric ${metricId} not found`);

        let value = 0;
        if (metric.source === 'provider') {
            const rankings = this.providerTracker.getProviderRankings();
            const values: number[] = [];
            for (const r of rankings) {
                const v = (r as Record<string, unknown>)[metric.field];
                if (typeof v === 'number') values.push(v);
            }
            if (values.length > 0) value = aggregate(values, metric.aggregation);
        } else if (metric.source === 'debate') {
            const { qualityImpactCollector } = await import('../instances');
            const allMetrics = qualityImpactCollector.getAllMetrics();
            const techniqueFilter = metric.filter?.techniqueId as string | undefined;
            const filtered = techniqueFilter
                ? allMetrics.filter((m) => m.techniqueId === techniqueFilter)
                : allMetrics;
            const values = filtered
                .map((m) => {
                    const v = (m as unknown as Record<string, unknown>)[metric.field];
                    return typeof v === 'number' ? v : undefined;
                })
                .filter((v): v is number => v !== undefined);
            if (values.length > 0) value = aggregate(values, metric.aggregation);
        } else if (metric.source === 'memory') {
            const { memoryOrchestrator } = await import('../instances');
            const stats = await memoryOrchestrator.getStats();
            const numericStats = stats as unknown as Record<string, MemoryStats>;
            const values: number[] = [];
            const field = metric.field;
            const parts = field.split('.');
            if (parts.length === 1) {
                for (const storeStats of Object.values(numericStats)) {
                    const v = (storeStats as unknown as Record<string, unknown>)[field];
                    if (typeof v === 'number') values.push(v);
                }
            } else if (parts.length === 2) {
                const storeStats = numericStats[parts[0]!];
                if (storeStats) {
                    const v = (storeStats as unknown as Record<string, unknown>)[parts[1]!];
                    if (typeof v === 'number') values.push(v);
                }
            }
            if (values.length > 0) value = aggregate(values, metric.aggregation);
        } else if (metric.source === 'system') {
            const { debateEngine } = await import('../instances');
            const sessions = debateEngine.getAllSessions();
            const rankings = this.providerTracker.getProviderRankings();
            switch (metric.field) {
                case 'activeSessions':
                    value = sessions.filter(
                        (s) => s.phase === 'active' || s.phase === 'deliberating',
                    ).length;
                    break;
                case 'totalSessions':
                    value = sessions.length;
                    break;
                case 'totalProviders':
                    value = rankings.length;
                    break;
                default:
                    value = getNested(
                        {
                            activeSessions: sessions.filter(
                                (s) => s.phase === 'active' || s.phase === 'deliberating',
                            ).length,
                            totalSessions: sessions.length,
                            totalProviders: rankings.length,
                        },
                        metric.field,
                    );
            }
        } else {
            throw new Error(
                'Unsupported metric source: ' +
                    metric.source +
                    '. Supported sources: provider, debate, memory, system.',
            );
        }

        const entry: MetricValue = { metricId, value, timestamp: Date.now() };
        await this.recordHistory(entry);
        return entry;
    }

    async getHistory(metricId: string, limit = 50): Promise<MetricValue[]> {
        const all: MetricValue[] = await readJSON<MetricValue>(HISTORY_KEY);
        return all.filter((h) => h.metricId === metricId).slice(-limit);
    }

    async listDashboards(): Promise<MetricDashboard[]> {
        return readJSON<MetricDashboard>(DASHBOARDS_KEY);
    }

    async createDashboard(name: string, metricIds: string[]): Promise<string> {
        const all = await this.listDashboards();
        const id = crypto.randomUUID();
        all.push({ id, name, metricIds, layout: 'grid', createdAt: Date.now() });
        await writeJSON(DASHBOARDS_KEY, all);
        return id;
    }

    async deleteDashboard(id: string): Promise<void> {
        const all = await this.listDashboards();
        await writeJSON(
            DASHBOARDS_KEY,
            all.filter((d) => d.id !== id),
        );
    }

    private async recordHistory(entry: MetricValue): Promise<void> {
        const all: MetricValue[] = await readJSON<MetricValue>(HISTORY_KEY);
        all.push(entry);
        if (all.length > 10000) all.splice(0, all.length - 10000);
        await writeJSON(HISTORY_KEY, all);
    }
}

function aggregate(values: number[], aggregation: MetricAggregation): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    switch (aggregation) {
        case 'avg':
            return values.reduce((s, v) => s + v, 0) / values.length;
        case 'sum':
            return values.reduce((s, v) => s + v, 0);
        case 'max':
            return sorted[sorted.length - 1]!;
        case 'min':
            return sorted[0]!;
        case 'count':
            return values.length;
        case 'p50':
            return sorted[Math.floor(sorted.length * 0.5)]!;
        case 'p95':
            return sorted[Math.floor(sorted.length * 0.95)]!;
        case 'p99':
            return sorted[Math.floor(sorted.length * 0.99)]!;
        default:
            return values.reduce((s, v) => s + v, 0) / values.length;
    }
}
