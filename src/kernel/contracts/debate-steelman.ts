// ── Steelmanning Protocol (P0.9) ──────────────────────────────────────
// Before rebutting, the agent must restate the opponent's position in
// its strongest possible form + request confirmation. Prevents strawman
// attacks and forces genuine engagement with opposing arguments.

export interface SteelmanTarget {
    readonly opponentId: string;
    readonly opponentName: string;
    readonly claimText: string;
    readonly claimId: string;
    readonly round: number;
}

export interface ISteelmanService {
    /** Pick the opponent's claim most worth steelmanning for this agent.
     *  Returns null if no suitable target exists (e.g. first round, or
     *  only the agent's own arguments exist). */
    selectTarget(
        agentId: string,
        previousArguments: Array<{
            id: string;
            agentId: string;
            agentName: string;
            content: string;
            round: number;
        }>,
    ): SteelmanTarget | null;
}
