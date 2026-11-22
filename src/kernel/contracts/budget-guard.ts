import type { ILifecycle } from './lifecycle';

export interface BudgetGuardState {
    spentUsd: number;
    spentTokens: number;
    limitUsd: number;
    limitTokens: number;
    exceeded: boolean;
}

/** Hard budget cap that refuses further work when a limit is crossed. */
export interface IBudgetGuardService extends ILifecycle {
    configure(limits: { maxUsd?: number; maxTokens?: number }): void;
    /** Reserve an estimated spend; returns false when the cap is exceeded. */
    reserve(estimate: { usd?: number; tokens?: number }): boolean;
    state(): BudgetGuardState;
    reset(): void;
}
