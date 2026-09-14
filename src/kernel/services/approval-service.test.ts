/**
 * ApprovalService tests — gates, limits, sandbox (roadmapp.md §P10).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApprovalService } from './approval-service';
import { DEFAULT_EXECUTION_LIMITS, DEFAULT_SANDBOX } from '../types/safety-types';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

describe('ApprovalService', () => {
    let svc: ApprovalService;

    beforeEach(() => {
        svc = new ApprovalService();
    });

    describe('approval gates', () => {
        it('requests approval', () => {
            const gate = svc.requestApproval('p1', 'Deploy', ['execute']);
            expect(gate.status).toBe('pending');
            expect(gate.name).toBe('Deploy');
        });

        it('approves a gate', () => {
            const gate = svc.requestApproval('p1', 'Deploy', ['execute']);
            svc.approve(gate.id, 'Looks good');
            expect(svc.isApproved(gate.id)).toBe(true);
        });

        it('denies a gate', () => {
            const gate = svc.requestApproval('p1', 'Deploy', ['execute']);
            svc.deny(gate.id, 'Too risky');
            expect(svc.isApproved(gate.id)).toBe(false);
        });

        it('gets pending approvals', () => {
            svc.requestApproval('p1', 'a', []);
            svc.requestApproval('p1', 'b', []);
            const g = svc.requestApproval('p1', 'c', []);
            svc.approve(g.id);
            expect(svc.getPendingApprovals('p1')).toHaveLength(2);
        });
    });

    describe('execution limits', () => {
        it('returns defaults', () => {
            expect(svc.getExecutionLimits('p1')).toEqual(DEFAULT_EXECUTION_LIMITS);
        });

        it('overrides limits', () => {
            svc.setExecutionLimits('p1', { maxTokensPerRun: 50000 });
            expect(svc.getExecutionLimits('p1').maxTokensPerRun).toBe(50000);
        });
    });

    describe('sandbox boundary', () => {
        it('returns defaults', () => {
            expect(svc.getSandboxBoundary('p1')).toEqual(DEFAULT_SANDBOX);
        });

        it('overrides boundary', () => {
            svc.setSandboxBoundary('p1', { networkAccess: true });
            expect(svc.getSandboxBoundary('p1').networkAccess).toBe(true);
        });
    });

    describe('checkCapability', () => {
        it('blocks tool by default deny list', () => {
            const result = svc.checkCapability('p1', 'delete_project');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('blocked');
        });

        it('allows non-blocked tools', () => {
            expect(svc.checkCapability('p1', 'read_file').allowed).toBe(true);
        });

        it('respects allow list', () => {
            svc.setExecutionLimits('p1', { allowedToolNames: ['read_file', 'write_file'] });
            expect(svc.checkCapability('p1', 'read_file').allowed).toBe(true);
            expect(svc.checkCapability('p1', 'delete_file').allowed).toBe(false);
        });
    });
});
