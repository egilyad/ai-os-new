import type { TopologyNode } from '../../contracts/debate-runtime';

export interface DebatePolicyState {
    bidScores: Map<string, number>;
    participationCount: Map<string, number>;
    lastInteraction: Map<string, string>;
    lastArgRole?: string;
    roundIndex: number;
    nodeIndex: number;
    orderedRound: {
        topologyRef: unknown;
        roundIndex: number;
        nodes: TopologyNode[];
    } | null;
}
