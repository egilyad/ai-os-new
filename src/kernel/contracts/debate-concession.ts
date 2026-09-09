// ── Strategic Concession (P1) ────────────────────────────────────
// Concede minor points to gain credibility on major ones.

export interface ConcessionOpportunity {
    readonly claimId: string;
    readonly claimText: string;
    readonly opponentId: string;
    readonly benefit: number;
}

export interface IConcessionService {
    findOpportunities(
        agentId: string,
        previousArguments: Array<{ id: string; agentId: string; content: string; round: number }>,
    ): ConcessionOpportunity[];
}
