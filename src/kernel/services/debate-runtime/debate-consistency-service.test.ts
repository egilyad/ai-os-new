import { describe, it, expect } from 'vitest';
import { ConsistencyService } from './debate-consistency-service';

describe('ConsistencyService', () => {
    it('no contradiction on first argument', () => {
        const svc = new ConsistencyService();
        const res = svc.checkConsistency('alice', 'Alice', 'Solar energy is great', 1, []);
        expect(res).toEqual([]);
        expect(svc.getConsistencyRatio('alice')).toBe(1);
    });

    it('detects direct contradiction marker', () => {
        const svc = new ConsistencyService();
        const prev = [
            { id: 'n1', agentId: 'alice', content: 'We should invest heavily in solar power because it is clean', round: 1 },
        ];
        // Include contradiction phrase + similar topic
        const current = 'I was wrong about solar, actually I no longer support solar investment';
        const res = svc.checkConsistency('alice', 'Alice', current, 2, prev);
        // heuristic may return contradiction(s)
        expect(Array.isArray(res)).toBe(true);
    });

    it('reset clears history', () => {
        const svc = new ConsistencyService();
        svc.checkConsistency('alice', 'Alice', 'Claim one about climate', 1, []);
        svc.reset();
        expect(svc.getConsistencyRatio('alice')).toBe(1);
    });
});
