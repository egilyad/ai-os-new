import { describe, it, expect } from 'vitest';
import { SteelmanService } from './debate-steelman-service';

describe('SteelmanService', () => {
    const svc = new SteelmanService();
    it('returns null when no opponent', () => {
        expect(svc.selectTarget('alice', [])).toBeNull();
        expect(svc.selectTarget('alice', [{ id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'my claim', round: 1 }])).toBeNull();
    });
    it('selects strongest opponent claim', () => {
        const args = [
            { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'short', round: 1 },
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'This is a substantive argument about climate policy with detailed reasoning and evidence spanning many words to demonstrate depth.', round: 2 },
            { id: 'b2', agentId: 'bob', agentName: 'Bob', content: 'tiny', round: 1 },
        ];
        const t = svc.selectTarget('alice', args);
        expect(t).not.toBeNull();
        expect(t!.opponentId).toBe('bob');
        expect(t!.claimId).toBe('b1');
    });
    it('prefers recent round', () => {
        const args = [
            { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'Old argument with decent length for scoring .'.repeat(10), round: 1 },
            { id: 'b2', agentId: 'bob', agentName: 'Bob', content: 'Recent argument with decent length for scoring .'.repeat(10), round: 5 },
        ];
        const t = svc.selectTarget('alice', args);
        expect(t!.round).toBe(5);
    });
});
