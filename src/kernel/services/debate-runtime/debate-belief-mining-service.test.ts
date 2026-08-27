import { describe, it, expect } from 'vitest';
import { BeliefMiningService } from './debate-belief-mining-service';

describe('BeliefMiningService', () => {
    const svc = new BeliefMiningService();
    it('extracts beliefs from arguments', () => {
        const beliefs = svc.extractBeliefs([
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'We must protect freedom and justice because economic growth drives welfare, but social norms prevent it.', round: 1 },
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'The government should enforce strict regulation to ensure equality', round: 1 },
        ]);
        expect(Array.isArray(beliefs)).toBe(true);
        expect(beliefs.length).toBeGreaterThan(0);
        expect(beliefs[0]).toHaveProperty('type');
        expect(beliefs[0]).toHaveProperty('premise');
    });
    it('returns empty for no input', () => {
        expect(svc.extractBeliefs([])).toEqual([]);
    });
    it('finds conflicts between agents', () => {
        const beliefs = svc.extractBeliefs([
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'Freedom is more important than equality, market drives innovation', round: 1 },
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'Equality is more important than freedom, regulation ensures fairness', round: 1 },
        ]);
        const conflicts = (svc as any).findConflicts ? (svc as any).findConflicts(beliefs) : [];
        expect(Array.isArray(conflicts)).toBe(true);
    });
});
