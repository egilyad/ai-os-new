// ── P0.16: Causal Loop Mapping (Детектор системных эффектов) ──────────────
// Tracks causal claims made by agents, detects linear thinking patterns,
// and injects prompts forcing consideration of feedback loops and
// second/third-order effects in policy debates.

export interface CausalLink {
    readonly cause: string;
    readonly effect: string;
    readonly agentId: string;
    readonly round: number;
    readonly order: number; // 1 = direct, 2 = second-order, 3 = third-order
}

export interface CausalAnalysis {
    readonly totalClaims: number;
    readonly linearChains: number;
    readonly feedbackLoops: number;
    readonly avgDepth: number;
    readonly missingDimensions: string[];
}

export interface ICausalGraphBuilder {
    /** Record a causal claim from an agent's argument. */
    ingestClaim(sessionId: string, agentId: string, claim: string, round: number): void;

    /** Analyze causal graph and return prompt text for the next argument. */
    getCausalContext(
        sessionId: string,
        agentId: string,
        allParticipantIds: string[],
        round: number,
        language: string,
    ): string | undefined;

    /** Get current analysis for a session. */
    getAnalysis(sessionId: string): CausalAnalysis | undefined;

    /** Reset all state for a session. */
    reset(sessionId: string): void;
}
