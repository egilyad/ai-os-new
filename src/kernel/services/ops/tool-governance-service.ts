/**
 * ToolGovernanceService — Wave 5.2 (MCP as the tool standard + policy + audit).
 *
 * Registry of MCP servers and per-agent allow/deny grants. `check()` is the
 * single policy gate tool executors should call. No network — execution stays
 * in MCPService; this service owns GOVERNANCE ONLY.
 */
import type { IEventBus } from '../../types/interfaces';
import type { OpsRepository } from '../../dal/ops-repository';
import type { IAuditService, IToolGovernanceService } from '../../contracts/ops';
import type { McpServer, ToolGrant } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ToolGovernance');

function now(): number {
    return Date.now();
}

function patternMatches(pattern: string, tool: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith(':*')) return tool.startsWith(pattern.slice(0, -1));
    return pattern === tool;
}

export class ToolGovernanceService implements IToolGovernanceService {
    constructor(
        private repo: OpsRepository,
        private events: IEventBus,
        private audit: IAuditService,
    ) {
        void this.events;
    }

    async init(): Promise<void> {
        LOGGER.info('ToolGovernance', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async registerServer(input: { name: string; url: string; tools?: string[] }): Promise<McpServer> {
        const t = now();
        const server: McpServer = {
            id: genId('mcp'),
            name: input.name,
            url: input.url,
            tools: input.tools ? [...input.tools] : [],
            enabled: true,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putServer(server);
        await this.audit.append('tools', 'mcp.registered', server.id, `${server.name} ${server.url}`);
        return server;
    }

    async listServers(): Promise<McpServer[]> {
        return this.repo.listServers();
    }

    async setServerEnabled(id: string, enabled: boolean): Promise<McpServer> {
        const s = await this.repo.getServer(id);
        if (!s) throw new Error(`MCP server not found: ${id}`);
        s.enabled = enabled;
        s.updatedAt = now();
        await this.repo.putServer(s);
        await this.audit.append('tools', enabled ? 'mcp.enabled' : 'mcp.disabled', id, s.name);
        return s;
    }

    async grant(agentId: string, pattern: string, allow = true): Promise<ToolGrant> {
        const grant: ToolGrant = { id: genId('grant'), agentId, pattern, allow, createdAt: now() };
        await this.repo.putGrant(grant);
        await this.audit.append('tools', allow ? 'grant.allowed' : 'grant.denied', agentId, pattern);
        return grant;
    }

    async check(agentId: string, tool: string): Promise<boolean> {
        // Disabled server => deny everything under it.
        const serverId = tool.split(':')[0] ?? '';
        const servers = await this.repo.listServers();
        const server = servers.find((s) => s.id === serverId || s.name === serverId);
        if (server && !server.enabled) return false;
        // Explicit denies win over allows; default-deny when no grant matches.
        const grants = (await this.repo.listGrants()).filter((g) => g.agentId === agentId);
        let allowed = false;
        for (const g of grants) {
            if (patternMatches(g.pattern, tool)) {
                if (!g.allow) return false;
                allowed = true;
            }
        }
        return allowed;
    }

    async listGrants(agentId?: string): Promise<ToolGrant[]> {
        const all = await this.repo.listGrants();
        if (!agentId) return all;
        return all.filter((g) => g.agentId === agentId);
    }
}
