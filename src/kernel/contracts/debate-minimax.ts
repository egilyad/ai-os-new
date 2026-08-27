// ── Argumentation Graph Minimax (P0.7) ──────────────────────────────
// Strategic move planning: simulates 2-ply minimax on the argument
// graph to recommend the highest-value attack/defense action.

export type MinimaxActionType =
    | 'attack_high_centrality'
    | 'attack_low_support'
    | 'defend_own_weak'
    | 'support_own_strong'
    | 'refine_own_claim'
    | 'challenge_unattacked';

export interface MinimaxMove {
    readonly type: MinimaxActionType;
    readonly targetNodeId: string;
    readonly targetClaim: string;
    readonly score: number;
    readonly rationale: string;
    readonly expectedDamage: number;
}

export interface IMinimaxPlanner {
    /**
     * Compute the best strategic move for the given agent using 2-ply
     * minimax on the argument graph. Returns null when there are too few
     * arguments (< 3) or the graph is not initialized.
     */
    plan(agentId: string, agentName: string, currentRound: number): MinimaxMove | null;
}
