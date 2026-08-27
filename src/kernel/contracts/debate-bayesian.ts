// ── Bayesian Belief Updating for Judges (P1.6) ─────────────────────────
// Applies Bayesian update to argument scores — each argument shifts the
// posterior belief about an agent's position strength. Starts with 50/50
// prior. Final score is the posterior probability.

export interface BayesianBelief {
    agentId: string;
    prior: number; // always 0.5
    posterior: number; // after all updates
    updates: number; // count of arguments evaluated
}

export interface IBayesianJudge {
    /** Reset beliefs for a new session */
    reset(agentIds: string[]): void;

    /** Update belief based on a scored argument */
    update(agentId: string, argumentStrength: number): void;

    /** Get posterior belief for an agent */
    getPosterior(agentId: string): number;

    /** Adjust a raw AgentScore using Bayesian posterior */
    getAdjustedScore(agentId: string, rawScore: number): number;

    /** Return all beliefs for logging */
    getAllBeliefs(): BayesianBelief[];
}
