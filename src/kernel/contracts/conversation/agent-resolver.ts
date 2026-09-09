/**
 * Agent resolution seam for the generic Conversation Director.
 *
 * The Director's runtime (`ChatExecutionEngine`) needs to turn a
 * `TurnProposal.participantId` into a *real* agent — its persona / system
 * prompt and (optionally) pinned model — so the turn is actually spoken by
 * that agent rather than just stamped into `metadata.agentId`.
 *
 * `AgentService` implements this contract by reading the active topology node
 * for the participant. UI participants are selected from the same source, so
 * the `id` authored in the scenario always resolves to a concrete agent.
 */
export interface ResolvedAgentAvatar {
    emoji?: string;
    color?: string;
    /** Optional persistent image URL (overrides the deterministic emoji). */
    url?: string;
}

export interface ResolvedAgent {
    id: string;
    /** Node label — the agent's display name. */
    name: string;
    /**
     * Base role / profession of the agent (topology `roleName`). This is the
     * agent's *identity* role, distinct from the per-conversation / per-debate
     * role authored in a scenario participant.
     */
    role: string;
    /** Persona / system prompt that should drive the agent's response. */
    systemPrompt?: string;
    /**
     * Preferred model pinned on the agent node. Empty / `auto` / `default`
     * means "let the runtime route" — the engine leaves the request model
     * untouched in that case.
     */
    model?: string;

    // --- Identity enrichment (all optional for backward compatibility) ---
    /** Explicit display name; falls back to `name` when absent. */
    displayName?: string;
    firstName?: string;
    lastName?: string;
    /** Explicit base profession; falls back to `role` when absent. */
    baseRole?: string;
    specializations?: string[];
    lensIds?: string[];
    /** Provider slug (topology `config.provider`). */
    provider?: string;
    /** Optional persistent avatar override. */
    avatar?: ResolvedAgentAvatar;
}

export interface IAgentResolver {
    /** Resolve a participantId to a real agent, or null if unknown. */
    resolveAgent(id: string): ResolvedAgent | null;
}
