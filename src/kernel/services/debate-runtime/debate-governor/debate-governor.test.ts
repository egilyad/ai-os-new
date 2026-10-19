import { describe, it, expect } from 'vitest';
import { DebateGovernor } from './debate-governor';

function feedRepetitive(g: DebateGovernor, rounds: number[]): void {
    for (const r of rounds) {
        g.ingestArgument('identical repetitive claim text here', `a${r}`, 's1', 'pro', r);
        g.computeNovelty();
    }
}

describe('DebateGovernor soft-stop floor (long debates)', () => {    it('holds soft stops until the second half of requested maxRounds', () => {
        const g = new DebateGovernor();
        g.setMaxRounds(10);
        feedRepetitive(g, [1, 2, 3]);
        // The soft condition itself fires (stale repetition)...
        expect(g.hasNoNovelClaims()).toBe(true);
        // ...but the floor (max(2, 10/2) = 5) keeps a requested long debate alive.
        expect(g.shouldStop()).toBe(false);
    });

    it('keeps the old floor of 2 when maxRounds is unset (default debates)', () => {
        const g = new DebateGovernor();
        feedRepetitive(g, [1, 2, 3]);
        expect(g.shouldStop()).toBe(true);
    });

    it('still hard-stops at maxRounds', () => {
        const g = new DebateGovernor();
        g.setMaxRounds(3);
        feedRepetitive(g, [1, 2, 3]);
        expect(g.shouldStop()).toBe(true);
    });
});

describe('DebateGovernor claim-graph wiring', () => {
    it('populates temporal challenge edges across speakers', () => {
        const g = new DebateGovernor();
        g.ingestArgument('policy improves economic growth today', 'a1', 's1', 'pro', 1);
        g.ingestArgument('policy harms economic growth tomorrow', 'a2', 's2', 'con', 2);
        const edges = g.getState().graph.edges;
        expect(edges.length).toBeGreaterThan(0);
        expect(edges[0]!.type).toBe('challenges');
        expect(edges[0]!.validFrom).toBeGreaterThan(0);
        expect(edges[0]!.observedAt).toBeGreaterThan(0);
        expect(edges[0]!.validTo).toBeNull();
    });

    it('rehydrates the same claim graph from persisted arguments', () => {
        const live = new DebateGovernor();
        live.ingestArgument('policy improves economic growth today', 'a1', 's1', 'pro', 1);
        live.ingestArgument('policy harms economic growth tomorrow', 'a2', 's2', 'con', 2);

        const restored = new DebateGovernor();
        restored.rehydrate([
            {
                id: 'a1',
                agentId: 'x1',
                agentName: 's1',
                content: 'policy improves economic growth today',
                confidence: 0.8,
                timestamp: 1,
                round: 1,
                position: 'pro',
                source: 'llm',
            },
            {
                id: 'a2',
                agentId: 'x2',
                agentName: 's2',
                content: 'policy harms economic growth tomorrow',
                confidence: 0.8,
                timestamp: 2,
                round: 2,
                position: 'con',
                source: 'llm',
            },
        ]);

        expect(restored.getState().graph.edges).toHaveLength(live.getState().graph.edges.length);
        expect(restored.getState().graph.edges[0]!.type).toBe('challenges');
        expect(Object.keys(restored.getState().graph.claims).sort()).toEqual(
            Object.keys(live.getState().graph.claims).sort(),
        );
    });

    it('skips arguments already flagged as duplicates when rehydrating', () => {
        const g = new DebateGovernor();
        g.rehydrate([
            {
                id: 'a1',
                agentId: 'x1',
                agentName: 's1',
                content: 'policy improves economic growth today',
                confidence: 0.8,
                timestamp: 1,
                round: 1,
                position: 'pro',
                source: 'llm',
                duplicateOf: 'a0',
            },
        ]);
        expect(Object.keys(g.getState().graph.claims)).toHaveLength(0);
    });
});
