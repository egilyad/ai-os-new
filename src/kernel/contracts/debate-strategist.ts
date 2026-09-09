// ── Strategist — Adaptive Strategic Planning (P2.3) ───────────────
// Analyzes debate state and issues per-agent strategic directives.

export type StrategicDirective =
    'attack' | 'defend' | 'synthesize' | 'clarify' | 'pivot' | 'consolidate';

export interface StrategistPlan {
    directive: StrategicDirective;
    targetAgentId?: string;
    reasoning: string;
    instruction: string;
}

export interface IStrategist {
    plan(
        agentId: string,
        agentRole: string,
        round: number,
        history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
        language: string,
    ): StrategistPlan | undefined;
}
