/**
 * MCPService built-in (local) server routing — in-process JSON-RPC, no network.
 */
import { describe, it, expect, vi } from 'vitest';
import { MCPService } from './mcp-service';

function makeService() {
    const svc = new MCPService({
        eventBus: { emit: vi.fn() },
        database: {
            getKv: async () => null,
            setKv: async () => {},
        },
    } as never);
    return svc;
}

function makeHandler() {
    return vi.fn(async (method: string) => {
        switch (method) {
            case 'initialize':
                return { capabilities: { tools: {} } };
            case 'tools/list':
                return { tools: [{ name: 'memory.stats' }] };
            case 'resources/read':
                return { contents: [{ text: 'ok' }] };
            default:
                return null;
        }
    });
}

describe('MCPService local servers', () => {
    it('registers a built-in server as connected without HTTP', async () => {
        const svc = makeService();
        await svc.init();
        svc.registerLocalServer('mcp-memory', 'Memory (built-in)', makeHandler());

        const server = svc.getServer('mcp-memory');
        expect(server?.status).toBe('connected');
        expect(svc.isLocalServer('mcp-memory')).toBe(true);
        expect(svc.getConnectedServers().map((s) => s.id)).toContain('mcp-memory');
        expect(svc.getConnectionStats().connected).toBeGreaterThanOrEqual(1);
    });

    it('routes listTools/readResource through the local handler', async () => {
        const svc = makeService();
        await svc.init();
        const handler = makeHandler();
        svc.registerLocalServer('mcp-memory', 'Memory (built-in)', handler);

        await svc.connect('mcp-memory');
        const tools = await svc.listTools('mcp-memory');
        expect(tools.map((t) => t.name)).toEqual(['memory.stats']);

        const text = await svc.readResource('memory://stats');
        expect(text).toBe('ok');
        expect(handler).toHaveBeenCalledWith('resources/read', { uri: 'memory://stats' });
    });

    it('unregisters a local server', async () => {
        const svc = makeService();
        await svc.init();
        svc.registerLocalServer('mcp-memory', 'Memory (built-in)', makeHandler());
        svc.unregisterLocalServer('mcp-memory');
        expect(svc.getServer('mcp-memory')).toBeUndefined();
        expect(svc.isLocalServer('mcp-memory')).toBe(false);
    });
});
