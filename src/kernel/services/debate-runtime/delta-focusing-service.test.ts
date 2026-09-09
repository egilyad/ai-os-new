import { describe, it, expect } from 'vitest';
import { DeltaFocusingService } from './delta-focusing-service';

describe('DeltaFocusingService', () => {
    const svc = new DeltaFocusingService();

    it('returns empty when no opponent', () => {
        expect(svc.getDeltaPoints('alice', [])).toEqual([]);
        expect(svc.getDeltaPoints('alice', [{ id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'hello world', round: 1 }])).toEqual([]);
    });

    it('finds high divergence points', () => {
        const args = [
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'solar energy is renewable and clean', round: 1 },
            { id: 'a2', agentId: 'alice', agentName: 'Alice', content: 'we need solar panels everywhere', round: 2 },
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'nuclear power quantum physics reactor core', round: 1 },
            { id: 'b2', agentId: 'bob', agentName: 'Bob', content: 'solar energy is renewable and clean', round: 2 }, // same as alice => low divergence
        ];
        const points = svc.getDeltaPoints('alice', args);
        // b1 should be high divergence, b2 low (filtered)
        expect(points.some((p) => p.claimId === 'b1')).toBe(true);
        expect(points.some((p) => p.claimId === 'b2')).toBe(false);
    });

    it('sorts by divergence descending', () => {
        const args = [
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'apple banana cherry', round: 1 },
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'dog elephant frog', round: 1 },
            { id: 'b2', agentId: 'bob', agentName: 'Bob', content: 'apple dog cherry', round: 1 },
        ];
        const points = svc.getDeltaPoints('alice', args);
        if (points.length >= 2) {
            expect(points[0].divergenceScore).toBeGreaterThanOrEqual(points[1].divergenceScore);
        }
    });
});
