import { CONFIG } from './config-registry';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type {
    AggregatedMetrics,
    ProviderMetricSummary,
    MetricsThreshold,
    MetricAlert,
    TimeSeriesPoint,
} from '../contracts/observability';
import type { SystemState } from '../types/metrics-types';
export type {
    AggregatedMetrics,
    ProviderMetricSummary,
    MetricsThreshold,
    MetricAlert,
    TimeSeriesPoint,
};

const LOGGER = rootLogger.child('MetricsService');

export interface MetricsReport {
    aggregated: AggregatedMetrics;
    providers: ProviderMetricSummary[];
    history: TimeSeriesPoint[];
    topProvider: ProviderMetricSummary | null;
    worstProvider: ProviderMetricSummary | null;
    timestamp: number;
}

const METRICS_KEY = 'super_agents_metrics_history';

/** Re-read CONFIG on each call to reflect runtime overlay changes (config import drift fix). */
function getMaxHistoryPoints(): number {
    return CONFIG.metrics.maxHistoryPoints;
}

/** Re-read CONFIG on each call to reflect runtime overlay changes (config import drift fix). */
function getDefaultThresholds(): MetricsThreshold[] {
    return [
        {
            metric: 'avgLatency',
            warning: CONFIG.metrics.defaultThresholds.avgLatency.warning,
            critical: CONFIG.metrics.defaultThresholds.avgLatency.critical,
            operator: 'gt',
        },
        {
            metric: 'errorRate',
            warning: CONFIG.metrics.defaultThresholds.errorRate.warning,
            critical: CONFIG.metrics.defaultThresholds.errorRate.critical,
            operator: 'gt',
        },
        {
            metric: 'successRate',
            warning: CONFIG.metrics.defaultThresholds.successRate.warning,
            critical: CONFIG.metrics.defaultThresholds.successRate.critical,
            operator: 'lt',
        },
        {
            metric: 'totalTokens',
            warning: CONFIG.metrics.defaultThresholds.totalTokens.warning,
            critical: CONFIG.metrics.defaultThresholds.totalTokens.critical,
            operator: 'gt',
        },
    ];
}

export interface MetricsServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    kernel: { getState: () => SystemState };
}

export class MetricsService {
    private history: TimeSeriesPoint[] = [];
    private thresholds: MetricsThreshold[] = [...getDefaultThresholds()];
    private alerts: MetricAlert[] = [];
    private unsubs: Array<() => void> = [];
    private captureInterval: ReturnType<typeof setInterval> | null = null;
    private deps: MetricsServiceDeps;
    private recentLatencies: Map<string, number[]> = new Map();
    private throughput: Map<string, { count: number; windowStart: number }> = new Map();
    private readonly MAX_RECENT = 100;
    private readonly THROUGHPUT_WINDOW = 60000;
    private readonly ALERT_RETENTION_MS = 24 * 60 * 60 * 1000;
    private readonly AGENT_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;
    private _initialized = false;

    constructor(deps: MetricsServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        await this.load();
        this.setupAutoCapture();
        this.startCleanup();
    }

    destroy() {
        this._initialized = false;
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.recentLatencies.clear();
        this.throughput.clear();
    }

    private startCleanup() {
        this.cleanupInterval = setInterval(() => {
            const cutoff = Date.now() - this.ALERT_RETENTION_MS;
            this.alerts = this.alerts.filter((a) => !a.resolved || a.timestamp > cutoff);
            // Prune agent maps — evict entries not updated in the last hour
            const agentCutoff = Date.now() - 60 * 60 * 1000;
            for (const [agentId, entry] of this.throughput) {
                if (entry.windowStart < agentCutoff) {
                    this.recentLatencies.delete(agentId);
                    this.throughput.delete(agentId);
                }
            }
            this.persist().catch((e) =>
                LOGGER.warn('MetricsService', 'Cleanup persist failed', { error: e }),
            );
        }, this.AGENT_CLEANUP_INTERVAL_MS);
    }

    private async load() {
        try {
            const saved = await this.deps.database.getKv<{
                history: TimeSeriesPoint[];
                thresholds: MetricsThreshold[];
                alerts: MetricAlert[];
            }>(METRICS_KEY);
            if (saved) {
                this.history = saved.history || [];
                this.thresholds = saved.thresholds || getDefaultThresholds();
                this.alerts = saved.alerts || [];
            }
        } catch (e) {
            LOGGER.error('MetricsService', 'Failed to load', { error: e });
        }
    }

