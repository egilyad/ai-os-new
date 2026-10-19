/**
 * ClaimGraph tests — temporal validity on claim edges.
 */
import { describe, it, expect } from 'vitest';
import { createClaimGraph, addEdge, detectChallenges, claimEdgesAsOf } from './claim-graph';
import type { Claim } from './types';

function claim(id: string, text: string, speaker: string, round = 1): Claim {
    return {
        id,
        text,
        agentId: `agent-${speaker}`,
        round,
        confidence: 0.8,
        speaker,
        role: 'pro',
    };
}

describe('ClaimGraph temporal edges', () => {
    it('stamps validFrom/observedAt and dedupes while valid', () => {
        const g = createClaimGraph();
        addEdge(g, 'a', 'b', 'supports', 0.7);
        expect(g.edges).toHaveLength(1);
        expect(g.edges[0]!.validFrom).toBeGreaterThan(0);
        expect(g.edges[0]!.observedAt).toBeGreaterThan(0);
        expect(g.edges[0]!.validTo).toBeNull();

        addEdge(g, 'a', 'b', 'supports', 0.9);
        expect(g.edges).toHaveLength(1);
    });

    it('allows a new edge after the previous window expired', () => {
        const g = createClaimGraph();
        addEdge(g, 'a', 'b', 'challenges', 0.5);
        g.edges[0]!.validTo = Date.now() - 1;
        addEdge(g, 'a', 'b', 'challenges', 0.6);
        expect(g.edges).toHaveLength(2);
    });

    it('filters edges by asOf', () => {
        const g = createClaimGraph();
        addEdge(g, 'a', 'b', 'supports', 0.7, { validFrom: 1000, validTo: 2000 });
        expect(claimEdgesAsOf(g, 1500)).toHaveLength(1);
        expect(claimEdgesAsOf(g, 500)).toHaveLength(0);
        expect(claimEdgesAsOf(g, 2500)).toHaveLength(0);
    });

    it('detectChallenges emits temporally-stamped edges', () => {
        const g = createClaimGraph();
        g.claims['a'] = claim('a', 'policy improves economic growth today', 's1');
        g.claims['b'] = claim('b', 'policy harms economic growth tomorrow', 's2');
        const edges = detectChallenges(g);
        expect(edges).toHaveLength(1);
        expect(edges[0]!.type).toBe('challenges');
        expect(edges[0]!.validFrom).toBeGreaterThan(0);
        expect(edges[0]!.validTo).toBeNull();
        g.edges.push(...edges);
        expect(claimEdgesAsOf(g)).toHaveLength(1);
    });

    it('stamps challenge edges with the newest claim timestamp', () => {
        const g = createClaimGraph();
        g.claims['a'] = {
            ...claim('a', 'policy improves economic growth today', 's1'),
            createdAt: 1000,
        };
        g.claims['b'] = {
            ...claim('b', 'policy harms economic growth tomorrow', 's2'),
            createdAt: 2000,
        };
        const edges = detectChallenges(g);
        expect(edges[0]!.validFrom).toBe(2000);
        expect(edges[0]!.observedAt).toBe(2000);
    });
});
