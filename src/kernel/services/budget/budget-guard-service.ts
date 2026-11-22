/**
 * Hard budget guard (MetaGPT invest-budget style).
 *
 * Unlike soft budget penalties in the router, this guard can BLOCK further
 * work: every node/LLM call reserves its estimated cost up front, and once a
 * limit is crossed all subsequent reservations are refused.
 */
import type { IBudgetGuardService, BudgetGuardState } from '../../contracts/budget-guard';

export class BudgetGuardService implements IBudgetGuardService {
    private spentUsd = 0;
    private spentTokens = 0;
    private maxUsd = Number.POSITIVE_INFINITY;
    private maxTokens = Number.POSITIVE_INFINITY;

    async init(): Promise<void> {}

    async destroy(): Promise<void> {
        this.reset();
    }

    configure(limits: { maxUsd?: number; maxTokens?: number }): void {
        if (limits.maxUsd !== undefined && limits.maxUsd >= 0) this.maxUsd = limits.maxUsd;
        if (limits.maxTokens !== undefined && limits.maxTokens >= 0)
            this.maxTokens = limits.maxTokens;
    }

    reserve(estimate: { usd?: number; tokens?: number }): boolean {
        const usd = Math.max(0, estimate.usd ?? 0);
        const tokens = Math.max(0, estimate.tokens ?? 0);
        if (this.spentUsd + usd > this.maxUsd) return false;
        if (this.spentTokens + tokens > this.maxTokens) return false;
        this.spentUsd += usd;
        this.spentTokens += tokens;
        return true;
    }

    state(): BudgetGuardState {
        return {
            spentUsd: this.spentUsd,
            spentTokens: this.spentTokens,
            limitUsd: this.maxUsd,
            limitTokens: this.maxTokens,
            exceeded: this.spentUsd >= this.maxUsd || this.spentTokens >= this.maxTokens,
        };
    }

    reset(): void {
        this.spentUsd = 0;
        this.spentTokens = 0;
    }
}