    private async persist() {
        try {
            await this.deps.database.setKv(METRICS_KEY, {
                history: this.history.slice(-getMaxHistoryPoints()),
                thresholds: this.thresholds,
                alerts: this.alerts,
            });
        } catch (e) {
            LOGGER.error('MetricsService', 'Failed to persist', { error: e });
        }
    }

    private setupAutoCapture() {
        this.captureInterval = setInterval(() => {
            this.captureSnapshot();
        }, CONFIG.metrics.autoCaptureIntervalMs);
        let lastCapture = 0;
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.KERNEL_UPDATED, () => {
                const now = Date.now();
                if (now - lastCapture > 5000) {
                    lastCapture = now;
                    this.captureSnapshot();
                }
            }),
        );
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.COGNITIVE_STEP_COMPLETED, (data: unknown) => {
                const d = data as { nodeId?: string; duration?: number };
                if (d.nodeId && d.duration != null) {
                    this.recordLatency(d.nodeId, d.duration);
                    this.recordThroughput(d.nodeId);
                }
            }),
        );
    }

    private async captureSnapshot() {
        const state = this.deps.kernel.getState();
        if (!state) return;

        const now = Date.now();
        const points: TimeSeriesPoint[] = [
            { timestamp: now, value: state.totalRequests, label: 'requests' },
            { timestamp: now, value: state.totalTokens, label: 'tokens' },
            { timestamp: now, value: state.estimatedCost, label: 'cost' },
        ];

        const providerStates = Object.values(state.providers);
        if (providerStates.length > 0) {
            const avgLatency =
                providerStates.reduce((s, p) => s + p.avgTTFT, 0) / providerStates.length;
            points.push({ timestamp: now, value: Math.round(avgLatency), label: 'avgLatency' });
        }

        this.history.push(...points);
        if (this.history.length > getMaxHistoryPoints()) {
            this.history = this.history.slice(-getMaxHistoryPoints());
        }

        this.checkThresholds();
        await this.persist();
    }

    private checkThresholds() {
        const report = this.generateAggregated();
        for (const threshold of this.thresholds) {
            let value: number;
            switch (threshold.metric) {
                case 'avgLatency':
                    value = report.avgLatency;
                    break;
                case 'errorRate':
                    value = report.errorRate;
                    break;
                case 'successRate':
                    value = report.successRate;
                    break;
                case 'totalTokens':
                    value = report.totalTokens;
                    break;
                default:
                    continue;
            }

            const breached =
                threshold.operator === 'gt' ? value > threshold.warning : value < threshold.warning;
            const critical =
                threshold.operator === 'gt'
                    ? value > threshold.critical
                    : value < threshold.critical;

            if (
                breached &&
                !this.alerts.some((a) => a.metric === threshold.metric && !a.resolved)
            ) {
                const alert: MetricAlert = {
                    id: `alert-${Date.now()}`,
                    metric: threshold.metric,
                    value,
                    threshold: critical ? threshold.critical : threshold.warning,
                    severity: critical ? 'critical' : 'warning',
                    timestamp: Date.now(),
                    resolved: false,
                };
                this.alerts.push(alert);
                this.deps.eventBus.emitOnce(EVENTS.METRICS_ALERT, alert.id, {
                    id: alert.id,
                    metric: alert.metric,
                    value: alert.value,
                    severity: alert.severity,
                    timestamp: alert.timestamp,
                });
                this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Metric alert: ${threshold.metric} = ${value} (${critical ? 'critical' : 'warning'})`,
                    type: critical ? 'error' : 'warning',
                });
            }
        }
    }

    generateAggregated(): AggregatedMetrics {
        const state = this.deps.kernel.getState();
        const providerStates = Object.values(state.providers);
        const activeProviders = providerStates.filter((p) => p.status === 'healthy');

        const avgLatency =
            providerStates.length > 0
                ? providerStates.reduce((sum, p) => sum + p.avgTTFT, 0) / providerStates.length
                : 0;

        const totalProviderRequests = providerStates.reduce(
            (sum, p) => sum + (p.totalRequests || 0),
            0,
        );
        const totalProviderErrors = providerStates.reduce((sum, p) => sum + (p.errorCount || 0), 0);
        const realSuccessRate =
            totalProviderRequests > 0
                ? (totalProviderRequests - totalProviderErrors) / totalProviderRequests
                : 1;

        return {
            totalRequests: state.totalRequests,
            totalTokens: state.totalTokens,
            estimatedCost: state.estimatedCost,
            avgLatency,
            avgTTFT: avgLatency,
            avgTPS:
                providerStates.length > 0
                    ? providerStates.reduce((sum, p) => sum + p.avgTPS, 0) / providerStates.length
                    : 0,
            successRate: realSuccessRate,
            errorRate: 1 - realSuccessRate,
            activeProviders: activeProviders.length,
            totalProviders: providerStates.length,
            decisions: state.decisions.length,
            violations: state.violations.length,
        };
    }

    generateProviderSummaries(): ProviderMetricSummary[] {
        const state = this.deps.kernel.getState();
        return Object.entries(state.providers).map(([id, p]) => ({
            id,
            avgLatency: p.avgTTFT,
            avgTTFT: p.avgTTFT,
            avgTPS: p.avgTPS,
            successCount: p.totalRequests,
            errorCount: p.errorCount ?? 0,
            totalTokens: p.totalTokens ?? 0,
            reliability: p.reliability,
            stabilityIndex: p.stabilityIndex,
            reputationScore: p.reputationScore,
            currentConcurrent: p.currentConcurrent ?? 0,
            status: p.status,
        }));
    }

    generateReport(): MetricsReport {
        const aggregated = this.generateAggregated();
        const providers = this.generateProviderSummaries();
        const sorted = [...providers].sort((a, b) => b.reputationScore - a.reputationScore);
        return {
            aggregated,
            providers,
            history: this.history.slice(-CONFIG.metrics.defaultReportLimit),
            topProvider: sorted[0] || null,
            worstProvider: sorted[sorted.length - 1] || null,
            timestamp: Date.now(),
        };
    }

    getHistory(metric?: string, limit = 100): TimeSeriesPoint[] {
        let points = this.history;
        if (metric) points = points.filter((p) => !p.label || p.label === metric);
        return points.slice(-limit);
    }

    getAllMetrics() {
        return this.generateReport();
    }
    getAlerts(includeResolved = false): MetricAlert[] {
        return includeResolved ? this.alerts : this.alerts.filter((a) => !a.resolved);
    }
    async resolveAlert(id: string) {
        const alert = this.alerts.find((a) => a.id === id);
        if (alert) {
            alert.resolved = true;
            this.deps.eventBus.emitOnce(EVENTS.METRICS_ALERT_RESOLVED, alert.id, {
                id: alert.id,
                timestamp: Date.now(),
            });
            await this.persist();
        }
    }
    getThresholds(): MetricsThreshold[] {
        return [...this.thresholds];
    }
    async setThresholds(thresholds: MetricsThreshold[]) {
        this.thresholds = thresholds;
        await this.persist();
    }
    async resetHistory() {
        this.history = [];
        this.alerts = [];
        await this.persist();
    }
    getTimeRange(from: number, to: number): TimeSeriesPoint[] {
        return this.history.filter((p) => p.timestamp >= from && p.timestamp <= to);
    }

    recordLatency(agentId: string, latencyMs: number) {
        const buf = this.recentLatencies.get(agentId) || [];
        buf.push(latencyMs);
        if (buf.length > this.MAX_RECENT) buf.shift();
        this.recentLatencies.set(agentId, buf);
    }

    recordThroughput(agentId: string) {
        const now = Date.now();
        const entry = this.throughput.get(agentId) || { count: 0, windowStart: now };
        if (now - entry.windowStart > this.THROUGHPUT_WINDOW) {
            entry.count = 1;
            entry.windowStart = now;
        } else {
            entry.count++;
        }
        this.throughput.set(agentId, entry);
    }

    getAgentPercentiles(agentId: string): { p50: number; p90: number; p95: number; p99: number } {
        const buf = (this.recentLatencies.get(agentId) || []).slice().sort((a, b) => a - b);
        if (buf.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0 };
        const len = buf.length;
        return {
            p50: buf[Math.floor(len * 0.5)]!,
            p90: buf[Math.floor(len * 0.9)]!,
            p95: buf[Math.floor(len * 0.95)]!,
            p99: buf[Math.floor(len * 0.99)]!,
        };
    }

    getAgentThroughput(agentId: string): number {
        const entry = this.throughput.get(agentId);
        if (!entry) return 0;
        const elapsed = (Date.now() - entry.windowStart) / 1000;
        return elapsed > 0 ? entry.count / elapsed : 0;
    }
}
