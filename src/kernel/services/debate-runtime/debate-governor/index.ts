export { DebateGovernor } from './debate-governor';
export { extractClaims } from './claim-extractor';
export {
    createClaimGraph,
    addClaimsToGraph,
    addEdge,
    getUnresolvedClaims,
    getClaimsBySpeaker,
    detectChallenges,
} from './claim-graph';
export {
    detectContradictions,
    resolveContradiction,
    hasOpenContradictions,
} from './contradiction-detector';
export type { ClaimEdge, Contradiction, ClaimGraph, GovernorState, SynthesisResult } from './types';
