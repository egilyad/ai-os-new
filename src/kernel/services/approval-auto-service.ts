/**
 * Approval Auto-Rules — AGEMS 3.4
 * Evaluates PENDING requests against agent policy:
 *  - autoApproveLowRisk: riskLevel === 'low' → AUTO_APPROVED
 *  - costThresholdUsd: toolInput.estimatedCostUsd <= threshold → AUTO_APPROVED
 *  - autoApproveAfterMin: pending older than N min → AUTO_APPROVED
 *  - expiresAt passed → EXPIRED
 * resolvedBy is tagged 'auto:<rule>' so UI/audit can distinguish human vs auto.
 */
import { getDexieDb } from './dexie-schema';
import type { ApprovalRequest } from '../types/agems-approval';
import { agemsApprovalService } from './agems-approval-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ApprovalAuto');

function estimatedCost(toolInput: unknown): number | undefined {
    if (toolInput && typeof toolInput === 'object' && 'estimatedCostUsd' in toolInput) {
        const v = (toolInput as Record<string, unknown>).estimatedCostUsd;
        return typeof v === 'number' ? v : undefined;
    }
    return undefined;
}

export const approvalAutoService = {
    async evaluateAgent(agentId: string): Promise<{ autoApproved: number; expired: number }> {
        const policy = await agemsApprovalService.getPolicy(agentId);
        const pending = await agemsApprovalService.list(agentId, 'PENDING');
        let autoApproved = 0;
        let expired = 0;
        const now = Date.now();
        for (const req of pending) {
            if (req.expiresAt && req.expiresAt < now) {
                await getDexieDb().approvalRequests.update(req.id as number, { status: 'EXPIRED', resolvedBy: 'auto:expired', resolvedAt: now } as never);
                expired++;
                continue;
            }
            if (!policy) continue;
            let rule: string | null = null;
            if (policy.autoApproveLowRisk && req.riskLevel === 'low') rule = 'auto:low-risk';
            if (!rule && policy.costThresholdUsd !== undefined) {
                const cost = estimatedCost(req.toolInput);
                if (cost !== undefined && cost <= policy.costThresholdUsd) rule = 'auto:under-threshold';
            }
            if (!rule && policy.autoApproveAfterMin !== undefined) {
                if (now - req.createdAt > policy.autoApproveAfterMin * 60000) rule = 'auto:timeout';
            }
            if (rule) {
                await getDexieDb().approvalRequests.update(req.id as number, { status: 'AUTO_APPROVED', resolvedBy: rule, resolvedAt: now } as never);
                autoApproved++;
            }
        }
        if (autoApproved || expired) LOGGER.info('ApprovalAuto', 'evaluated', { agentId, autoApproved, expired });
        return { autoApproved, expired };
    },

    async evaluateAll(): Promise<{ autoApproved: number; expired: number }> {
        const policies = (await getDexieDb().approvalPolicies.toArray()) as unknown as Array<{ agentId: string }>;
        // Agents with pending but no policy still need expiry sweep
        const pendingAgents = new Set(policies.map((p) => p.agentId));
        const allPending = (await getDexieDb().approvalRequests.where('status').equals('PENDING').toArray()) as unknown as ApprovalRequest[];
        for (const r of allPending) pendingAgents.add(r.agentId);
        let autoApproved = 0;
        let expired = 0;
        for (const agentId of pendingAgents) {
            const res = await this.evaluateAgent(agentId);
            autoApproved += res.autoApproved;
            expired += res.expired;
        }
        return { autoApproved, expired };
    },

    // B3: таймер авто-свипа (evaluateAll ожил — раньше вызывателей не было).
    _timer: null as ReturnType<typeof setInterval> | null,
    startAutoSweep(intervalMs = 60000): void {
        if (this._timer) return;
        this._timer = setInterval(() => {
            void this.evaluateAll().catch((e) => LOGGER.warn('ApprovalAuto', 'sweep failed', { error: String(e) }));
        }, Math.max(10000, intervalMs));
    },
    stopAutoSweep(): void {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    },
};
