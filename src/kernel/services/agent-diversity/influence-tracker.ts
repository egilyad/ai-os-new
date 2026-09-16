import type { Claim, ClaimEdge } from '../debate-runtime/debate-governor/types';

export function computeInfluenceScores(
    claimsByAgent: Map<string, Claim[]>,
    edges: ClaimEdge[],
    resolvedClaimIds: Set<string>,
): Map<string, number> {
    const result = new Map<string, number>();
    const agents = [...claimsByAgent.keys()];

    for (const agentId of agents) {
        const agentClaimIds = new Set((claimsByAgent.get(agentId) ?? []).map((c) => c.id));

        const uniqueEdgesFromAgent = edges.filter((e) => agentClaimIds.has(e.from));

        const agentTriggeredContradictions = edges.filter(
            (e) => agentClaimIds.has(e.from) && e.type === 'challenges',
        );

        const adoptedIndirectly = edges.filter(
            (e) => agentClaimIds.has(e.from) && e.type === 'refines' && resolvedClaimIds.has(e.to),
        );

        const totalEdges = edges.length || 1;
        const edgeScore = uniqueEdgesFromAgent.length / totalEdges;

        const contradictionScore = Math.min(
            1,
            agentTriggeredContradictions.length / (agents.length || 1),
        );

        const adoptionScore = Math.min(1, adoptedIndirectly.length / (agentClaimIds.size || 1));

        const score = 0.5 * edgeScore + 0.3 * contradictionScore + 0.2 * adoptionScore;
        result.set(agentId, Math.min(1, score));
    }

    return result;
}

export function computeRedundancyScores(
    similarities: Map<string, Map<string, number>>,
): Map<string, number> {
    const result = new Map<string, number>();

    for (const [agentId, sims] of similarities) {
        const values = [...sims.values()];
        if (values.length === 0) {
            result.set(agentId, 0);
            continue;
        }
        const avgSim = values.reduce((a, b) => a + b, 0) / values.length;
        result.set(agentId, avgSim);
    }

    return result;
}
