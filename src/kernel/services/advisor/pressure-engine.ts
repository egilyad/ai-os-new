import type {
    IPressureEngine,
    PressureMapSnapshot,
    ProviderPressure,
    GlobalPressure,
    AdvisorPressureLevel,
} from '../../contracts/advisor';

export interface PressureEngineDeps {
    keyService: {
        getKeys: () => Array<{
            id: string;
            provider: string;
            key: string;
            status: string;
            label?: string;
            latency?: number;
            stats?: {
                successCount?: number;
                errorCount?: number;
                extended?: {
                    usageToday?: { requests: number };
                    fourSignals?: {
                        latency: number;
                        throughput: number;
                        errorRate: number;
                        saturation: number;
                    };
                    rules?: { quota?: { requestsPerDay: number } };
                    alerts?: Array<{ resolved: boolean }>;
                    stabilityForecast?: string;
                    reputationScore?: number;
                    estimatedCost?: number;
                    errorBreakdown?: { rateLimit?: number; timeout?: number };
                };
            };
            availableModels?: string[];
        }>;
        getPoolStatus: (provider: string) => { status: string };
        getAlerts: () => Array<{ severity: string }>;
    };
    kernel: {
        getState: () => { totalRequests: number; estimatedCost: number };
    };
    routerService: {
        getProviderStats: () => Array<{
            id: string;
            status: string;
            reliability: number;
            avgTTFT: number;
        }>;
    };
    budgetService: {
        getBudgetInfo: () => {
            monthlyBudget: number;
            spentThisMonth: number;
            remainingBudget: number;
            dailyAverage: number;
            projectedMonthly: number;
            providerBudgets: Array<{
                provider: string;
                monthlyBudget: number;
                spentThisMonth: number;
                remainingBudget: number;
            }>;
        };
        getSpendSummary: () => {
            global: { pct: number; remaining: number };
            providers: Array<{ provider: string; pct: number }>;
        };
    };
    metricsService: {
        generateReport: () => {
            aggregated: {
                totalRequests: number;
                totalTokens: number;
                estimatedCost: number;
                avgLatency: number;
                successRate: number;
                errorRate: number;
            };
            providers: Array<{ id: string; status: string; reliability: number; avgTTFT: number }>;
        };
    };
}

export class PressureEngine implements IPressureEngine {
    private listeners: Array<(snapshot: PressureMapSnapshot) => void> = [];
    private interval: ReturnType<typeof setInterval> | null = null;
    private lastSnapshot: PressureMapSnapshot | null = null;
    private deps: PressureEngineDeps;

    constructor(deps: PressureEngineDeps) {
        this.deps = deps;
    }

