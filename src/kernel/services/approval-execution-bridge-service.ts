import type { ILifecycle } from '../contracts/lifecycle';
import type { IToolRunnerService } from '../contracts/parity';
import type { AgemsApprovalService } from './agems-approval-service';
import type { ApprovalRequest } from '../types/agems-approval';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ApprovalExecBridge');

/**
 * B3: approval → execution мост ядра.
 *
 * Одобренный человеком tool-запрос исполняется через ToolRunner.callTool.
 * Консервативно: auto-резолвы (`resolvedBy: auto:*`) НЕ исполняются —
 * только human-approved. Результат виден через TOOL_EXECUTED событие
 * самого раннера; мост только логирует исход.
 */
export interface ApprovalExecutionBridgeDeps {
    approval: AgemsApprovalService;
    toolRunner: Pick<IToolRunnerService, 'callTool'>;
    enabled?: boolean;
}

export class ApprovalExecutionBridge implements ILifecycle {
    private deps: ApprovalExecutionBridgeDeps;
    private started = false;

    constructor(deps: ApprovalExecutionBridgeDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        this.start();
    }

    start(): void {
        if (this.started) return;
        this.started = true;
        this.deps.approval.delegates.onResolved = (req, status) => {
            void this.onResolved(req, status);
        };
    }

    destroy(): void {
        if (this.deps.approval.delegates.onResolved) {
            this.deps.approval.delegates.onResolved = undefined;
        }
        this.started = false;
    }

    isEnabled(): boolean {
        return this.deps.enabled ?? true;
    }

    private async onResolved(req: ApprovalRequest, status: 'APPROVED' | 'REJECTED'): Promise<void> {
        if (status !== 'APPROVED' || !this.isEnabled()) return;
        if (req.resolvedBy && req.resolvedBy.startsWith('auto:')) return;
        const args =
            req.toolInput && typeof req.toolInput === 'object'
                ? (req.toolInput as Record<string, unknown>)
                : {};
        try {
            const out = await this.deps.toolRunner.callTool(req.agentId, req.toolName, args);
            LOGGER.info('exec', 'approved tool executed', {
                agentId: req.agentId,
                tool: req.toolName,
                outLen: out.length,
            });
        } catch (e) {
            LOGGER.warn('exec', 'approved tool failed', {
                agentId: req.agentId,
                tool: req.toolName,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }
}
