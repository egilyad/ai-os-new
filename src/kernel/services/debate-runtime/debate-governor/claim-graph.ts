import type { Claim, ClaimEdge, ClaimGraph } from './types';
import { jaccardSimilarity } from '../../../contracts/debate-types';

export function createClaimGraph(): ClaimGraph {
    return { claims: {}, edges: [] };
}

export function addClaimsToGraph(graph: ClaimGraph, claims: Claim[]): void {
    for (const c of claims) {
        if (!graph.claims[c.id]) {
            graph.claims[c.id] = c;
        }
    }
}

export function addEdge(
    graph: ClaimGraph,
    from: string,
    to: string,
    type: 'supports' | 'challenges' | 'refines',
    weight: number,
): void {
    if (from === to) return;
    const exists = graph.edges.some((e) => e.from === from && e.to === to && e.type === type);
    if (exists) return;
    graph.edges.push({ from, to, type, weight, createdAt: Date.now() });
}

export function detectChallenges(graph: ClaimGraph): ClaimEdge[] {
    const edges: ClaimEdge[] = [];
    const claimList = Object.values(graph.claims);
    for (let i = 0; i < claimList.length; i++) {
        for (let j = i + 1; j < claimList.length; j++) {
            const a = claimList[i]!;
            const b = claimList[j]!;
            if (a.speaker === b.speaker) continue;
            if (a.round === b.round && a.speaker === b.speaker) continue;
            const overlap = jaccardSimilarity(a.text, b.text);
            if (overlap > 0.15 && overlap < 0.6) {
                edges.push({
                    from: a.id,
                    to: b.id,
                    type: 'challenges',
                    weight: overlap,
                    createdAt: Date.now(),
                });
            }
        }
    }
    return edges;
}

export function getUnresolvedClaims(graph: ClaimGraph): Claim[] {
    return Object.values(graph.claims).filter(
        (c) => c.status === 'active' || c.status === 'disputed',
    );
}

export function getClaimsBySpeaker(graph: ClaimGraph, speaker: string): Claim[] {
    return Object.values(graph.claims).filter((c) => c.speaker === speaker);
}
