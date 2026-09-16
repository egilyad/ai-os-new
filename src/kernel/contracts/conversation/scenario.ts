import type { TurnProposal } from './turn';

/**
 * Persisted, admin-authored conversation scenario for the generic
 * Conversation Director.
 *
 * This is the data model for a deterministic, ordered sequence of turns
 * driven by `HybridPolicy` through `ConversationOrchestrator` and a generic
 * `IExecutionEngine` (ChatExecutor). It is intentionally generic — it knows
 * nothing about Debate, Forum, rounds, bids or consensus.
 *
 * `TurnProposal` / `Turn` definitions are NOT duplicated here; the turn
 * sequence reuses `TurnProposal` directly.
 */
export type ScenarioStatus = 'draft' | 'active' | 'archived';

export interface ConversationScenario {
    id: string;
    name: string;
    description: string;
    /** Optional conversation topic; fed into the runtime `ConversationContext`. */
    topic?: string;
    version: number;
    status: ScenarioStatus;
    /** Participant roster for the runtime `ConversationContext`. */
    participants: Array<{ id: string; role: string }>;
    /** Ordered turn sequence — the director's script. */
    turns: TurnProposal[];
    createdAt: number;
    updatedAt: number;
}
