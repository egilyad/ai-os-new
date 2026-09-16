// ── Semantic Concept Blending (P1.29) ───────────────────────────────────
// When deadlocked, invents new frameworks combining opposing concepts.

export interface DeadlockSignal {
    readonly present: boolean;
    readonly intensity: number;
    readonly stalemateRounds: number;
    readonly clashingConcepts: [string, string];
}

export interface BlendedConcept {
    readonly name: string;
    readonly parentA: string;
    readonly parentB: string;
    readonly synthesis: string;
    readonly novelInsight: string;
    readonly resolutionPath: string;
}

export interface BlendResult {
    readonly deadlock: DeadlockSignal;
    readonly blends: BlendedConcept[];
    readonly bestBlendText: string;
}

export interface IConceptBlender {
    detectDeadlock(
        agentId: string,
        agentName: string,
        previousArguments: ReadonlyArray<{ agentId: string; content: string; round: number }>,
        currentRound: number,
    ): DeadlockSignal | null;

    generateBlend(deadlock: DeadlockSignal, topic: string, language?: string): BlendResult;
}
