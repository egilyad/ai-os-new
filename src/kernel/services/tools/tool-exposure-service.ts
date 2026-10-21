/**
 * ToolExposureService — the single surface where a model sees tools.
 *
 * Two execution namespaces exist in the kernel and they used to be invisible
 * to each other:
 *  - catalog namespace (`t-read-file`, `t-web-search`, …) — ToolService;
 *    persisted, admin-editable, each tool declares its permission action.
 *  - runner namespace (`workspace.read`, `http.fetch`, `mcp.call`,
 *    `knowledge.search`, `debate.*`, external packs) — ToolRunnerService.
 *
 * Three problems this service solves:
 *  1. The model was shown *every* runner tool regardless of the agent's tool
 *     profile — `resolveToolSet()` was declared but never consulted.
 *  2. Permission mapping only understood `t-*`, so `workspace.read` fell into
 *     the catch-all `tool:exec` class and was denied in every non-`full`
 *     profile.
 *  3. There was no single place that could answer "which tools may this agent
 *     use, and how do I call them" — every caller re-derived it.
 *
 * The service merges both namespaces, applies the agent's profile, produces
 * OpenAI-style function schemas, and dispatches an invocation to the owner
 * that owns the tool.
 */
import type { IToolRunnerService } from '../../contracts/parity';
import type { ToolDefinition } from '../../contracts/tool-types';
import type { PermissionAction } from '../../contracts/agent-permissions';
import { actionForTool } from '../../contracts/agent-permissions';
import {
    groupOfTool,
    resolveToolSet,
    type ToolGroupId,
} from '../../contracts/tool-groups';
import type { ToolExecutionLink } from '../tool-executor';

export interface ExposedTool {
    /** LLM-facing name (the tool id). */
    name: string;
    description: string;
    /** JSON schema of the arguments. */
    parameters: Record<string, unknown>;
    /** Which engine owns the tool. */
    namespace: 'catalog' | 'runner';
    /** Group from the tool profile taxonomy. */
    group?: ToolGroupId;
    /** Permission class the waterfall checks. */
    action: PermissionAction;
    /** Disabled catalog tools are never exposed. */
    enabled: boolean;
}

/** What an agent is allowed to use. */
export interface AgentToolSelection {
    /** Profile from `contracts/tool-groups.ts` (minimal | research | coding | full). */
    profileId?: string;
    /** Explicit allow-list on top of the profile. */
    tools?: string[];
    /** Explicit deny-list — always wins. */
    deny?: string[];
}

export interface ToolExposureDeps {
    /** Catalog tools (t-*). */
    toolService?: {
        getTools(): ToolDefinition[];
        execute(
            toolId: string,
            input: unknown,
            signal?: AbortSignal,
            link?: ToolExecutionLink,
        ): Promise<unknown>;
    };
    /** Runner tools (workspace.*, http.*, mcp.*, knowledge.*, debate.*, packs). */
    toolRunner?: IToolRunnerService;
    /** Resolves the agent's tool profile (from its node config). */
    resolveSelection?: (agentId: string) => AgentToolSelection | null | undefined;
}

const EMPTY_SCHEMA: Record<string, unknown> = { type: 'object', properties: {} };

function stringifyOutput(value: unknown): string {
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
}

export class ToolExposureService {
    constructor(private readonly deps: ToolExposureDeps) {}

    /** Every tool known to the kernel, before profile filtering. */
    listAll(): ExposedTool[] {
        const out: ExposedTool[] = [];

        for (const tool of this.deps.toolService?.getTools() ?? []) {
            out.push({
                name: tool.id,
                description: tool.description || tool.name,
                parameters: (tool.parameters as Record<string, unknown>) ?? EMPTY_SCHEMA,
                namespace: 'catalog',
                group: (tool.group as ToolGroupId) ?? groupOfTool(tool.id),
                action: tool.permissionAction ?? actionForTool(tool.id),
                enabled: tool.enabled !== false,
            });
        }

        for (const tool of this.deps.toolRunner?.listToolDefs() ?? []) {
            out.push({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters ?? EMPTY_SCHEMA,
                namespace: 'runner',
                group: groupOfTool(tool.name),
                action: actionForTool(tool.name),
                enabled: true,
            });
        }

        return out;
    }

    /** The selection of an agent (profile + allow/deny), as resolved. */
    selection(agentId: string): AgentToolSelection {
        const raw = this.deps.resolveSelection?.(agentId);
        return {
            profileId: raw?.profileId,
            tools: raw?.tools,
            deny: raw?.deny,
        };
    }

    /**
     * Tools an agent may use. Without a selection the most restrictive profile
     * applies — an agent that says nothing about its tools gets read-only.
     */
    list(agentId?: string): ExposedTool[] {
        const all = this.listAll();
        const selection = agentId ? this.deps.resolveSelection?.(agentId) : undefined;
        const profileId = selection?.profileId ?? 'minimal';
        const allowed = new Set(
            resolveToolSet(profileId, {
                allow: selection?.tools,
                deny: selection?.deny,
            }),
        );
        // A tool that is not part of any profile stays unreachable unless the
        // agent explicitly allows it.
        return all.filter((t) => t.enabled && allowed.has(t.name));
    }

    /** OpenAI-style function definitions for the model. */
    definitions(agentId?: string): Array<{
        type: 'function';
        function: { name: string; description: string; parameters: Record<string, unknown> };
    }> {
        return this.list(agentId).map((t) => ({
            type: 'function' as const,
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            },
        }));
    }

    /** Run a tool by its LLM-facing name, dispatching to the owning engine. */
    async invoke(
        agentId: string,
        name: string,
        args: Record<string, unknown> = {},
        link?: Omit<ToolExecutionLink, 'agentId'>,
    ): Promise<string> {
        const tool = this.list(agentId).find((t) => t.name === name);
        if (!tool) {
            throw new Error(`Tool ${name} is not available for agent ${agentId}`);
        }
        if (tool.namespace === 'catalog') {
            const result = await this.deps.toolService?.execute(
                name,
                args,
                undefined,
                link ? { agentId, ...link } : { agentId },
            );
            return stringifyOutput(result);
        }
        const result = await this.deps.toolRunner?.callTool(agentId, name, args, link);
        return typeof result === 'string' ? result : stringifyOutput(result);
    }
}
