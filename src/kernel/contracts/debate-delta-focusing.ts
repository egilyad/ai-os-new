// ── Delta-Focusing (P0) ────────────────────────────────────────────
// Highlight only points of disagreement, skip consensus.
// The agent must ignore claims it agrees with and sharpen divergence.

export interface DeltaPoint {
    readonly claimId: string;
    readonly claimText: string;
    readonly opponentId: string;
    readonly round: number;
    readonly divergenceScore: number; // 0-1
}

export interface IDeltaFocusingService {
    /** Return claims where the current agent disagrees most with previous arguments. */
    getDeltaPoints(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): DeltaPoint[];
}
