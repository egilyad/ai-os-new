// ── Key-Moment Replay Selector (P1.22) ──────────────────────────────
// Identifies pivotal debate turns (rebuttal spikes, emotional peaks,
// stance changes) and re-injects summaries every 3 rounds to
// preserve continuity across long debates.

export interface PivotalMoment {
    readonly round: number;
    readonly agentId: string;
    readonly agentName?: string;
    readonly type: 'rebuttal' | 'emotion' | 'stance_change';
    readonly description: string;
    readonly quote: string;
    readonly significance: number;
}

export interface IReplaySelector {
    /**
     * Process all arguments from the completed round.
     * Extracts and scores pivotal moments.
     */
    ingestRound(
        round: number,
        allArguments: Array<{ agentId: string; content: string; agentName?: string }>,
    ): void;

    /**
     * Get formatted summary of top pivotal moments for prompt injection.
     * Returns empty string when no replay is due (defaults to every 3 rounds).
     * Pass currentRound to determine if injection is due.
     */
    getFormattedReplay(currentRound: number, language?: string): string;

    /**
     * Get raw pivotal moments for potential use by other services.
     */
    getPivotalMoments(): PivotalMoment[];

    /**
     * Clean up data for a completed session.
     */
    clearSession(): void;
}
