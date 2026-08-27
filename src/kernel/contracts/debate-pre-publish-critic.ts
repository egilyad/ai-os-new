// ── Pre-Publish Critic (P0) ────────────────────────────────────────
// Internal critic evaluates an argument before release.
// Heuristic: detect unsupported claims, logical fallacies, weak analogies.

export interface CriticIssue {
    readonly type: 'unsupported' | 'fallacy' | 'weak_analogy' | 'factual' | 'vague';
    readonly severity: 'low' | 'medium' | 'high';
    readonly excerpt: string;
    readonly suggestion: string;
}

export interface IPrePublishCriticService {
    /** Review text before publishing; return issues found. */
    review(text: string): CriticIssue[];

    /** Quick check: should this argument be blocked for revision? */
    shouldBlock(text: string): boolean;
}
