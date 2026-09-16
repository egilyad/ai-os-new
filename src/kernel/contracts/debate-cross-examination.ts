// ── Cross-Examination (P0) ─────────────────────────────────────────
// Forces an agent to question a specific opponent claim rather than
// building its own argument. Targets the weakest link in the opponent
// argument chain.

export interface CrossExaminationTarget {
    readonly claimId: string;
    readonly claimText: string;
    readonly opponentId: string;
    readonly opponentName: string;
    readonly round: number;
    readonly weaknessScore: number; // 0-1, higher = weaker
}

export interface ICrossExaminationService {
    /** Pick the opponent claim most vulnerable to cross-examination. */
    selectTarget(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): CrossExaminationTarget | null;
}
