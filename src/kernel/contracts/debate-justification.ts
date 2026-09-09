// ── Multi-Hop Justification Enforcer (P1.23) ─────────────────────────────
// Validates that arguments contain multi-hop reasoning chains
// (claim → warrant → evidence) rather than single unsupported claims.
// Injects minimum-hop requirements into prompts.

export type JustificationHop = 'claim' | 'warrant' | 'evidence' | 'backing';

export interface JustificationChain {
    agentId: string;
    round: number;
    hopCount: number;
    hops: Array<{
        type: JustificationHop;
        text: string;
    }>;
    isValid: boolean; // true if hopCount >= minHops
    missingTypes: JustificationHop[]; // which hop types are missing
}

export interface IJustificationEnforcer {
    analyzeArgument(
        agentId: string,
        round: number,
        content: string,
        minHops?: number,
    ): JustificationChain;

    getChain(agentId: string, round: number): JustificationChain | undefined;

    clearSession(): void;
}
