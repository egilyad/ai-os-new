/**
 * Approval Bulk + Review Comments — AGEMS 3.2/3.3
 * Bulk approve/reject via agemsApprovalService.resolve;
 * review thread stored inline on ApprovalRequest.reviewComments (additive, no migration).
 */
import { getDexieDb } from './database-service';
import type { ApprovalRequest, ApprovalReviewComment } from '../types/agems-approval';
import { agemsApprovalService } from './agems-approval-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ApprovalBulk');

export const approvalBulkService = {
    async bulkApprove(ids: number[], resolverId = 'current'): Promise<number> {
        let done = 0;
        for (const id of ids) {
            try {
                await agemsApprovalService.resolve(id, 'APPROVED', undefined, resolverId);
                done++;
            } catch {
                /* settled/expired — skip, не абортим батч */
            }
        }
        LOGGER.info('ApprovalBulk', 'approved', { count: done, skipped: ids.length - done });
        return done;
    },
    async bulkReject(ids: number[], reason: string, resolverId = 'current'): Promise<number> {
        let done = 0;
        for (const id of ids) {
            try {
                await agemsApprovalService.resolve(id, 'REJECTED', reason, resolverId);
                done++;
            } catch {
                /* settled/expired — skip */
            }
        }
        LOGGER.info('ApprovalBulk', 'rejected', { count: done, skipped: ids.length - done });
        return done;
    },
    async addComment(requestId: number, authorId: string, text: string): Promise<number> {
        const db = getDexieDb();
        const req = (await db.approvalRequests.get(requestId)) as unknown as ApprovalRequest | undefined;
        const thread: ApprovalReviewComment[] = [...(req?.reviewComments ?? [])];
        thread.push({ authorId, text: text.slice(0, 1000), at: Date.now() });
        await db.approvalRequests.update(requestId, { reviewComments: thread } as never);
        return thread.length;
    },
    async listPending(agentId?: string): Promise<ApprovalRequest[]> {
        return agemsApprovalService.list(agentId, 'PENDING');
    },
};
