/**
 * Adapters that plug the agent permission store into the tool pipeline.
 */
import type { AgentPermissionService } from '../permissions/permission-service';
import { actionForTool } from '../../contracts/agent-permissions';
import type {
    ToolApprovalResolver,
    ToolPipelineMiddleware,
} from './tool-pipeline';

export interface PermissionActionResolver {
    (toolId: string): { action: string; resource: string };
}

/** Human-in-the-loop callback used to resolve `ask` decisions. */
export type ApprovalRequestFn = (request: {
    toolId: string;
    agentId?: string;
    action?: string;
    resource?: string;
    reason: string;
}) => Promise<'allow' | 'deny'>;

const defaultResolver: PermissionActionResolver = (toolId) => ({
    action: actionForTool(toolId),
    resource: toolId,
});

/**
 * Middleware that consults the agent permission store before the tool body
 * runs. `ask` decisions are forwarded to the pipeline's approval resolver.
 */
export function createPermissionMiddleware(
    permissionService: AgentPermissionService,
    resolveAction: PermissionActionResolver = defaultResolver,
): ToolPipelineMiddleware {
    return {
        id: 'permission',
        async pre(ctx) {
            if (!ctx.agentId) return { kind: 'allow' };
            const { action, resource } = resolveAction(ctx.toolId);
            const decision = await permissionService.evaluate(ctx.agentId, action, resource);
            switch (decision.effect) {
                case 'allow':
                    return { kind: 'allow' };
                case 'deny':
                    return { kind: 'deny', reason: decision.reason };
                case 'ask':
                    return {
                        kind: 'ask',
                        reason: decision.reason,
                        action,
                        resource,
                    };
            }
        },
    };
}

/**
 * Approval resolver that records human rejections so the consecutive-denial
 * circuit breaker can escalate repeated `ask` decisions into a hard stop.
 *
 * Without an approval channel the request fails closed (`deny`) — the same
 * behaviour as the DeepSeek Harness ("missing approval support turns ask
 * into denial").
 */
export function createPermissionApprovalResolver(
    permissionService: AgentPermissionService,
    requestApproval?: ApprovalRequestFn,
): ToolApprovalResolver {
    return {
        async resolve(request) {
            if (!requestApproval) {
                if (request.agentId) await permissionService.recordDenial(request.agentId);
                return 'deny';
            }
            const verdict = await requestApproval(request);
            if (verdict === 'allow') {
                if (request.agentId) await permissionService.resetDenials(request.agentId);
                return 'allow';
            }
            if (request.agentId) await permissionService.recordDenial(request.agentId);
            return 'deny';
        },
    };
}
