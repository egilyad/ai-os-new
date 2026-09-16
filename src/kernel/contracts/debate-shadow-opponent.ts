// ── Shadow Opponent Simulation (P0.2) ──────────────────────────────────
// Self-critique loop: agent critiques its own draft response as the
// strongest opponent would, then rewrites it stronger.
// Reduces confirmation bias, adds preemptive rebuttals.

export interface ShadowCritique {
    readonly originalContent: string;
    readonly strengthenedContent: string;
    readonly critique: string;
    readonly latencyMs: number;
}

export interface IShadowOpponentService {
    /**
     * Run shadow opponent critique on a draft response.
     * Sends the draft back to the same LLM with a critique prompt,
     * then has the LLM rewrite it stronger.
     *
     * Returns null when:
     * - debate is cancelled (signal aborted)
     * - LLM call fails
     * - content is too short (< 50 chars)
     */
    strengthenArgument(
        draftContent: string,
        systemPrompt: string,
        _agentId: string,
        agentName: string,
        adapter: {
            sendMessage(
                messages: Array<{ role: string; content: string }>,
                model: string,
                key: string,
                signal: AbortSignal,
            ): Promise<{ content: string }>;
        },
        modelId: string,
        apiKey: string,
        signal: AbortSignal,
        language?: string,
    ): Promise<ShadowCritique | null>;
}
