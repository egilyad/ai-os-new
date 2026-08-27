// ── Evidence Triangulation (P0) ────────────────────────────────────
// Require cross-referencing claims against multiple independent sources.
// Heuristic: source type diversity + independence.

export interface TriangulationResult {
    readonly claimText: string;
    readonly sourceCount: number;
    readonly diverseTypes: number;
    readonly isTriangulated: boolean;
    readonly score: number; // 0-1
}

export interface IEvidenceTriangulationService {
    /** Score triangulation for a claim's sources. */
    checkTriangulation(claimText: string, sources: string[]): TriangulationResult;

    /** Whether claim meets triangulation threshold (>=2 independent types). */
    isSufficientlySupported(sources: string[]): boolean;
}
