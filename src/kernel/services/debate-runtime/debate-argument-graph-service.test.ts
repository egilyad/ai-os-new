import { describe, it, expect } from 'vitest';
import { ArgumentGraphService } from './debate-argument-graph-service';
import type { GraphBuildInput } from '../../contracts/debate-argument-graph';

function input(partial: Partial<GraphBuildInput> & { id: string }): GraphBuildInput {
    return {
        agentId: 'alice',
        agentName: 'Alice',
        content: 'A claim with enough words to matter here',
        round: 1,
        timestamp: 1000,
        confidence: 0.8,
        ...partial,
    };
}

describe('ArgumentGraphService (per-session)', () => {
    it('isolates graphs across sessions', () => {
        const svc = new ArgumentGraphService();
        svc.build('s-a', [
            input({ id: 'a1', agentId: 'alice', content: 'We must ban fossil fuels because climate is urgent' }),
            input({ id: 'a2', agentId: 'bob', agentName: 'Bob', content: 'Banning fossil fuels would wreck the economy', round: 2 }),
        ]);
        svc.build('s-b', [input({ id: 'b1', agentId: 'bob', agentName: 'Bob' })]);

        expect(svc.isInitialized('s-a')).toBe(true);
        expect(svc.isInitialized('s-b')).toBe(true);
        expect(svc.isInitialized('s-unknown')).toBe(false);

        expect(svc.getAllNodes('s-a')).toHaveLength(2);
        expect(svc.getAllNodes('s-b')).toHaveLength(1);
        expect(svc.getNode('s-a', 'b1')).toBeUndefined();
        expect(svc.getNode('s-b', 'a1')).toBeUndefined();
        expect(svc.getEdgeBalance('s-a', 'a2').attack).toBeGreaterThan(0);
        expect(svc.getEdgeBalance('s-b', 'b1').attack).toBe(0);
    });

    it('clear() only resets the targeted session', () => {
        const svc = new ArgumentGraphService();
        svc.build('s-a', [input({ id: 'a1' })]);
        svc.build('s-b', [input({ id: 'b1', agentId: 'bob' })]);

        svc.clear('s-a');

        expect(svc.isInitialized('s-a')).toBe(false);
        expect(svc.isInitialized('s-b')).toBe(true);
        expect(svc.getAllNodes('s-b')).toHaveLength(1);
    });

    it('rebuilding one session does not disturb another', () => {
        const svc = new ArgumentGraphService();
        svc.build('s-a', [input({ id: 'a1' })]);
        svc.build('s-b', [input({ id: 'b1', agentId: 'bob' })]);

        svc.build('s-a', [
            input({ id: 'a1' }),
            input({ id: 'a2', agentId: 'bob', content: 'A different counter claim about energy policy', round: 2 }),
        ]);

        expect(svc.getAllNodes('s-a')).toHaveLength(2);
        expect(svc.getAllNodes('s-b')).toHaveLength(1);
        expect(svc.getStats('s-a').totalNodes).toBe(2);
        expect(svc.getStats('s-b').totalNodes).toBe(1);
    });

    it('unknown sessions behave as empty graphs', () => {
        const svc = new ArgumentGraphService();
        expect(svc.getAllNodes('nope')).toEqual([]);
        expect(svc.getAllEdges('nope')).toEqual([]);
        expect(svc.getStats('nope').totalNodes).toBe(0);
        expect(svc.findBestConstraint('nope', 'alice', 3)).toBeNull();
        expect(svc.getUnattackedClaims('nope', 5)).toEqual([]);
        expect(svc.getSubgraph('nope', 'x')).toEqual({ nodes: [], edges: [] });
        expect(svc.getLongestChain('nope')).toEqual([]);
    });

    it('build exposes nodes/edges and analysis helpers', () => {
        const svc = new ArgumentGraphService();
        svc.build('s1', [
            input({ id: 'n1', agentId: 'alice', content: 'We must ban fossil fuels because climate is urgent' }),
            input({ id: 'n2', agentId: 'bob', agentName: 'Bob', content: 'Banning fossil fuels is wrong and would wreck the economy', round: 2 }),
            input({ id: 'n3', agentId: 'alice', content: 'Renewables already prove that we can transition affordably', round: 3 }),
        ]);

        expect(svc.getAgentNodes('s1', 'alice')).toHaveLength(2);
        expect(svc.getRoundNodes('s1', 2)).toHaveLength(1);
        expect(svc.getAllEdges('s1').some((e) => e.type === 'attacks')).toBe(true);
        expect(typeof svc.getCentrality('s1', 'n1')).toBe('number');
        expect(svc.getLongestChain('s1').length).toBeGreaterThanOrEqual(1);
        expect(svc.getSubgraph('s1', 'n1').nodes.length).toBeGreaterThanOrEqual(1);
    });
});
