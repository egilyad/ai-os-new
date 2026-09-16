// ── Epistemic Uncertainty Calibration (P1.3) ──────────────────────────
// Heuristic claim-level confidence scoring + calibration enforcement.
// Builds on P1.7 (epistemic humility) + P1.27 (uncertainty markers).

export interface ClaimScore {
    claimText: string;
    heuristicScore: number; // 0.0-1.0 based on evidence patterns
    statedConfidence: number; // from P1.27 marker if present, else -1
    mismatch: number; // |heuristic - stated|, 0 if no stated marker
    hasCitation: boolean;
    hasData: boolean;
    hasAbsoluteLanguage: boolean;
}

export interface CalibrationViolation {
    agentId: string;
    round: number;
    score: number;
    violationType: 'overconfident' | 'underconfident';
    claimSnippet: string;
}

export interface ICalibrationService {
    /** Score all claims in a text, return per-claim analysis + aggregate */
    scoreClaims(text: string): {
        scores: ClaimScore[];
        avgHeuristic: number;
        violations: CalibrationViolation[];
    };

    /** Track calibration outcome for penalty accumulation */
    trackCalibration(agentId: string, _round: number, avgScore: number, wasAccurate: boolean): void;

    /** Generate calibration enforcement prompt for an agent */
    getCalibrationPrompt(agentId: string, _round: number, language?: string): string;

    /** Clear agent history (on session end) */
    clearSession(): void;
}
