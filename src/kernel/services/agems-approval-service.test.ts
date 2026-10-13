/**
 * AgemsApprovalService HITL guards (ro2 §5.1) — replay protection + TTL.
 * Dexie backed by fake-indexeddb (see src/tests/setup-light.ts).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgemsApprovalService } from './agems-approval-service';
import { getDexieDb } from './database-service';

vi.mock('./logger-service', () => ({
    rootLogger: {
        child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('AgemsApprovalService HITL guards', () => {
    let svc: AgemsApprovalService;

    beforeEach(async () => {
        svc = new AgemsApprovalService();
        await getDexieDb().approvalRequests.clear();
        await getDexieDb().approvalPolicies.clear();
    });

    it('request → resolve APPROVED works once', async () => {
        const req = await svc.requestApproval({
            agentId: 'a1',
            toolName: 'browser.act',
            toolInput: { task: 'open https://example.com' },
            category: 'browser',
            riskLevel: 'high',
        });
        expect(req.status).toBe('PENDING');
        await svc.resolve(req.id as number, 'APPROVED', undefined, 'human:1');
        const list = await svc.list('a1', 'APPROVED');
        expect(list).toHaveLength(1);
    });

    it('replay: second resolve of a settled request throws', async () => {
        const req = await svc.requestApproval({
            agentId: 'a1',
            toolName: 'browser.act',
            toolInput: {},
            category: 'browser',
            riskLevel: 'high',
        });
        await svc.resolve(req.id as number, 'APPROVED', undefined, 'human:1');
        await expect(svc.resolve(req.id as number, 'REJECTED', 'oops', 'human:2')).rejects.toThrow(/already APPROVED/);
        // Статус остался APPROVED, не перезаписан.
        const list = await svc.list('a1', 'APPROVED');
        expect(list).toHaveLength(1);
    });

    it('TTL: expired request transitions to EXPIRED instead of executing', async () => {
        const req = await svc.requestApproval({
            agentId: 'a1',
            toolName: 'browser.act',
            toolInput: {},
            category: 'browser',
            riskLevel: 'high',
            expiresAt: Date.now() - 1000,
        });
        await expect(svc.resolve(req.id as number, 'APPROVED', undefined, 'human:1')).rejects.toThrow(/expired/);
        const expired = await svc.list('a1', 'EXPIRED');
        expect(expired).toHaveLength(1);
    });

    it('resolve of unknown id throws', async () => {
        await expect(svc.resolve(999_999_999, 'APPROVED')).rejects.toThrow(/not found/);
    });

    it('claim consumes an APPROVED request exactly once', async () => {
        const req = await svc.requestApproval({
            agentId: 'a1',
            toolName: 'computer.use',
            toolInput: { task: 'x' },
            category: 'computer',
            riskLevel: 'high',
        });
        await expect(svc.claim(req.id as number)).rejects.toThrow(/already PENDING/);
        await svc.resolve(req.id as number, 'APPROVED', undefined, 'human:1');
        const claimed = await svc.claim(req.id as number);
        expect(claimed.status).toBe('CONSUMED');
        await expect(svc.claim(req.id as number)).rejects.toThrow(/already CONSUMED/);
        await expect(svc.resolve(req.id as number, 'APPROVED')).rejects.toThrow(/already CONSUMED/);
        expect(await svc.list('a1', 'CONSUMED')).toHaveLength(1);
    });

    it('bulkResolve skips settled items (best-effort)', async () => {
        const r1 = await svc.requestApproval({
            agentId: 'a1',
            toolName: 'browser.act',
            toolInput: {},
            category: 'browser',
            riskLevel: 'high',
        });
        const r2 = await svc.requestApproval({
            agentId: 'a1',
            toolName: 'browser.act',
            toolInput: {},
            category: 'browser',
            riskLevel: 'high',
        });
        await svc.resolve(r1.id as number, 'APPROVED', undefined, 'human:1');
        await svc.bulkResolve([r1.id as number, r2.id as number], 'APPROVED');
        expect(await svc.list('a1', 'APPROVED')).toHaveLength(2);
    });
});
