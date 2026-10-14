// ── Dynamic Source Credibility Rater (P0.12) ─────────────────────────
// Scores sources by domain authority, recency, and citation count.
// Injects credibility-aware prompts and evaluator penalties.

export interface SourceCredibility {
    readonly source: string;
    readonly domainTier: number; // 1=high (journals), 5=low (blogs/forums)
    readonly domainLabel: string;
    readonly score: number; // 0-1
    /** Verified URL extracted from the citation text (cleaned, capped). Safe to render as a link. Absent for quote-only citations. */
    readonly url?: string;
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
