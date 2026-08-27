import type { LogEntry } from '../../kernel/contracts/logger';

export interface ServiceStats {
    service: string;
    count: number;
    totalLatency: number;
    avgLatency: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
    errorCount: number;
    warnCount: number;
    lastSeen: number;
}

function computePercentiles(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx]!;
}

export function aggregate(entries: ReadonlyArray<LogEntry>): ServiceStats[] {
    const allServices = new Set<string>();
    const latencies = new Map<string, number[]>();
    const errorCount = new Map<string, number>();
    const warnCount = new Map<string, number>();
    const lastSeen = new Map<string, number>();
    const counts = new Map<string, number>();

    for (const e of entries) {
        if (!e.service) continue;
        allServices.add(e.service);
        counts.set(e.service, (counts.get(e.service) ?? 0) + 1);

        if (typeof e.latency === 'number' && e.latency > 0) {
            const list = latencies.get(e.service) ?? [];
            list.push(e.latency);
            latencies.set(e.service, list);
        }

        const t = e.timestamp;
        if (!lastSeen.has(e.service) || (lastSeen.get(e.service) ?? 0) < t)
            lastSeen.set(e.service, t);

        if (e.level === 'error') errorCount.set(e.service, (errorCount.get(e.service) ?? 0) + 1);
        if (e.level === 'warn') warnCount.set(e.service, (warnCount.get(e.service) ?? 0) + 1);
    }

    const out: ServiceStats[] = [];
    for (const service of allServices) {
        const lats = latencies.get(service) ?? [];
        const sorted = [...lats].sort((a, b) => a - b);
        const sum = sorted.reduce((s, v) => s + v, 0);
        const len = sorted.length;
        out.push({
            service,
            count: counts.get(service) ?? 0,
            totalLatency: sum,
            avgLatency: len > 0 ? sum / len : 0,
            p50: computePercentiles(sorted, 0.5),
            p95: computePercentiles(sorted, 0.95),
            p99: computePercentiles(sorted, 0.99),
            max: sorted[sorted.length - 1] ?? 0,
            min: sorted[0] ?? 0,
            errorCount: errorCount.get(service) ?? 0,
            warnCount: warnCount.get(service) ?? 0,
            lastSeen: lastSeen.get(service) ?? 0,
        });
    }
    return out.sort((a, b) => b.avgLatency - a.avgLatency);
}
