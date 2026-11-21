/**
 * Mission-level metrics (gap-analysis p6).
 *
 * Complements EvalHub (per-case scoring) with mission-level signals:
 * completion rate, share of missions finished without replan, token cost per
 * mission, time to first artifact, and verifier accuracy against a known
 * outcome. In-memory ring buffer (last 200) — no persistence layer needed.
 */
import type {
    IMissionMetricsService,
    MissionMetricInput,
    MissionMetricsSummary,
} from '../../contracts/mission-metrics';

const MAX_RECORDS = 200;

export class MissionMetricsService implements IMissionMetricsService {
    private records: MissionMetricInput[] = [];

    record(input: MissionMetricInput): void {
        this.records.push(input);
        if (this.records.length > MAX_RECORDS) this.records.shift();
    }

    summary(): MissionMetricsSummary {
        const n = this.records.length;
        if (n === 0) {
            return {
                total: 0,
                completed: 0,
                failed: 0,
                completionRate: 0,
                noReplanRate: 0,
                avgReplans: 0,
                avgCostUsd: 0,
                avgFirstArtifactMs: 0,
                avgDurationMs: 0,
            };
        }
        const sum = (fn: (r: MissionMetricInput) => number) =>
            this.records.reduce((acc, r) => acc + fn(r), 0) / n;
        const completed = this.records.filter((r) => r.status === 'completed').length;
        const verified = this.records.filter(
            (r) => r.verification !== undefined && r.actualSuccess !== undefined,
        );
        const correct = verified.filter(
            (r) => (r.verification === 'pass') === r.actualSuccess,
        ).length;

        const summary: MissionMetricsSummary = {
            total: n,
            completed,
            failed: n - completed,
            completionRate: completed / n,
            noReplanRate: this.records.filter((r) => r.replans === 0).length / n,
            avgReplans: sum((r) => r.replans),
            avgCostUsd: sum((r) => r.costUsd),
            avgFirstArtifactMs: sum((r) => r.firstArtifactMs),
            avgDurationMs: sum((r) => r.durationMs),
        };
        if (verified.length > 0) summary.verifierAccuracy = correct / verified.length;
        return summary;
    }

    reset(): void {
        this.records = [];
    }
}
