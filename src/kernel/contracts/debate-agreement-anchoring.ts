// ── Agreement Anchoring (P0) ───────────────────────────────────────
// Start from shared premises, then reveal logical inconsistencies.
// Finds common ground between participants and builds an anchor point.

export interface SharedPremise {
    readonly text: string;
    readonly participantIds: string[];
    readonly confidence: number; // 0-1
}

export interface IAgreementAnchoringService {
    /** Find premises shared across multiple participants. */
    findSharedPremises(
        previousArguments: Array<{
            id: string;
            agentId: string;
            content: string;
            round: number;
        }>,
    ): SharedPremise[];
}
