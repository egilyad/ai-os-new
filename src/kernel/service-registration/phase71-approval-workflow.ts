/**
 * Phase 71 — Approval Workflow (AGEMS port, Phase 3).
 *
 * Presets, request flow, bulk approve/reject, comments.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { ApprovalWorkflowService } from '../services/approval-service';

export const registerPhase71: Phase = ({ register }) => {
    register('approvalWorkflowService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new ApprovalWorkflowService({
            approvalPresets: db.approvalPresets,
            approvalRequests: db.approvalRequests,
            approvalComments: db.approvalComments,
        });
    });
};
