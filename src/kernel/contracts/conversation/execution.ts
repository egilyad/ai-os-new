import type { TurnProposal } from './turn';
import type { ConversationContext } from './context';

export interface TurnResult {
    success: boolean;
    content?: string;
    error?: string;
    tokens?: number;
    /** Debate-specific: agent skipped due to budget — mirrored from AgentExecutionResult.budgetSkipped. */
    budgetSkipped?: boolean;
}

export interface IExecutionEngine {
    execute(
        proposal: TurnProposal,
        context: ConversationContext,
        sessionSignal: AbortSignal,
    ): Promise<TurnResult>;
}
