import type { Claim, ClaimEdge, ClaimGraph } from './types';
import { jaccardSimilarity } from '../../../contracts/debate-types';
import { isEdgeValidAt, type TemporalEdgeFields } from '../../../types/temporal-edge';

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
    opts: TemporalEdgeFields = {},
): void {
    if (from === to) return;
    const t = Date.now();
    const asOf = opts.observedAt ?? t;
    // Dedupe only against currently-valid edges: a re-observed relation after
    // its previous window expired is allowed to open a new edge.
    const exists = graph.edges.some(
        (e) =>
            e.from === from &&
            e.to === to &&
            e.type === type &&
            isEdgeValidAt(e, asOf),
    );
    if (exists) return;
    graph.edges.push({
        from,
        to,
        type,
        weight,
        createdAt: t,
        validFrom: opts.validFrom ?? t,
        validTo: opts.validTo ?? null,
        observedAt: opts.observedAt ?? t,
    });
}

/** Edges that were valid at `asOf` (default: now). */
export function claimEdgesAsOf(graph: ClaimGraph, asOf: number = Date.now()): ClaimEdge[] {
    return graph.edges.filter((e) => isEdgeValidAt(e, asOf));
}

export function detectChallenges(graph: ClaimGraph): ClaimEdge[] {
    const edges: ClaimEdge[] = [];
    const t = Date.now();
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
                    createdAt: t,
                    validFrom: t,
                    validTo: null,
                    observedAt: t,
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
