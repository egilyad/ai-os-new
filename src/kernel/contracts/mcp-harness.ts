/**
 * MCP Harness contracts — GAP G7 (STATIC GAP CLOSURE).
 *
 * Hardening over MCPService + McpDeepService: auto-reconnect with backoff,
 * tool proxy with validation, health check. Real servers = BLOCKED-RUNTIME if none connected.
 */

import type { ILifecycle } from './lifecycle';

export interface McpHarnessStats {
    total: number;
    connected: number;
    reconnected: number;
    failed: number;
}

export interface IMcpHarnessService extends ILifecycle {
    /** Reconnect disconnected/error servers with exponential backoff (reuses MCPService.reconnectAll). */
    reconnectAll(): Promise<McpHarnessStats>;
    /** Proxy tool call with validation + sanitization (delegates to MCPService.callTool). */
    proxyTool(serverId: string, tool: string, args?: Record<string, unknown>): Promise<unknown>;
    /** Health check: connected vs total, last error. */
    health(): Promise<McpHarnessStats & { lastError?: string }>;
}
