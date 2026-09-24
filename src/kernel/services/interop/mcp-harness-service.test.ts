/**
 * McpHarnessService static test (G7) — fake MCPService.
 * Verifies: reconnectAll + proxyTool (connected vs handoff) + health.
 */

import { describe, it, expect } from 'vitest';
import { McpHarnessService } from './mcp-harness-service';

function fakeMcp(servers: Array<{ id: string; status: 'connected'|'disconnected'|'error' }>, opts?: { connectShouldFail?: boolean; callResult?: unknown }) {
    const list = servers.map((s) => ({ ...s, name: s.id, url: 'http://localhost:3001', capabilities: [] as string[] }));
    return {
        getServers: () => list,
        getServer: (id: string) => list.find((s) => s.id === id),
        getConnectionStats: () => ({ total: list.length, connected: list.filter((s) => s.status === 'connected').length, disconnected: list.filter((s) => s.status === 'disconnected').length, error: list.filter((s) => s.status === 'error').length }),
        connect: async (id: string) => {
            if (opts?.connectShouldFail) throw new Error('connect failed');
            const s = list.find((x) => x.id === id);
            if (s) s.status = 'connected';
        },
        reconnectAll: async () => {
            let n = 0;
            for (const s of list) if (s.status !== 'connected') { s.status = 'connected'; n++; }
            return n;
        },
        callTool: async (_id: string, tool: string) => {
            if (tool === 'bad') throw new Error('tool error');
            return opts?.callResult ?? { ok: tool };
        },
    } as unknown as import('../mcp-service').MCPService;
}

function fakeBus() {
    return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
}

describe('G7 McpHarnessService (static)', () => {
    it('reconnectAll', async () => {
        const mcp = fakeMcp([{ id: 's1', status: 'disconnected' }, { id: 's2', status: 'connected' }]);
        const svc = new McpHarnessService({ mcpService: mcp, events: fakeBus() });
        await svc.init();
        const stats = await svc.reconnectAll();
        expect(stats.total).toBe(2);
        expect(stats.reconnected).toBe(1);
        expect(stats.connected).toBe(2);
        await svc.destroy();
    });

    it('proxyTool connected → ok', async () => {
        const mcp = fakeMcp([{ id: 's1', status: 'connected' }], { callResult: { data: 123 } });
        const svc = new McpHarnessService({ mcpService: mcp, events: fakeBus() });
        await svc.init();
        const res = await svc.proxyTool('s1', 'toolA', { x: 1 });
        expect((res as { data: number }).data).toBe(123);
        await svc.destroy();
    });

    it('proxyTool disconnected auto-reconnect then handoff BLOCKED', async () => {
        const mcp = fakeMcp([{ id: 's1', status: 'disconnected' }], { connectShouldFail: true });
        const svc = new McpHarnessService({ mcpService: mcp, events: fakeBus() });
        await svc.init();
        const res = await svc.proxyTool('s1', 'toolA') as { handoff: boolean; reason: string };
        expect(res.handoff).toBe(true);
        expect(res.reason).toContain('BLOCKED-RUNTIME');
        await svc.destroy();
    });

    it('proxyTool bad tool throws', async () => {
        const mcp = fakeMcp([{ id: 's1', status: 'connected' }]);
        const svc = new McpHarnessService({ mcpService: mcp, events: fakeBus() });
        await svc.init();
        await expect(svc.proxyTool('s1', 'bad')).rejects.toThrow(/tool error/);
        const h = await svc.health();
        expect(h.lastError).toContain('tool error');
        await svc.destroy();
    });

    it('health', async () => {
        const mcp = fakeMcp([{ id: 's1', status: 'connected' }]);
        const svc = new McpHarnessService({ mcpService: mcp, events: fakeBus() });
        await svc.init();
        const h = await svc.health();
        expect(h.total).toBe(1);
        expect(h.connected).toBe(1);
        await svc.destroy();
    });
});
