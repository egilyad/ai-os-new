// ── Bayesian Belief Updating for Judges (P1.6) ─────────────────────────
// Each argument is treated as evidence with likelihood ratio based on
// argument strength. Prior = 0.5 (maximum uncertainty).
// Posterior = likelihood * prior / (likelihood * prior + (1-likelihood) * (1-prior))

import type { IBayesianJudge, BayesianBelief } from '../../contracts/debate-bayesian';

/** Logistic function maps argument strength (-1..1) to likelihood ratio 0..1 */
function strengthToLikelihood(strength: number): number {
    const clamped = Math.max(-1, Math.min(1, strength));
    const x = clamped * 2.5; // scaling factor for sensitivity
    return 1 / (1 + Math.exp(-x));
}

export class BayesianJudge implements IBayesianJudge {
    private beliefs = new Map<string, { posterior: number; updates: number }>();

    reset(agentIds: string[]): void {
        this.beliefs.clear();
        for (const id of agentIds) {
            this.beliefs.set(id, { posterior: 0.5, updates: 0 });
        }
    }

    update(agentId: string, argumentStrength: number): void {
        const current = this.beliefs.get(agentId);
        if (!current) {
            this.beliefs.set(agentId, { posterior: 0.5, updates: 0 });
        }
        const state = this.beliefs.get(agentId)!;

        // Map argumentStrength (-1..1) to likelihood (0..1)
        const likelihood = strengthToLikelihood(argumentStrength);
        const prior = state.posterior;

        // Bayesian update: P(H|E) = P(E|H)*P(H) / [P(E|H)*P(H) + P(E|¬H)*P(¬H)]
        // P(E|¬H) = 1 - P(E|H) — symmetric likelihood
        const numerator = likelihood * prior;
        const denominator = numerator + (1 - likelihood) * (1 - prior);
        const posterior = denominator > 0 ? numerator / denominator : 0.5;

        state.posterior = posterior;
        state.updates++;
    }

    getPosterior(agentId: string): number {
        return this.beliefs.get(agentId)?.posterior ?? 0.5;
    }

    getAdjustedScore(agentId: string, rawScore: number): number {
        const posterior = this.getPosterior(agentId);
        // Blend raw evaluator score with Bayesian posterior
        // Posterior dominates as arguments accumulate
        const state = this.beliefs.get(agentId);
        const updateCount = state?.updates ?? 0;
        const bayesianWeight = Math.min(0.5, updateCount * 0.1); // max 50% weight
        return rawScore * (1 - bayesianWeight) + posterior * bayesianWeight;
    }

    getAllBeliefs(): BayesianBelief[] {
        const result: BayesianBelief[] = [];
        for (const [agentId, state] of this.beliefs) {
            result.push({
                agentId,
                prior: 0.5,
                posterior: state.posterior,
                updates: state.updates,
            });
        }
        return result;
    }
}
