import { describe, it, expect } from 'vitest';
import { BurdenOfProofService } from './burden-of-proof-service';

describe('BurdenOfProofService', () => {
    const svc = new BurdenOfProofService();

    it('isSupported detects evidence markers', () => {
        expect(svc.isSupported('According to study, 42% of cases show effect https://example.com')).toBe(true);
        expect(svc.isSupported('Data from survey report indicates growth')).toBe(true);
        expect(svc.isSupported('I think it is good. Everyone agrees.')).toBe(false);
        expect(svc.isSupported('123 numbers')).toBe(true);
    });

    it('getUnsupportedClaims filters opponent and supported', () => {
        const args = [
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'With source https://example.com data 42%', round: 1 },
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'Everyone knows it is true', round: 1 },
            { id: 'b2', agentId: 'bob', agentName: 'Bob', content: 'Study shows 99% success', round: 2 },
            { id: 'a2', agentId: 'alice', agentName: 'Alice', content: 'Unsupported claim without proof', round: 2 },
        ];
        const unsupported = svc.getUnsupportedClaims('alice', args);
        expect(unsupported.map((u) => u.claimId)).toEqual(['b1']);
    });

    it('returns empty when no opponent', () => {
        expect(svc.getUnsupportedClaims('alice', [])).toEqual([]);
    });
});
