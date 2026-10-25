import { describe, expect, it } from 'vitest';
import { buildTopologyForStrategy } from './debate-session-bridge';
import type { DebateParticipant } from '../../contracts/debate-types';

const baseline: DebateParticipant[] = [
    { id: 'a', name: 'A', role: 'pro' },
    { id: 'b', name: 'B', role: 'con' },
    { id: 'c', name: 'C', role: 'neutral' },
];

describe('buildTopologyForStrategy', () => {
    it('defaults to roundtable for round_robin and strategies without handlers', () => {
        expect(buildTopologyForStrategy('round_robin', baseline).type).toBe('roundtable');
        expect(buildTopologyForStrategy('cross-examination', baseline).type).toBe('roundtable');
        expect(buildTopologyForStrategy('socratic', baseline).type).toBe('roundtable');
        expect(buildTopologyForStrategy('free_for_all', baseline).type).toBe('roundtable');
    });

    it('maps sequential → linear', () => {
        const topo = buildTopologyForStrategy('sequential', baseline);
        expect(topo.type).toBe('linear');
        expect(topo.nodes).toHaveLength(baseline.length);
        expect(topo.edges).toHaveLength(baseline.length - 1);
    });

    it('maps tree-of-thought → tree (star from first node)', () => {
        const topo = buildTopologyForStrategy('tree-of-thought', baseline);
        expect(topo.type).toBe('tree-of-thought');
        expect(topo.edges).toHaveLength(baseline.length - 1);
    });

    it('maps judge only when a judge participant exists; else falls back to roundtable', () => {
        expect(buildTopologyForStrategy('judge', baseline).type).toBe('roundtable');
        const withJudge = buildTopologyForStrategy('judge', [
            ...baseline,
            { id: 'j', name: 'Judge', role: 'judge' },
        ]);
        expect(withJudge.type).toBe('judge');
    });

    it('maps red-blue only when attacker & defender exist; else falls back to roundtable', () => {
        expect(buildTopologyForStrategy('red-blue', baseline).type).toBe('roundtable');
        const present = buildTopologyForStrategy('red-blue', [
            { id: 'atk', name: 'Atk', role: 'attacker' },
            { id: 'def', name: 'Def', role: 'defender' },
        ]);
        expect(present.type).toBe('red-blue');
        expect(present.edges.length).toBeGreaterThanOrEqual(2);
    });
});
