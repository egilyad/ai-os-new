/**
 * McpHarnessService — G7 (STATIC GAP CLOSURE).
 *
 * Hardening over MCPService: reconnectAll + proxyTool + health.
 * Additive — MCPService untouched. Stores last error in memory for health.
 * Real servers = BLOCKED-RUNTIME if none connected (returns empty / handoff).
 */

import type { IMcpHarnessService, McpHarnessStats } from '../../contracts/mcp-harness';
import type { MCPService } from '../mcp-service';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('McpHarness');

export class McpHarnessService implements IMcpHarnessService {
    private lastError?: string;

    constructor(private deps: { mcpService: MCPService; events: IEventBus }) {}

    async init(): Promise<void> {
        LOGGER.info('McpHarness', 'init', {});
    }

    async destroy(): Promise<void> {}

    async reconnectAll(): Promise<McpHarnessStats> {
        const stats = this.deps.mcpService.getConnectionStats();
        let reconnected = 0;
        let failed = 0;
        try {
            reconnected = await this.deps.mcpService.reconnectAll();
            failed = stats.total - stats.connected - reconnected;
        } catch (e) {
            this.lastError = e instanceof Error ? e.message : String(e);
            LOGGER.warn('McpHarness', 'reconnectAll failed', { error: this.lastError });
            failed = stats.total - stats.connected;
        }
        const out: McpHarnessStats = { total: stats.total, connected: stats.connected + reconnected, reconnected, failed };
        try {
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).MCP_HARNESS_RECONNECTED ?? ('mcp:harness:reconnected' as unknown as string),
                out,
            );
        } catch { /* ignore */ }
        return out;
    }

    async proxyTool(serverId: string, tool: string, args?: Record<string, unknown>): Promise<unknown> {
        if (!serverId || !tool) throw new Error('proxyTool: serverId and tool required');
        const server = this.deps.mcpService.getServer(serverId);
        if (!server) throw new Error(`MCP server not found: ${serverId}`);
        if (server.status !== 'connected') {
            // Auto-reconnect best-effort before proxy
            try {
                await this.deps.mcpService.connect(serverId);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this.lastError = msg;
                LOGGER.warn('McpHarness', 'proxyTool auto-reconnect failed, handoff', { serverId, error: msg });
                // BLOCKED-RUNTIME handoff — no server live
                return { handoff: true, serverId, tool, reason: `no connected MCP server ${serverId} (${msg}) — BLOCKED-RUNTIME` };
            }
        }
        try {
            const result = await this.deps.mcpService.callTool(serverId, tool, args);
            try {
                (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                    (EVENTS as unknown as Record<string, string>).MCP_HARNESS_PROXY ?? ('mcp:harness:proxy' as unknown as string),
                    { serverId, tool, ok: true },
                );
            } catch { /* ignore */ }
            return result;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.lastError = msg;
            try {
                (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                    (EVENTS as unknown as Record<string, string>).MCP_HARNESS_PROXY ?? ('mcp:harness:proxy' as unknown as string),
                    { serverId, tool, ok: false, error: msg },
                );
            } catch { /* ignore */ }
            throw e;
        }
    }

    async health(): Promise<McpHarnessStats & { lastError?: string }> {
        const s = this.deps.mcpService.getConnectionStats();
        return { total: s.total, connected: s.connected, reconnected: 0, failed: s.error, lastError: this.lastError };
    }
}
