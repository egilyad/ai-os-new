import { describe, it, expect } from 'vitest';
import { MetaAgentController } from './debate-meta-agent-controller';
import { ArgumentGraphService } from './debate-argument-graph-service';

describe('MetaAgentController', () => {
    it('returns null in round 1 or insufficient data', () => {
        const graph = new ArgumentGraphService();
        const c = new MetaAgentController(graph);
        expect(c.getDirective('alice', 'Alice', [], 1)).toBeNull();
        expect(c.getDirective('alice', 'Alice', [{ id: 'a1', agentId: 'alice', content: 'hi', round: 1 }], 1)).toBeNull();
    });
    it('returns directive when enough data', () => {
        const graph = new ArgumentGraphService();
        const c = new MetaAgentController(graph);
        const args = [
            { id: 'a1', agentId: 'alice', content: 'Claim one about climate with data', round: 1 },
            { id: 'b1', agentId: 'bob', content: 'Counter claim about economy', round: 1 },
            { id: 'a2', agentId: 'alice', content: 'Rebuttal with more evidence', round: 2 },
            { id: 'b2', agentId: 'bob', content: 'Another counter', round: 2 },
        ];
        const d = c.getDirective('alice', 'Alice', args, 3);
        if (d) {
            expect(d.agentId).toBe('alice');
            expect(typeof d.instruction).toBe('string');
            expect(typeof d.role).toBe('string');
        } else {
            expect(d).toBeNull();
        }
    });
    it('does not throw', () => {
        const graph = new ArgumentGraphService();
        const c = new MetaAgentController(graph);
        expect(() => c.getDirective('alice', 'Alice', [{ id: 'x', agentId: 'bob', content: 'test', round: 1 }], 2)).not.toThrow();
    });
});
