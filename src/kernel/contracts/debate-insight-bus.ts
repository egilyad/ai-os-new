// ── InsightBus (P1.21) ──────────────────────────────────────────────
// Cross-round insight accumulation: extracts key contradictions,
// surprising arguments, and hidden premises after each round,
// then re-injects them into subsequent prompts so the debate
// builds on cumulative understanding rather than forgetting.

export type InsightType = 'contradiction' | 'surprise' | 'premise';

export interface Insight {
    readonly type: InsightType;
    /** Short one-line description of the insight. */
    readonly text: string;
    /** A direct quote from the argument that triggered this insight. */
    readonly quote: string;
    /** Which round this was discovered in. */
    readonly round: number;
    /** Significance 0-1 (higher = more important). */
    readonly significance: number;
}

export interface IInsightBus {
    /**
     * Process all arguments from the completed round, extract insights,
     * and store them for future rounds.
     */
    ingestRound(
        round: number,
        allArguments: Array<{ agentId: string; content: string; agentName?: string }>,
    ): void;

    /**
     * Get all currently active insights (last 3 rounds),
     * formatted as a single string for prompt injection.
     * Returns empty string if no insights available.
     */
    getFormattedInsights(language?: string): string;

    /**
     * Get raw active insights for potential use by other services.
     */
    getActiveInsights(): Insight[];

    /**
     * Clean up data for a completed session.
     */
    clearSession(): void;
}
