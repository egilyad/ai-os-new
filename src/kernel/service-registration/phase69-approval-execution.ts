/**
 * Phase 69 — Approval → execution (B3: мост ядра + таймер авто-правил).
 *
 * - ApprovalExecutionBridge: human-APPROVED tool-запрос → ToolRunner.callTool
 *   (auto-резолвы не исполняются — консервативно).
 * - approvalAutoService.startAutoSweep: evaluateAll ожил на таймере (60s).
 *
 * Additive — остальные фазы не тронуты.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IToolRunnerService } from '../contracts/parity';
import { agemsApprovalService } from '../services/agems-approval-service';
import { approvalAutoService } from '../services/approval-auto-service';
import { ApprovalExecutionBridge } from '../services/approval-execution-bridge-service';

export const registerPhase69: Phase = ({ register }, ctx) => {
    register('approvalExecutionBridge', (c: IContainer) => {
        if (!c.has('toolRunnerService')) {
            return { enabled: false as const };
        }
        const bridge = new ApprovalExecutionBridge({
            approval: agemsApprovalService,
            toolRunner: c.get<IToolRunnerService>('toolRunnerService'),
        });
        bridge.start();
        ctx.registerWithLifecycle('approvalExecutionBridge', bridge);
        return bridge;
    });

    approvalAutoService.startAutoSweep();
};
