// ── Dialectical Stance Drift Detection (P1.8) ──────────────────────
// Tracks per-agent stance vectors across debate rounds and classifies
// position shifts as legitimate_evolution, goalpost_shift, or strategic_pivot.

export type DriftType = 'legitimate_evolution' | 'goalpost_shift' | 'strategic_pivot';

export interface StanceVector {
    prescription: number; // concrete solution vs abstract problem (0-1)
    certainty: number; // absolute vs hedged (0-1)
    urgency: number; // urgent framing vs measured (0-1)
    scope: number; // systemic vs individual (0-1)
    activism: number; // call-to-action vs passive analysis (0-1)
}

export interface DriftEvent {
    agentId: string;
    agentName: string;
    round: number;
    fromRound: number;
    driftType: DriftType;
    cosineSimilarity: number;
    before: StanceVector;
    after: StanceVector;
    classifiedBy: string;
}

export interface IStanceDriftTracker {
    reset(agentIds: string[], topic: string): void;

    /** Register an agent's argument text for stance extraction */
    registerArgument(agentId: string, agentName: string, round: number, content: string): void;

    /** Get drift events for a specific agent since a given round */
    getDriftEvents(agentId: string, sinceRound: number): DriftEvent[];

    /** Get all drift events across all agents */
    getAllDriftEvents(): DriftEvent[];

    /** Get score penalty multiplier (1.0 = no penalty) for an agent */
    getDriftPenalty(agentId: string): number;

    /** Get goalpost_shift call-out text for opponent prompt injection */
    getDriftCalloutText(opponentAgentId: string, language: string): string | undefined;

    /** Get a summary block about stance drift for the evaluator */
    getDriftSummary(language: string): string | undefined;
}
