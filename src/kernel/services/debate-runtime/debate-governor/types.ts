import type { Claim } from '../../../contracts/debate-runtime';
export type { Claim } from '../../../contracts/debate-runtime';

export interface ClaimEdge {
    from: string;
    to: string;
    type: 'supports' | 'challenges' | 'refines';
    weight: number;
    createdAt: number;
}

export interface Contradiction {
    id: string;
    claimA: string;
    claimB: string;
    severity: number;
    status: 'open' | 'partially_resolved' | 'resolved';
    lastCheckedAt: number;
}

export interface ClaimGraph {
    claims: Record<string, Claim>;
    edges: ClaimEdge[];
}

export interface GovernorState {
    round: number;
    graph: ClaimGraph;
    contradictions: Contradiction[];
    resolvedClaimIds: Set<string>;
    noveltyScoreHistory: number[];
    convergenceScore: number;
    phase: 'active' | 'synthesis' | 'stopped';
    lastUpdatedAt: number;
}

export interface SynthesisResult {
    consensus: string;
    coreDisagreement: string;
    resolvedPoints: string[];
    unresolvedPoints: string[];
    phase: 'consensus' | 'irreconcilable';
}
