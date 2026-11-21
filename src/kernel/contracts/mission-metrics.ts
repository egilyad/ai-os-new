export interface MissionMetricInput {
    missionId: string;
    goal: string;
    status: 'completed' | 'failed';
    /** Number of replan iterations triggered during the mission. */
    replans: number;
    /** Total token cost in USD (0 when not tracked). */
    costUsd: number;
    /** Milliseconds until the first node produced an artifact. */
    firstArtifactMs: number;
    /** Total mission duration in ms. */
    durationMs: number;
    /** Verifier verdict for the final artifact, if one was run. */
    verification?: 'pass' | 'revise' | 'reject';
    /** Ground-truth success signal for verifier accuracy (optional). */
    actualSuccess?: boolean;
}

export interface MissionMetricsSummary {
    total: number;
    completed: number;
    failed: number;
    completionRate: number;
    noReplanRate: number;
    avgReplans: number;
    avgCostUsd: number;
    avgFirstArtifactMs: number;
    avgDurationMs: number;
    verifierAccuracy?: number;
}

/** Mission-level eval metrics (gap-analysis p6): aggregate across recorded runs. */
export interface IMissionMetricsService {
    record(input: MissionMetricInput): void;
    summary(): MissionMetricsSummary;
    reset(): void;
}
