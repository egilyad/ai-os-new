// ── DPO-Guided Strategy Sampler (P1.10) ──────────────────────────
// Heuristic preference model for ranking arguments by relevance,
// novelty, and persuasiveness — inspired by DPO preference optimization.

export interface PreferenceScore {
    relevance: number; // topic alignment (0-1)
    novelty: number; // distance from existing arguments (0-1)
    persuasiveness: number; // signal-word heuristic (0-1)
    overall: number; // weighted combination (0-1)
}

export interface IDpoStrategySampler {
    /** Score a single argument against the topic and existing arguments */
    scorePreference(text: string, topic: string, existingArgs: string[]): PreferenceScore;

    /** Rank arguments by preference score, return top-K */
    rankByPreference(
        args: Array<{ text: string; agentId: string }>,
        topic: string,
        topK: number,
    ): Array<{ text: string; agentId: string; score: PreferenceScore }>;
}
