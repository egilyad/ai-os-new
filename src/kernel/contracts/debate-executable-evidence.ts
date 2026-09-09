// ── Executable Evidence (P0) ───────────────────────────────────────
// Write executable code (Python/JS) to numerically verify factual claims.
// Heuristic: detect numeric/testable claims and require code block.

export interface ExecutableClaim {
    readonly claimText: string;
    readonly isTestable: boolean;
    readonly hasCode: boolean;
}

export interface IExecutableEvidenceService {
    /** Check if text contains a numerically testable claim. */
    hasTestableClaim(text: string): boolean;

    /** Check if text contains an executable code block. */
    hasCodeBlock(text: string): boolean;

    /** Validate that testable claims are backed by code. */
    validate(text: string): ExecutableClaim[];
}
