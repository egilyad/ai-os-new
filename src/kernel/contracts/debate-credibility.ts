// ── Dynamic Source Credibility Rater (P0.12) ─────────────────────────
// Scores sources by domain authority, recency, and citation count.
// Injects credibility-aware prompts and evaluator penalties.

export interface SourceCredibility {
    readonly source: string;
    readonly domainTier: number; // 1=high (journals), 5=low (blogs/forums)
    readonly domainLabel: string;
    readonly score: number; // 0-1
}

export interface ICredibilityScorer {
    /** Score a source citation string (URL or "According to X"). */
    scoreSource(source: string): SourceCredibility;

    /** Score multiple sources and return average. */
    scoreSources(sources: string[]): {
        scores: SourceCredibility[];
        average: number;
        lowestTier: number;
    };
}
