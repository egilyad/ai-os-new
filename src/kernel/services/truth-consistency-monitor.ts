import { rootLogger } from './logger-service';
import type { ILifecycle } from '../contracts/lifecycle';
import type {
    ITruthConsistencyMonitor,
    ConsistencyReport,
    DriftEntry,
    DriftSeverity,
} from '../contracts/truth-consistency';

const LOGGER = rootLogger.child('TruthConsistencyMonitor');

/** Per-key projection entry shape we extract from KeyStateProjection */
interface KeyStateEntry {
    provider: string;
    latency: number;
    status: string;
    rateLimited?: boolean;
    healthErrors?: number;
    authFailed?: boolean;
}

/** Map projection key states → per-provider metrics for comparison */
function deriveProviderMetrics(
    data: Record<string, unknown>,
): Record<string, { avgTTFT: number; reliability: number; status: string }> {
    const keys = Object.values(data) as KeyStateEntry[];
    const byProvider: Record<string, KeyStateEntry[]> = {};
    for (const k of keys) {
        const p = k.provider;
        if (!p) continue;
        (byProvider[p] ??= []).push(k);
    }

    const result: Record<string, { avgTTFT: number; reliability: number; status: string }> = {};
    for (const [provider, entries] of Object.entries(byProvider)) {
        const anyBroken = entries.some((e) => e.status === 'broken' || e.status === 'offline');
        const anyLimited = entries.some((e) => e.rateLimited === true);
        const avgLat = entries.reduce((s, e) => s + (e.latency || 0), 0) / entries.length;
        const errors = entries.reduce((s, e) => s + (e.healthErrors || 0), 0);
        const reliability = anyBroken ? 0 : anyLimited ? 0.3 : Math.max(0.4, 1 - errors * 0.1);
        const status = anyBroken ? 'offline' : anyLimited ? 'degraded' : 'healthy';

        // Map projection KeyStatus to kernel status
        const kernelStatusMap: Record<string, string> = {
            ready: 'healthy',
            healthy: 'healthy',
            active: 'healthy',
            limited: 'degraded',
            degraded: 'degraded',
            broken: 'offline',
            offline: 'offline',
            error: 'offline',
            unknown: 'healthy',
        };

        result[provider] = {
            avgTTFT: Math.round(avgLat),
            reliability: Math.round(reliability * 1000) / 1000,
            status: kernelStatusMap[status] ?? 'healthy',
        };
    }
    return result;
}

const DRIFT_THRESHOLDS = {
    reliability: { minor: 0.05, major: 0.15 },
    avgTTFT: { minor: 100, major: 500 },
};

function classifyDrift(field: string, diff: number): DriftSeverity {
    const t = DRIFT_THRESHOLDS[field as keyof typeof DRIFT_THRESHOLDS] ?? {
        minor: 0.01,
        major: 0.1,
    };
    const abs = Math.abs(diff);
    if (abs === 0) return 'match';
    if (abs <= t.minor) return 'minor';
    if (abs <= t.major) return 'major';
    return 'critical';
}

export class TruthConsistencyMonitor implements ITruthConsistencyMonitor, ILifecycle {
    private checkTimer: ReturnType<typeof setInterval> | null = null;
    private _started = false;
    private deps?: {
        eventBus: { emit: (event: string, data?: unknown) => void };
        getKernelProviders: () => Record<
            string,
            { avgTTFT: number; reliability: number; status: string }
        >;
        getProjectionKeyStates: () => Record<string, unknown>;
    };

    setDeps(deps: Exclude<typeof TruthConsistencyMonitor.prototype.deps, undefined>): void {
        this.deps = deps;
    }

    async init(): Promise<void> {}

    async start(): Promise<void> {
        if (this._started || !this.deps) return;
        this._started = true;
        this.checkTimer = setInterval(() => {
            try {
                const report = this.check(
                    this.deps!.getKernelProviders(),
                    this.deps!.getProjectionKeyStates(),
                );
                if (report.status !== 'OK') {
                    LOGGER.warn('TruthConsistencyMonitor', 'Auto-check detected drift', {
                        status: report.status,
                        driftScore: report.driftScore,
                        mismatches: report.mismatches.length,
                    });
                    this.repair(report, this.deps!.eventBus);
                }
            } catch (e) {
                LOGGER.error('TruthConsistencyMonitor', 'Auto-check failed', { error: e });
            }
        }, 300000); // every 5 minutes
    }

