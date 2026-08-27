// ── Cross-History Consistency Enforcer (P0.11) ─────────────────────────
// Detects when agents contradict their own earlier claims across rounds.
// Pure heuristic — Jaccard similarity + contradiction markers.

export interface Contradiction {
    readonly earlierClaimId: string;
    readonly earlierClaimText: string;
    readonly earlierRound: number;
    readonly currentClaimText: string;
    readonly similarity: number;
    readonly isDirectContradiction: boolean;
}

export interface ConsistencyWarning {
    readonly agentName: string;
    readonly contradictions: Contradiction[];
}

export interface IConsistencyService {
    /** Check a new argument against all past arguments by the same agent.
     *  Returns contradictions found, or empty array if consistent. */
    checkConsistency(
        agentId: string,
        agentName: string,
        currentText: string,
        currentRound: number,
        previousArguments: Array<{
            id: string;
            agentId: string;
            content: string;
            round: number;
        }>,
    ): Contradiction[];

    /** Get consistency ratio for an agent (1.0 = fully consistent). */
    getConsistencyRatio(agentId: string): number;

    /** Reset for a new session. */
    reset(): void;
}
