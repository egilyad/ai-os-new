/**
 * Phase 72 registration test — built-in MCP memory server attached to MCPService.
 */
import { describe, it, expect, vi } from 'vitest';
import { registerPhase72 } from './phase72-memory-mcp';
import { MCPService } from '../services/mcp-service';
import { MEMORY_MCP_SERVER_ID } from '../services/memory/memory-mcp-server';

async function boot() {
    const factories = new Map<string, (c: unknown) => unknown>();
    const mcp = new MCPService({
        eventBus: { emit: vi.fn() },
        database: { getKv: async () => null, setKv: async () => {} },
    } as never);
    await mcp.init();

    const c = {
        has: (name: string) =>
            name === 'memoryService' || name === 'mcpService' || factories.has(name),
        get: (name: string) => {
            if (name === 'memoryService') return {} as never;
            if (name === 'mcpService') return mcp;
            const f = factories.get(name);
            if (!f) throw new Error(`not registered: ${name}`);
            return f(c);
        },
        registerFactory: (name: string, f: (cc: never) => unknown) => {
            factories.set(name, f as (c: unknown) => unknown);
        },
    };

    registerPhase72(
        {
            register: (name: string, f: (cc: never) => unknown) => c.registerFactory(name, f),
            get: <T,>(name: string): T => c.get(name) as T,
            asDeps: <T,>(v: unknown) => v as T,
        },
        { container: c, eventBus: { emit: vi.fn() } as never, registerWithLifecycle: () => {} } as never,
    );

    // Триггерим lazy-фабрику (boot резолвит сервисы тиров).
    c.get('memoryMcpServer');
    return { mcp };
}

describe('phase72-memory-mcp', () => {
    it('attaches the built-in memory server to MCPService', async () => {
        const { mcp } = await boot();
        expect(mcp.isLocalServer(MEMORY_MCP_SERVER_ID)).toBe(true);
        expect(mcp.getServer(MEMORY_MCP_SERVER_ID)?.status).toBe('connected');
        expect(mcp.getConnectedServers().map((s) => s.id)).toContain(MEMORY_MCP_SERVER_ID);
    });

    it('exposes memory tools through MCPService', async () => {
        const { mcp } = await boot();
        const tools = await mcp.listTools(MEMORY_MCP_SERVER_ID);
        const names = tools.map((t) => t.name);
        expect(names).toContain('memory.search');
        expect(names).toContain('memory.store');
    });
});
