// ── Echo Chamber / Redundancy Monitor (P1.26) ───────────────────────────
// Tracks argument similarity across recent agent turns using Jaccard overlap.
// When redundancy exceeds threshold, injects a forced-novelty prompt block.
// Affects all debate modes, all agents, all rounds — infrastructure service.

export interface RedundancyRecord {
    readonly agentId: string;
    readonly round: number;
    readonly similarityScore: number; // 0-1, Jaccard of token sets
    readonly comparedWith: string; // content hash of the most similar prior turn
    readonly isRedundant: boolean; // true if similarityScore >= threshold
}

export interface ISimilarityMonitor {
    /**
     * Record a new argument and check it against the agent's recent history.
     * Returns a RedundancyRecord describing the comparison.
     * slidingWindow: how many prior turns to compare against (default 3).
     */
    recordArgument(
        agentId: string,
        round: number,
        content: string,
        slidingWindow?: number,
    ): RedundancyRecord;

    /**
     * Get the redundancy status for an agent in a given round.
     * Returns undefined if no argument was recorded for this round.
     */
    getRedundancy(agentId: string, round: number): RedundancyRecord | undefined;

    /**
     * Clean up data for a completed session — prevents memory leak across debates.
     */
    clearSession(): void;
}
