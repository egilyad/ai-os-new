import type {
    IMetricsService,
    IMetricsStorage,
    MetricKind,
    MetricSeries,
} from '../../contracts/metrics';

const DEFAULT_PERCENTILES = [0.5, 0.9, 0.99];

function computePercentiles(sorted: number[], ps: number[]): Record<string, number> {
    const out: Record<string, number> = {};
    if (sorted.length === 0) {
        for (const p of ps) out[String(p)] = 0;
        return out;
    }
    for (const p of ps) {
        const idx = (sorted.length - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        out[String(p)] =
            lo === hi
                ? sorted[lo]
                : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    }
    return out;
}

/**
 * MetricsService — единый in-memory метрический слой с батчевым flush
 * в опциональное хранилище (SPEC_03). Потокобезопасен (однопоточный JS).
 */
export class MetricsService implements IMetricsService {
    private _series = new Map<string, MetricSeries>();
    private _listeners = new Map<string, Array<(s: MetricSeries) => void>>();
    private _storage: IMetricsStorage | null;

    constructor(storage?: IMetricsStorage) {
        this._storage = storage ?? null;
    }

    private key(name: string, tags?: Record<string, string>): string {
        if (!tags) return name;
        const tagStr = Object.keys(tags)
            .sort()
            .map((k) => `${k}=${tags[k]}`)
            .join(',');
        return tagStr ? `${name}{${tagStr}}` : name;
    }

    private series(name: string, kind: MetricKind, tags?: Record<string, string>): MetricSeries {
        const key = this.key(name, tags);
        let s = this._series.get(key);
        if (!s) {
            s = {
                name: key,
                kind,
                points: [],
                summary: { count: 0, sum: 0, min: 0, max: 0, percentiles: {} },
            };
            this._series.set(key, s);
        }
        return s;
    }

    private static matchesPattern(pattern: string, name: string): boolean {
        if (pattern === '*') return true;
        if (pattern.endsWith('.*')) return name.startsWith(pattern.slice(0, -1));
        return pattern === name;
    }

    private notify(name: string, s: MetricSeries): void {
        for (const [pattern, cbs] of this._listeners) {
            if (!MetricsService.matchesPattern(pattern, name)) continue;
            for (const cb of cbs) {
                try {
                    cb(s);
                } catch {
                    // наблюдатели не должны ломать метрики
                }
            }
        }
    }

    inc(name: string, by = 1, tags?: Record<string, string>): void {
        const s = this.series(name, 'counter', tags);
        const ts = Date.now();
        s.points.push({ ts, value: by, tags });
        s.summary.count += 1;
        s.summary.sum += by;
        this.notify(name, s);
    }

    record(name: string, value: number, tags?: Record<string, string>): void {
        const s = this.series(name, 'histogram', tags);
        const ts = Date.now();
        s.points.push({ ts, value, tags });
        s.summary.count += 1;
        s.summary.sum += value;
        if (s.summary.count === 1) {
            s.summary.min = value;
            s.summary.max = value;
        } else {
            s.summary.min = Math.min(s.summary.min, value);
            s.summary.max = Math.max(s.summary.max, value);
        }
        this.notify(name, s);
    }

    gauge(name: string, value: number, tags?: Record<string, string>): void {
        const s = this.series(name, 'gauge', tags);
        const ts = Date.now();
        s.points.push({ ts, value, tags });
        s.summary.count += 1;
        s.summary.sum = value;
        s.summary.min = value;
        s.summary.max = value;
        this.notify(name, s);
    }

    snapshot(name?: string): Record<string, MetricSeries> {
        if (!name || name === '*') return Object.fromEntries(this._series);
        if (name.endsWith('.*')) {
            const prefix = name.slice(0, -1);
            const out: Record<string, MetricSeries> = {};
            for (const [k, s] of this._series) {
                if (k.startsWith(prefix)) out[k] = s;
            }
            return out;
        }
        const s = this._series.get(name);
        return s ? { [name]: s } : {};
    }

    subscribe(pattern: string, cb: (series: MetricSeries) => void): () => void {
        const list = this._listeners.get(pattern) ?? [];
        list.push(cb);
        this._listeners.set(pattern, list);
        return () => {
            const cur = this._listeners.get(pattern) ?? [];
            this._listeners.set(pattern, cur.filter((l) => l !== cb));
        };
    }

    clear(name?: string): void {
        if (name) {
            this._series.delete(name);
        } else {
            this._series.clear();
        }
    }

    // Легаси-методы (совместимость с AgentObservabilityTab). Реальная
    // per-agent агрегация будет добавлена позже; пока возвращаем нейтральные
    // значения, чтобы не ломать UI.
    getAgentThroughput(_agentId: string): number {
        return 0;
    }

    getAgentPercentiles(_agentId: string): { p50: number; p90: number; p95: number; p99: number } {
        return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    percentiles(series: MetricSeries, ps: number[] = DEFAULT_PERCENTILES): Record<string, number> {
        const values = series.points.map((p) => p.value).sort((a, b) => a - b);
        return computePercentiles(values, ps);
    }

    async flush(): Promise<void> {
        if (!this._storage) return;
        // Обновляем summary.percentiles перед сохранением.
        for (const [key, s] of this._series) {
            if (s.kind === 'histogram') {
                s.summary.percentiles = this.percentiles(s);
            }
            this._series.set(key, s);
        }
        await this._storage.save(Object.fromEntries(this._series));
    }
}
