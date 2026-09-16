// ── Tactical Role-Switching Meta-Agent (P0.8) ──────────────────────────
// Per-round role assignment and tactical instruction for each agent.
// Heuristic-only: uses argument graph stats + round context to decide
// what tactical posture the agent should adopt.

export type TacticalRole =
    'standard' | 'devils_advocate' | 'synthesizer' | 'evidence_harvester' | 'rhetoric_optimizer';

export interface TacticalDirective {
    readonly agentId: string;
    readonly role: TacticalRole;
    /** Human-readable tactical instruction (injected into prompt). */
    readonly instruction: string;
    /** One-line emphasis area for the prompt builder header. */
    readonly emphasis: string;
}

export interface IMetaAgentController {
    /**
     * Compute a tactical directive for the given agent based on round
     * context and argument graph stats. Returns null in round 1 or
     * when there is insufficient data (< 3 arguments total).
     */
    getDirective(
        agentId: string,
        agentName: string,
        previousArguments: ReadonlyArray<{
            id: string;
            agentId: string;
            content: string;
            round: number;
        }>,
        currentRound: number,
    ): TacticalDirective | null;
}
