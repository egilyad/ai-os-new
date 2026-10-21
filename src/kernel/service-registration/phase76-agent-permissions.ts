/**
 * Phase 76 — agent permissions and the tool execution waterfall.
 *
 * Ports the permission dialects of the reference harnesses (OpenCode rulesets,
 * OpenClaw session modes, DeepSeek Harness presets) into one engine and wires
 * it into the tool dispatcher as a `pre` middleware.
 */
import type { Phase } from './helpers';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import { AgentPermissionService } from '../services/permissions/permission-service';
import { ToolPipeline } from '../services/tool-pipeline/tool-pipeline';
import { ToolAvailabilityRegistry } from '../services/tool-pipeline/tool-availability';
import { ToolApprovalService } from '../services/tool-pipeline/tool-approval-service';
import {
    createChannelApprovalResolver,
    createPermissionMiddleware,
} from '../services/tool-pipeline/permission-middleware';

export const registerPhase76: Phase = (helpers, ctx) => {
    const { register } = helpers;

    register('agentPermissionService', (c) => {
        const svc = new AgentPermissionService({
            database: c.get<IDatabaseService>('database'),
            eventBus: c.get<IEventBus>('eventBus'),
        });
        void svc.init();
        return svc;
    });

    register('toolAvailabilityRegistry', () => new ToolAvailabilityRegistry());

    register('toolApprovalService', (c) => {
        return new ToolApprovalService({ eventBus: c.get<IEventBus>('eventBus') });
    });

    register('toolPipeline', (c) => {
        const permissionService = c.get<AgentPermissionService>('agentPermissionService');
        const approvalService = c.get<ToolApprovalService>('toolApprovalService');
        return new ToolPipeline(
            [createPermissionMiddleware(permissionService)],
            createChannelApprovalResolver(permissionService, approvalService),
        );
    });

    // Keep the phase context referenced so lint does not flag it as unused
    // when the phase grows additional wiring.
    void ctx;
};
