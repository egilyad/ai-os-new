// ── Entanglement Constraint Types ─────────────────────────────────────
// P0.1 Cross-examination / Argument Entanglement Protocol
// Forces agents to directly engage with specific opponent claims.

export type EntanglementResponseType = 'rebut' | 'support' | 'refine';

export interface EntanglementConstraint {
    readonly mustQuoteOpponent: boolean;
    readonly targetClaimId: string;
    readonly targetClaimText: string;
    readonly opponentId: string;
    readonly opponentName: string;
    readonly responseType: EntanglementResponseType;
    readonly contextPhrase?: string;
}

export interface ResponseValidationResult {
    readonly engaged: boolean;
    readonly reason?: string;
    readonly similarityToTarget?: number;
}

export interface IEntanglementEngine {
    getConstraint(
        agentId: string,
        agentName: string,
        allArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
    ): EntanglementConstraint | null;

    validateEntanglement(
        response: string,
        constraint: EntanglementConstraint,
    ): ResponseValidationResult;
}

// ── Agreement Anchoring (P0.5) ────────────────────────────────────────

export interface AnchorClaim {
    readonly claimId: string;
    readonly agentName: string;
    readonly text: string;
    readonly roundResolved: number;
    readonly confidence: number;
}

export interface IAnchoringService {
    extractAnchors(
        allArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
        minRoundsForAnchor: number,
    ): AnchorClaim[];

    buildDeltaPrompt(anchors: AnchorClaim[], language?: string): string;
}