    async destroy(): Promise<void> {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        this._started = false;
    }
    check(
        kernelProviders: Record<string, { avgTTFT: number; reliability: number; status: string }>,
        projectionKeyStates: Record<string, unknown>,
    ): ConsistencyReport {
        const projected = deriveProviderMetrics(projectionKeyStates);
        const allProviders = new Set([...Object.keys(kernelProviders), ...Object.keys(projected)]);

        const mismatches: DriftEntry[] = [];

        for (const provider of allProviders) {
            const k = kernelProviders[provider];
            const p = projected[provider];

            // Provider missing from one side
            if (!k) {
                mismatches.push({
                    provider,
                    field: 'exists',
                    kernelValue: 'present',
                    projectionValue: 'absent',
                    severity: 'critical',
                });
                continue;
            }
            if (!p) {
                mismatches.push({
                    provider,
                    field: 'exists',
                    kernelValue: 'absent',
                    projectionValue: 'present',
                    severity: 'critical',
                });
                continue;
            }

            // Reliability drift
            const relDiff = k.reliability - p.reliability;
            if (Math.abs(relDiff) > 0.01) {
                mismatches.push({
                    provider,
                    field: 'reliability',
                    kernelValue: k.reliability,
                    projectionValue: p.reliability,
                    severity: classifyDrift('reliability', relDiff),
                });
            }

            // AvgTTFT drift
            const latDiff = k.avgTTFT - p.avgTTFT;
            if (Math.abs(latDiff) > 2) {
                mismatches.push({
                    provider,
                    field: 'avgTTFT',
                    kernelValue: k.avgTTFT,
                    projectionValue: p.avgTTFT,
                    severity: classifyDrift('avgTTFT', latDiff),
                });
            }

            // Status mismatch
            if (k.status !== p.status) {
                mismatches.push({
                    provider,
                    field: 'status',
                    kernelValue: k.status,
                    projectionValue: p.status,
                    severity: 'major',
                });
            }
        }

        const criticalCount = mismatches.filter((m) => m.severity === 'critical').length;
        const majorCount = mismatches.filter((m) => m.severity === 'major').length;

        let status: 'OK' | 'DRIFT' | 'CRITICAL';
        let driftScore: number;

        if (criticalCount > 0) {
            status = 'CRITICAL';
            driftScore = 1.0;
        } else if (majorCount > 0) {
            status = 'DRIFT';
            driftScore = 0.5 + majorCount * 0.1;
        } else if (mismatches.length > 0) {
            status = 'DRIFT';
            driftScore = 0.2;
        } else {
            status = 'OK';
            driftScore = 0;
        }

        if (status === 'CRITICAL') {
            LOGGER.error('TruthConsistencyMonitor', 'CRITICAL consistency drift detected', {
                driftScore,
                criticalCount,
                majorCount,
                mismatchCount: mismatches.length,
                providers: mismatches.map(
                    (m) =>
                        `${m.provider}.${m.field}: ${String(m.kernelValue)} vs ${String(m.projectionValue)}`,
                ),
            });
        } else if (status === 'DRIFT') {
            LOGGER.warn('TruthConsistencyMonitor', 'Consistency drift detected', {
                driftScore,
                criticalCount,
                majorCount,
                mismatches: mismatches.length,
            });
        }

        return {
            status,
            driftScore: Math.min(1, driftScore),
            mismatches,
            checkedAt: Date.now(),
            providerCount: allProviders.size,
        };
    }

    /** H-20: Attempt to repair detected drift — emits RECONCILE events for critical/major mismatches */
    repair(
        report: ConsistencyReport,
        eventBus: { emit: (event: string, data?: unknown) => void },
    ): number {
        let resolved = 0;
        for (const mismatch of report.mismatches) {
            if (mismatch.severity === 'critical' || mismatch.severity === 'major') {
                eventBus.emit('kernel:reconcile:requested', {
                    provider: mismatch.provider,
                    field: mismatch.field,
                    kernelValue: mismatch.kernelValue,
                    projectionValue: mismatch.projectionValue,
                    severity: mismatch.severity,
                });
                LOGGER.info(
                    'TruthConsistencyMonitor',
                    `Repair triggered for ${mismatch.provider}.${mismatch.field}`,
                    {
                        severity: mismatch.severity,
                    },
                );
                resolved++;
            } else if (mismatch.severity === 'minor') {
                LOGGER.debug(
                    'TruthConsistencyMonitor',
                    `Minor drift for ${mismatch.provider}.${mismatch.field} — no repair needed`,
                );
            }
        }
        if (resolved > 0) {
            eventBus.emit('kernel:consistency:repair:completed', {
                checkedAt: report.checkedAt,
                resolved,
                totalMismatches: report.mismatches.length,
            });
        }
        return resolved;
    }
}
