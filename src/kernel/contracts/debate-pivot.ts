// ── Pivot Strategy (P1) ──────────────────────────────────────────
// Change argument direction when current approach is failing.

export interface PivotSignal {
    readonly shouldPivot: boolean;
    readonly reason: string;
    readonly suggestedAngle: string;
}

export interface IPivotService {
    evaluate(agentId: string, recentScores: number[], currentRound: number): PivotSignal;
}
