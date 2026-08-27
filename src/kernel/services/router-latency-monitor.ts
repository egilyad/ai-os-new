import type { SystemState, RouterWeights } from '../types/metrics-types';
import type { RouterConfig, WeightProfile } from '../types/routing-types';
import { EVENTS } from '../events/event-names';

export interface LatencyMonitorDeps {
    eventBus: {
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    kernel: {
        getState: () => SystemState;
        setBaseWeights: (weights: RouterWeights) => void;
    };
    getActiveProfile: () => WeightProfile;
}

export class RouterLatencyMonitor {
    private latencyUnsub: (() => void) | null = null;
    private monitorInterval: ReturnType<typeof setInterval> | null = null;
    private notifiedDegraded = new Set<string>();

    constructor(private deps: LatencyMonitorDeps) {}

    private getConfig(): RouterConfig | null {
        try {
            const activeProfile = this.deps.getActiveProfile();
            if (activeProfile && activeProfile.name) {
                return {
                    latency: { degradationRatio: 2, monitorIntervalMs: 30000 },
                } as RouterConfig;
            }
        } catch {
            /* ignore */
        }
        return null;
    }

    startMonitoring(config: RouterConfig): void {
        if (this.monitorInterval || this.latencyUnsub) {
            this.stopMonitoring();
        }
        this.latencyUnsub = this.deps.eventBus.onSafe<{ provider: string }>(
            EVENTS.KEY_LATENCY_BURST,
            () => {
                const current = this.getConfig() ?? config;
                this.checkLatencyHealth(current);
            },
        );

        const intervalMs =
            this.getConfig()?.latency?.monitorIntervalMs ?? config.latency.monitorIntervalMs;
        this.monitorInterval = setInterval(() => {
            const current = this.getConfig() ?? config;
            this.checkLatencyHealth(current);
        }, intervalMs);
    }

    private checkLatencyHealth(config: RouterConfig): void {
        const state = this.deps.kernel.getState();
        const providerIds = Object.keys(state.providers);
        if (providerIds.length < 2) return;

        const entries: { provider: string; avg: number }[] = [];
        for (const p of providerIds) {
            const avg = state.providers[p]?.avgTTFT || 0;
            entries.push({ provider: p, avg });
        }

        const sorted = [...entries].sort((a, b) => a.avg - b.avg);
        const median =
            sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1]!.avg + sorted[sorted.length / 2]!.avg) / 2
                : sorted[Math.floor(sorted.length / 2)]?.avg || 0;
        if (median === 0) return;

        const degraded = sorted.filter(
            (e) => e.avg > median * config.latency.degradationRatio && e.avg > 0,
        );
        const degradedNow = new Set(degraded.map((d) => d.provider));
        for (const d of degraded) {
            if (this.notifiedDegraded.has(d.provider)) continue;
            const prevState = state.providers[d.provider];
            if (prevState && prevState.status === 'healthy') {
                this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Latency degradation on ${d.provider}: ${Math.round(d.avg)}ms (median ${Math.round(median)}ms)`,
                    type: 'warning',
                });
                this.notifiedDegraded.add(d.provider);
            }
        }
        for (const provider of [...this.notifiedDegraded]) {
            if (!degradedNow.has(provider)) {
                this.notifiedDegraded.delete(provider);
            }
        }

        if (degraded.length > 0) {
            const newWeights = this.getLatencyBalancedWeights(config);
            this.deps.kernel.setBaseWeights(newWeights);
        }
    }

    getProviderAvgLatency(provider: string): number {
        const key = provider.toLowerCase();
        return this.deps.kernel.getState().providers[key]?.avgTTFT || 0;
    }

    destroy(): void {
        this.stopMonitoring();
    }

    stopMonitoring(): void {
        if (this.latencyUnsub) {
            this.latencyUnsub();
            this.latencyUnsub = null;
        }
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    getLatencyBalancedWeights(_config: RouterConfig): RouterWeights {
        const state = this.deps.kernel.getState();
        const providers = Object.values(state.providers);
        const profile = this.deps.getActiveProfile();
        if (providers.length === 0) return profile.defaultWeights;

        const allLats = providers.map((p) => p.avgTTFT);

        const sorted = [...allLats].sort((a, b) => a - b);
        const median =
            sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
                : sorted[Math.floor(sorted.length / 2)] || 0;
        const max = sorted[sorted.length - 1] || 0;
        if (median === 0) return state.weights.effective;

        const variance = (max - median) / median;

        for (const band of profile.latencyVarianceBands) {
            if (variance > band.minVariance) return band.weights;
        }
        return state.weights.effective;
    }
}
