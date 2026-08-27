// ── Counterfactual Analysis (P1) ─────────────────────────────────
// Explore "what if" scenarios to test opponent logic.

export interface CounterfactualScenario {
    readonly assumption: string;
    readonly alteredWorld: string;
    readonly implication: string;
}

export interface ICounterfactualService {
    generate(topic: string, opponentClaim: string): CounterfactualScenario | null;
}
