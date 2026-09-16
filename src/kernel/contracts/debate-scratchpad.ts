// ── Hidden Scratchpad / Inner Monologue (P2.11) ──────────────────
// Pre-generation tactical analysis — not visible to other agents.

export interface ScratchpadAnalysis {
    /** Key weaknesses in opponent positions */
    weaknesses: string[];
    /** Unanswered points the agent can exploit */
    opportunities: string[];
    /** Recommended tactical focus for this turn */
    tacticalFocus: string;
    /** Formatted prompt block for injection */
    promptBlock: string;
}

export interface IScratchpadService {
    /** Generate tactical analysis before argument generation */
    analyze(
        agentId: string,
        agentRole: string,
        round: number,
        history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
        topic: string,
        language: string,
    ): ScratchpadAnalysis;
}
