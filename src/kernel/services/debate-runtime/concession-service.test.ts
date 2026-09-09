import { describe, it, expect } from 'vitest';
import { ConcessionService } from './concession-service';

describe('ConcessionService', () => {
    const s = new ConcessionService();
    it('finds opportunities among weak opponent claims', () => {
        const args = [
            { id: 'b1', agentId: 'bob', content: 'Short weak claim', round: 1 },
            { id: 'b2', agentId: 'bob', content: 'Strong claim with 42% data and source https://example.com', round: 1 },
            { id: 'a1', agentId: 'alice', content: 'my own', round: 1 },
        ];
        const ops = s.findOpportunities('alice', args);
        expect(ops.some((o) => o.claimId === 'b1')).toBe(true);
        expect(ops.some((o) => o.claimId === 'b2')).toBe(false);
    });
    it('empty when no opponent', () => {
        expect(s.findOpportunities('alice', [])).toEqual([]);
    });
    it('returns benefit', () => {
        const ops = s.findOpportunities('alice', [{ id: 'b1', agentId: 'bob', content: 'weak', round: 1 }]);
        expect(ops[0].benefit).toBeGreaterThan(0);
    });
});
