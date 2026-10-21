/**
 * Phase 77 — unified tool exposure.
 *
 * Registers `toolExposureService`: the single surface where a model sees
 * tools. It merges the catalog namespace (`t-*`, ToolService) with the runner
 * namespace (`workspace.*`, `http.*`, `mcp.*`, `knowledge.*`, `debate.*`,
 * ToolRunnerService), applies the agent's tool profile
 * (`contracts/tool-groups.ts`) and dispatches an invocation to the owner of
 * the tool.
 *
 * Why: before this, the two namespaces were invisible to each other — the
 * model saw every runner tool regardless of the profile, and `workspace.read`
 * was classified as `tool:exec`, i.e. denied in every profile but `full`.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IToolRunnerService } from '../contracts/parity';
import type { ToolService } from '../services/tool-executor';
import type { AgentService } from '../services/agent-service';
import { ToolExposureService } from '../services/tools/tool-exposure-service';

export const registerPhase77: Phase = ({ register }) => {
    register('toolExposureService', (c: IContainer) => {
        const toolService = c.has('toolService') ? c.get<ToolService>('toolService') : undefined;
        const toolRunner = c.has('toolRunnerService')
            ? c.get<IToolRunnerService>('toolRunnerService')
            : undefined;
        const agentService = c.has('agentService')
            ? c.get<AgentService>('agentService')
            : undefined;
        return new ToolExposureService({
            toolService,
            toolRunner,
            resolveSelection: agentService
                ? (agentId: string) => agentService.getToolSelection(agentId)
                : undefined,
        });
    });
};