    private getPressureLevel(score: number): AdvisorPressureLevel {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 35) return 'medium';
        if (score >= 10) return 'low';
        return 'none';
    }

    generateSnapshot(): PressureMapSnapshot {
        const keys = this.deps.keyService.getKeys();
        const state = this.deps.kernel.getState();
        const budgetInfo = this.deps.budgetService.getBudgetInfo();
        const spendSummary = this.deps.budgetService.getSpendSummary();
        const alerts = this.deps.keyService.getAlerts();
        const providerStats = this.deps.routerService.getProviderStats();

        const now = Date.now();
        const providerNames = [...new Set(keys.map((k) => k.provider))];

        const providers: ProviderPressure[] = providerNames.map((name) => {
            const pKeys = keys.filter((k) => k.provider === name);
            const pStats = providerStats.find((s) => s.id === name.toLowerCase());
            const pBudget = budgetInfo.providerBudgets.find(
                (b) => b.provider.toLowerCase() === name.toLowerCase(),
            );
            const pSpend = spendSummary.providers.find((s) => s.provider === name.toLowerCase());

            const activeKeys = pKeys.filter((k) => k.status === 'active');

            const signalSum = { latency: 0, throughput: 0, errorRate: 0, saturation: 0 };
            let signalCount = 0;
            for (const k of pKeys) {
                const ext = k.stats?.extended;
                if (ext?.fourSignals) {
                    signalSum.latency += ext.fourSignals.latency;
                    signalSum.throughput += ext.fourSignals.throughput;
                    signalSum.errorRate += ext.fourSignals.errorRate;
                    signalSum.saturation += ext.fourSignals.saturation;
                    signalCount++;
                }
            }
            const fourSignals =
                signalCount > 0
                    ? {
                          latency: signalSum.latency / signalCount,
                          throughput: signalSum.throughput / signalCount,
                          errorRate: signalSum.errorRate / signalCount,
                          saturation: signalSum.saturation / signalCount,
                      }
                    : { latency: 0, throughput: 0, errorRate: 0, saturation: 0 };

            const totalUsed = pKeys.reduce(
                (s, k) => s + (k.stats?.extended?.usageToday?.requests || 0),
                0,
            );
            const totalLimit = pKeys.reduce(
                (s, k) => s + (k.stats?.extended?.rules?.quota?.requestsPerDay || 0),
                0,
            );
            const quotaPct =
                totalLimit > 0 ? Math.min(100, Math.round((totalUsed / totalLimit) * 100)) : 0;

            const budgetPct = pSpend ? Math.round(pSpend.pct) : 0;
            const alertCount = pKeys.reduce(
                (s, k) => s + (k.stats?.extended?.alerts?.filter((a) => !a.resolved).length || 0),
                0,
            );
            const forecast = (pKeys.find((k) => k.stats?.extended?.stabilityForecast)?.stats
                ?.extended?.stabilityForecast || 'stable') as 'improving' | 'stable' | 'degrading';
            const avgLatency = pStats?.avgTTFT || 0;
            const remainingQuota = Math.max(0, totalLimit - totalUsed);
            const remainingBudget = pBudget?.remainingBudget ?? Number.MAX_SAFE_INTEGER;
            const kStatus = (pStats?.status as 'healthy' | 'degraded' | 'offline') || 'healthy';
            const reliability = pStats?.reliability ?? 1;

            const score = Math.min(
                100,
                Math.round(
                    (kStatus === 'offline' ? 100 : kStatus === 'degraded' ? 65 : 0) * 0.25 +
                        (1 - reliability) * 100 * 0.15 +
                        quotaPct * 0.2 +
                        budgetPct * 0.1 +
                        fourSignals.errorRate * 100 * 0.1 +
                        fourSignals.saturation * 100 * 0.1 +
                        fourSignals.latency * 100 * 0.1,
                ),
            );

            return {
                id: name.toLowerCase(),
                label: name,
                level: this.getPressureLevel(score),
                score,
                status: kStatus,
                reliability,
                quotaPct,
                budgetPct,
                keysActive: activeKeys.length,
                keysTotal: pKeys.length,
                latencySignal: fourSignals.latency,
                errorRateSignal: fourSignals.errorRate,
                saturation: fourSignals.saturation,
                avgLatency,
                remainingQuota,
                remainingBudget,
                forecast,
                alertCount,
            };
        });

        const totalKeys = keys.length;
        const activeKeys = keys.filter((k) => k.status === 'active').length;
        const degradedKeys = keys.filter(
            (k) => k.status === 'error' || k.status === 'quarantined' || k.status === 'compromised',
        ).length;
        const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
        const budgetPct = spendSummary.global.pct;

        const globalScore =
            providers.length > 0
                ? Math.round(providers.reduce((s, p) => s + p.score, 0) / providers.length)
                : 0;

        const global: GlobalPressure = {
            level: this.getPressureLevel(globalScore),
            score: globalScore,
            totalKeys,
            activeKeys,
            degradedKeys,
            totalAlerts: alerts.length,
            criticalAlerts,
            budgetUsagePct: Math.round(budgetPct),
            budgetRemaining: spendSummary.global.remaining,
            totalRequests: state.totalRequests,
            totalCost: state.estimatedCost,
        };

        const snapshot: PressureMapSnapshot = {
            timestamp: now,
            global,
            providers: providers.sort((a, b) => b.score - a.score),
        };
        this.lastSnapshot = snapshot;
        return snapshot;
    }

    getLastSnapshot(): PressureMapSnapshot | null {
        return this.lastSnapshot;
    }

    getProviderPressure(providerId: string): ProviderPressure | undefined {
        return this.lastSnapshot?.providers.find((p) => p.id === providerId);
    }

    startAutoRefresh(intervalMs = 10000) {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            const snap = this.generateSnapshot();
            for (const cb of this.listeners) cb(snap);
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    onUpdate(cb: (snapshot: PressureMapSnapshot) => void): () => void {
        this.listeners.push(cb);
        if (this.lastSnapshot) cb(this.lastSnapshot);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    destroy() {
        this.stopAutoRefresh();
        this.listeners = [];
        this.lastSnapshot = null;
    }
}
