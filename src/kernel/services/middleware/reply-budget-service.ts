/**
 * Reply budget control (AgentScope-inspired, E3).
 *
 * Tracks tokens used within a single reply. At 80% it produces a graceful
 * wrap-up hint; at 100% it tells the model to stop and summarize. Pure state
 * functions — can be called from a middleware 'beforeCall'/'afterReply' hook.
 */
import type { IReplyBudgetService, ReplyBudgetState } from '../../contracts/reply-budget';

export class ReplyBudgetService implements IReplyBudgetService {
    start(maxTokens: number): ReplyBudgetState {
        return {
            maxTokens: Math.max(1, maxTokens),
            usedTokens: 0,
            warned: false,
            exhausted: false,
        };
    }

    consume(state: ReplyBudgetState, tokens: number): ReplyBudgetState {
        const used = state.usedTokens + Math.max(0, tokens);
        return {
            ...state,
            usedTokens: used,
            warned: state.warned || used / state.maxTokens >= 0.8,
            exhausted: used >= state.maxTokens,
        };
    }

    guidance(state: ReplyBudgetState): string | null {
        if (state.exhausted)
            return 'Token budget exhausted — stop generating and summarize what is done.';
        if (state.warned) return 'Approaching token budget — wrap up the current point concisely.';
        return null;
    }
}
