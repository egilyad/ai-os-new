// ── Burden of Proof Tracker (P0.10) ───────────────────────────────────
// Tracks which claims have assigned burden of proof, whether the burden
// has been met (evidence provided), shifted, or remains unmet.
// Consensus Engine penalizes unmet burdens.

export type BoPStatus = 'assigned' | 'met' | 'unmet';

export interface BurdenEntry {
    readonly claimId: string;
    readonly agentId: string;
    readonly agentName: string;
    readonly claimText: string;
    readonly round: number;
    readonly status: BoPStatus;
}

export interface UnmetBurden {
    readonly claimId: string;
    readonly agentName: string;
    readonly claimText: string;
    readonly round: number;
}

export interface IBoPTrackerService {
    /** Record a new claim — automatically assigns burden to its author. */
    recordClaim(
        claimId: string,
        agentId: string,
        agentName: string,
        claimText: string,
        round: number,
    ): void;

    /** Mark a burden as met (evidence provided). */
    meetBurden(claimId: string): void;

    /** Get all burdens that are still unmet for a specific agent. */
    getUnmetForAgent(agentId: string): UnmetBurden[];

    /** Get the proportion of met burdens for an agent (0-1). */
    getMetRatio(agentId: string): number;

    /** Clear state for a new session. */
    reset(): void;
}
