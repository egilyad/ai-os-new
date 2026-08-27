export interface AgentBelief {
    agentId: string;
    agentName: string;
    topic: string;
    stance: 'pro' | 'con' | 'neutral' | 'mixed';
    confidence: number;
    keyClaims: string[];
    lastUpdatedRound: number;
}

export type RToMStance = 'pro' | 'con' | 'neutral' | 'mixed' | 'unknown';

export interface TheoryOfMindEdge {
    fromAgentId: string;
    toAgentId: string;
    /** What 'from' believes about what 'to' believes */
    inferredStance: RToMStance;
    confidence: number;
    basedOnRounds: number[];
}

export interface RToMGraph {
    beliefs: Map<string, AgentBelief>;
    edges: TheoryOfMindEdge[];
}

export interface IRToMGraphService {
    ingestArgument(
        agentId: string,
        agentName: string,
        content: string,
        round: number,
        role: string,
    ): void;
    getToMContext(
        agentId: string,
        agentName: string,
        round: number,
        language: string,
    ): string | undefined;
    getBeliefSummary(round: number): string;
    reset(): void;
}
