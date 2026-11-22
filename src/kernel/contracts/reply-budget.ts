export interface ReplyBudgetState {
    maxTokens: number;
    usedTokens: number;
    warned: boolean;
    exhausted: boolean;
}

/** Per-reply token budget with graceful wrap-up guidance (AgentScope E3). */
export interface IReplyBudgetService {
    start(maxTokens: number): ReplyBudgetState;
    consume(state: ReplyBudgetState, tokens: number): ReplyBudgetState;
    /** Guidance to inject into the prompt when the budget is nearly gone. */
    guidance(state: ReplyBudgetState): string | null;
}
