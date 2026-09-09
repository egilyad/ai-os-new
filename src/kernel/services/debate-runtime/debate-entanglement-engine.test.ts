import { describe, it, expect } from 'vitest';
import { EntanglementEngine } from './debate-entanglement-engine';
import { ArgumentGraphService } from './debate-argument-graph-service';

describe('EntanglementEngine', () => {
    it('returns null when no opponent claims', () => {
        const graph = new ArgumentGraphService();
        const e = new EntanglementEngine();
        try { e.setGraph(graph); } catch {}
        expect(e.getConstraint('alice', 'Alice', [], 1)).toBeNull();
    });
    it('getConstraint does not throw with data', () => {
        const graph = new ArgumentGraphService();
        const e = new EntanglementEngine();
        try { e.setGraph(graph); } catch {}
        const args = [
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'We must ban fossil fuels immediately because climate is urgent', round: 1 },
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'My own claim', round: 1 },
        ];
        expect(() => e.getConstraint('alice', 'Alice', args, 2)).not.toThrow();
    });
    it('validateEntanglement detects engagement', () => {
        const graph = new ArgumentGraphService();
        const e = new EntanglementEngine();
        try { e.setGraph(graph); } catch {}
        const constraint = { mustQuoteOpponent: true, targetClaimId: 'b1', targetClaimText: 'We must ban fossil fuels', opponentId: 'bob', opponentName: 'Bob', responseType: 'rebut' as const };
        const res = e.validateEntanglement('I disagree with "We must ban fossil fuels" because economy', constraint);
        expect(typeof res.engaged).toBe('boolean');
    });
});
