import { describe, it, expect } from 'vitest';
import { CrossExaminationService } from './cross-examination-service';

describe('CrossExaminationService', () => {
    const svc = new CrossExaminationService();
    const args = [
        { id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'We should use solar because study shows 90% efficiency. According to NASA source.', round: 1 },
        { id: 'b1', agentId: 'bob', agentName: 'Bob', content: 'Always the best! No evidence needed.', round: 1 },
        { id: 'b2', agentId: 'bob', agentName: 'Bob', content: 'Everyone knows nuclear is dangerous, nobody supports it.', round: 2 },
    ];

    it('returns null when no opponent args', () => {
        expect(svc.selectTarget('alice', [{ id: 'a1', agentId: 'alice', agentName: 'Alice', content: 'hi', round: 1 }])).toBeNull();
        expect(svc.selectTarget('alice', [])).toBeNull();
    });

    it('selects weakest opponent claim (vague, no evidence)', () => {
        const target = svc.selectTarget('alice', args);
        expect(target).not.toBeNull();
        expect(target!.opponentId).toBe('bob');
        expect(target!.weaknessScore).toBeGreaterThan(0);
    });

    it('scores vague absolute claims higher', () => {
        const vagueArgs = [
            { id: 'x1', agentId: 'bob', agentName: 'Bob', content: 'Always true with data 42% and source https://example.com', round: 1 },
            { id: 'x2', agentId: 'bob', agentName: 'Bob', content: 'Always everyone never fails.', round: 2 },
        ];
        const target = svc.selectTarget('alice', vagueArgs);
        expect(target!.claimId).toBe('x2');
    });
});
