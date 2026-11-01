/**
 * Adapters that plug the agent permission store into the tool pipeline.
 */
import type { AgentPermissionService } from '../permissions/permission-service';
import { actionForTool } from '../../contracts/agent-permissions';
import type { IToolApprovalService } from '../../contracts/tool-approval';
import type { IAuthorizationService } from '../../contracts/authorization';
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

export const defaultResolver: PermissionActionResolver = (toolId) => ({
    action: actionForTool(toolId),
    resource: toolId,
});

/**
 * Middleware that consults the agent permission store before the tool body
 * runs. `ask` decisions are forwarded to the pipeline's approval resolver.
 *
 * Fail closed: an agent without its own state lands in the default `guarded`
 * mode, where writes / exec / net / MCP become human questions.
 */
export function createPermissionMiddleware(
    permissionService: AgentPermissionService,
    resolveAction?: PermissionActionResolver,
    authorizationService?: IAuthorizationService,
): ToolPipelineMiddleware {
    const resolver = resolveAction ?? defaultResolver;
    return {
        id: 'permission',
        async pre(ctx) {
            // SPEC_08: если подключён единый authorizationService — используем его
            // как первый decision point. deny из authz блокирует сразу; allow/ask
            // передаются дальше в permissionService (для записи денайлов/approval).
            if (authorizationService) {
                const authzDec = await authorizationService.evaluate({
                    actor: ctx.agentId ?? 'system',
                    actorType: ctx.agentId ? 'agent' : 'service',
                    action: actionForTool(ctx.toolId),
                    resource: ctx.toolId,
                });
                if (authzDec.effect === 'deny') {
                    return { kind: 'deny', reason: authzDec.reason ?? 'denied by authorization service' };
                }
            }
            if (!ctx.agentId) return { kind: 'allow' };
            const { action, resource } = resolver(ctx.toolId);
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

/**
 * Approval resolver backed by the kernel-level approval channel.
 *
 * Unlike {@link createPermissionApprovalResolver} this one has a real channel:
 * the request is published as an event, the UI shows a dialog, and the human
 * answers through `IToolApprovalService.resolve()`. Denials are recorded so
 * the consecutive-denial circuit breaker keeps working.
 */
export function createChannelApprovalResolver(
    permissionService: AgentPermissionService,
    approvalService: IToolApprovalService,
): ToolApprovalResolver {
    return {
        async resolve(request) {
            const verdict = await approvalService.request({
                toolId: request.toolId,
                agentId: request.agentId,
                action: request.action,
                resource: request.resource,
                reason: request.reason,
            });
            if (verdict === 'allow') {
                if (request.agentId) await permissionService.resetDenials(request.agentId);
                return 'allow';
            }
            if (request.agentId) await permissionService.recordDenial(request.agentId);
            return 'deny';
        },
    };
}
