// ── Burden of Proof (P0) ───────────────────────────────────────────
// Track which claims remain unsupported; demand evidence for bare assertions.
// Heuristic: claim without citation / number / source marker is unsupported.

export interface UnsupportedClaim {
    readonly claimId: string;
    readonly claimText: string;
    readonly agentId: string;
    readonly agentName: string;
    readonly round: number;
}

export interface IBurdenOfProofService {
    /** Return opponent claims that lack evidence markers. */
    getUnsupportedClaims(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): UnsupportedClaim[];

    /** Whether a single text is supported (has citations, numbers, sources). */
    isSupported(text: string): boolean;
}
