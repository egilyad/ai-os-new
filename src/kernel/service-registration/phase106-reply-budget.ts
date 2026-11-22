/** Phase 106 — per-reply token budget with wrap-up guidance. */
import type { Phase } from './helpers';
import { ReplyBudgetService } from '../services/middleware/reply-budget-service';

export const registerPhase106: Phase = ({ register }) => {
    register('replyBudgetService', () => new ReplyBudgetService());
};
