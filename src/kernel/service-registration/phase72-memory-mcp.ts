/**
 * Phase 72 — built-in MCP memory server.
 *
 * Registers (additive, no migration):
 *   - memoryMcpServer (JSON-RPC handler over memoryService/ltMemoryService)
 *
 * The factory attaches the server to MCPService as an in-process local server
 * (memory:// URI, never persisted): `initialize`, `resources/*`, `tools/*` are
 * served without a network endpoint. Listed in INIT_TIERS so boot resolves it.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { MCPService } from '../services/mcp-service';
import type { IMemoryEngine } from '../contracts/memory';
import type { ILtMemoryService } from '../contracts/persona';
import {
    MemoryMcpServer,
    MEMORY_MCP_SERVER_ID,
    MEMORY_MCP_SERVER_NAME,
} from '../services/memory/memory-mcp-server';

export const registerPhase72: Phase = ({ register }) => {
    register('memoryMcpServer', (c: IContainer) => {
        const server = new MemoryMcpServer({
            memoryService: c.get<IMemoryEngine>('memoryService'),
            ltMemoryService: c.has('ltMemoryService')
                ? c.get<ILtMemoryService>('ltMemoryService')
                : undefined,
        });
        const mcp = c.get<MCPService>('mcpService');
        mcp.registerLocalServer(MEMORY_MCP_SERVER_ID, MEMORY_MCP_SERVER_NAME, (method, params) =>
            server.handle(method, params),
        );
        return server;
    });
};
