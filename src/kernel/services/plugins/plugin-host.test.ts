import { describe, expect, it, vi } from 'vitest';
import type { PluginManifest } from '../../contracts/plugin';
import { PluginHost } from './plugin-host';

const manifest: PluginManifest = {
    id: 'acme.search',
    name: 'Search',
    version: '1.0.0',
    engines: { os: '4.0.0' },
    contributes: {
        tools: [{ name: 'acme.search', handler: 'search' }],
        subscriptions: [{ event: 'agent:start', handler: 'handlers/onAgentStart.js' }],
    },
};

describe('PluginHost (SPEC_06)', () => {
    it('регистрирует инструменты и вызывает их', async () => {
        const host = new PluginHost();
        const executor = vi.fn(
            async (_name: string, args: Record<string, unknown>) => `found ${args.q}`,
        );
        host.registerTools(manifest, executor);

        expect(host.hasTool('acme.search')).toBe(true);
        expect(host.listTools()).toHaveLength(1);

        const out = await host.callTool('acme.search', { q: 'x' });
        expect(out).toBe('found x');
        expect(executor).toHaveBeenCalledWith('acme.search', { q: 'x' });
    });

    it('без executor возвращает заглушку', async () => {
        const host = new PluginHost();
        host.registerTools(manifest);
        expect(await host.callTool('acme.search', {})).toContain('no executor');
    });

    it('неизвестный инструмент бросает', async () => {
        const host = new PluginHost();
        await expect(host.callTool('nope', {})).rejects.toThrow(/not found/);
    });

    it('unregisterTools удаляет инструменты плагина', () => {
        const host = new PluginHost();
        host.registerTools(manifest);
        host.unregisterTools('acme.search');
        expect(host.hasTool('acme.search')).toBe(false);
    });

    it('getTool возвращает порт ToolService', async () => {
        const host = new PluginHost();
        const executor = vi.fn(
            async (_name: string, args: Record<string, unknown>) => `found ${args.q}`,
        );
        host.registerTools(manifest, executor);

        const port = host.getTool('acme.search');
        expect(port).toBeDefined();
        expect(await port!.execute({ q: 'x' }, {})).toBe('found x');
        expect(executor).toHaveBeenCalledWith('acme.search', { q: 'x' });
    });

    it('getTool возвращает undefined для неизвестного/без executor', () => {
        const host = new PluginHost();
        expect(host.getTool('nope')).toBeUndefined();
        host.registerTools(manifest);
        expect(host.getTool('acme.search')).toBeUndefined();
    });

    it('getToolContext возвращает переданный контекст', () => {
        const host = new PluginHost();
        const ctx = { apiKey: 'k' };
        host.registerTools(manifest, undefined, ctx);
        expect(host.getToolContext('acme.search')).toBe(ctx);
        expect(host.getToolContext('nope')).toBeUndefined();
    });

    it('toRegistryPort делегирует в getTool/getToolContext', async () => {
        const host = new PluginHost();
        const executor = vi.fn(async () => 'ok');
        host.registerTools(manifest, executor);
        const port = host.toRegistryPort();
        expect(port.getTool('acme.search')).toBeDefined();
        expect(port.getTool('nope')).toBeUndefined();
        expect(port.getToolContext('acme.search')).toBeUndefined();
    });

    it('registerSubscriptions подписывается и вызывает handler', () => {
        const handlers = new Map<string, (data: unknown) => void>();
        const bus = {
            on: vi.fn((event: string, cb: (data: unknown) => void) => {
                handlers.set(event, cb);
                return () => handlers.delete(event);
            }),
        };
        const host = new PluginHost(bus);
        const handler = vi.fn();
        host.registerSubscriptions(manifest, handler);

        expect(bus.on).toHaveBeenCalledWith('agent:start', expect.any(Function));
        handlers.get('agent:start')!({ runId: 'r1' });
        expect(handler).toHaveBeenCalledWith('agent:start', { runId: 'r1' });
    });

    it('unregisterSubscriptions снимает подписки', () => {
        const unsubs: Array<() => void> = [];
        const bus = {
            on: vi.fn(() => {
                const unsub = vi.fn();
                unsubs.push(unsub);
                return unsub;
            }),
        };
        const host = new PluginHost(bus);
        host.registerSubscriptions(manifest);
        expect(unsubs).toHaveLength(1);
        host.unregisterSubscriptions('acme.search');
        expect(unsubs[0]).toHaveBeenCalled();
    });

    it('unregisterAll снимает инструменты и подписки', () => {
        const bus = { on: vi.fn(() => vi.fn()) };
        const host = new PluginHost(bus);
        host.registerTools(manifest);
        host.registerSubscriptions(manifest);
        host.unregisterAll('acme.search');
        expect(host.hasTool('acme.search')).toBe(false);
        expect(host.listTools()).toHaveLength(0);
    });

    it('registerTools не перезаписывает инструмент другого плагина', () => {
        const host = new PluginHost();
        const other: PluginManifest = {
            id: 'other.tools',
            name: 'Other',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: { tools: [{ name: 'acme.search', handler: 'x' }] },
        };
        host.registerTools(manifest);
        const conflicts = host.registerTools(other);
        expect(conflicts).toEqual(['acme.search']);
        expect(host.getToolContext('acme.search')).toBeUndefined();
        expect(host.listTools()[0].manifestId).toBe('acme.search');
    });

    it('registerMcpServers регистрирует локальные MCP-серверы', async () => {
        const registered: Array<{
            id: string;
            handle: (m: string, p?: unknown) => Promise<unknown>;
        }> = [];
        const mcp = {
            registerLocalServer: vi.fn(
                (
                    id: string,
                    _name: string,
                    handle: (m: string, p?: unknown) => Promise<unknown>,
                ) => {
                    registered.push({ id, handle });
                },
            ),
            unregisterLocalServer: vi.fn(),
            isLocalServer: vi.fn((id: string) => registered.some((r) => r.id === id)),
        };
        const mcpManifest: PluginManifest = {
            id: 'acme.mcp',
            name: 'Mcp',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: {
                tools: [{ name: 'acme.search' }],
                mcpServers: [{ name: 'demo-mcp' }],
            },
        };
        const host = new PluginHost(undefined, mcp);
        host.registerTools(mcpManifest);
        host.registerMcpServers(mcpManifest);
        expect(mcp.registerLocalServer).toHaveBeenCalled();
        expect(registered[0].id).toBe('plugin:acme.mcp:demo-mcp');
        const tools = (await registered[0].handle('tools/list')) as { tools: { name: string }[] };
        expect(tools.tools).toContainEqual({ name: 'acme.search' });
    });

    it('unregisterMcpServers снимает серверы плагина', () => {
        const mcp = {
            registerLocalServer: vi.fn(),
            unregisterLocalServer: vi.fn(),
            isLocalServer: vi.fn(() => false),
        };
        const mcpManifest: PluginManifest = {
            id: 'acme.mcp',
            name: 'Mcp',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: { mcpServers: [{ name: 'demo-mcp' }] },
        };
        const host = new PluginHost(undefined, mcp);
        host.registerMcpServers(mcpManifest);
        host.unregisterMcpServers('acme.mcp');
        expect(mcp.unregisterLocalServer).toHaveBeenCalled();
    });

    it('registerServices/callService работают', async () => {
        const host = new PluginHost();
        const svcManifest: PluginManifest = {
            id: 'acme.svc',
            name: 'Svc',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: { services: [{ id: 'search-provider' }] },
        };
        const handle = vi.fn(
            async (_method: string, params?: unknown) => `svc:${JSON.stringify(params)}`,
        );
        host.registerServices(svcManifest, { 'search-provider': handle });
        expect(host.listServices('acme.svc')).toEqual(['search-provider']);
        expect(await host.callService('search-provider', 'query', { q: 'x' })).toBe(
            'svc:{"q":"x"}',
        );
        expect(handle).toHaveBeenCalledWith('query', { q: 'x' });
    });

    it('callService бросает для неизвестного сервиса', async () => {
        const host = new PluginHost();
        await expect(host.callService('nope', 'x')).rejects.toThrow(/not found/);
    });

    it('unregisterServices снимает сервисы плагина', () => {
        const host = new PluginHost();
        const svcManifest: PluginManifest = {
            id: 'acme.svc',
            name: 'Svc',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: { services: [{ id: 'search-provider' }] },
        };
        host.registerServices(svcManifest);
        expect(host.listServices('acme.svc')).toHaveLength(1);
        host.unregisterServices('acme.svc');
        expect(host.listServices('acme.svc')).toHaveLength(0);
    });

    describe('panels (P3-1)', () => {
        const panelsManifest: PluginManifest = {
            id: 'acme.panels',
            name: 'Panels',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: {
                panels: [
                    {
                        id: 'acme.dashboard',
                        titleKey: 'acme.dashboard.title',
                        entry: 'panels/dashboard.html',
                    },
                    { id: 'acme.report', entry: 'panels/report.html' },
                ],
            },
        };

        it('registers and lists contributed panels', () => {
            const host = new PluginHost();
            expect(host.registerPanels(panelsManifest)).toEqual([]);
            expect(host.listPanels()).toHaveLength(2);
            expect(host.hasPanel('acme.dashboard')).toBe(true);
            const panel = host.getPanel('acme.dashboard');
            expect(panel?.manifestId).toBe('acme.panels');
            expect(panel?.entry).toBe('panels/dashboard.html');
            expect(panel?.titleKey).toBe('acme.dashboard.title');
        });

        it('reports conflicts when an id is already taken by another plugin', () => {
            const host = new PluginHost();
            host.registerPanels(panelsManifest);
            const other: PluginManifest = {
                id: 'other.panels',
                name: 'Other',
                version: '1.0.0',
                engines: { os: '4.0.0' },
                contributes: { panels: [{ id: 'acme.dashboard', entry: 'x.html' }] },
            };
            expect(host.registerPanels(other)).toEqual(['acme.dashboard']);
            // First owner keeps the panel.
            expect(host.getPanel('acme.dashboard')?.manifestId).toBe('acme.panels');
        });

        it('unregisters panels on plugin cleanup', () => {
            const host = new PluginHost();
            host.registerPanels(panelsManifest);
            host.unregisterPanels('acme.panels');
            expect(host.listPanels()).toHaveLength(0);
            host.registerPanels(panelsManifest);
            host.unregisterAll('acme.panels');
            expect(host.listPanels()).toHaveLength(0);
        });
    });
});
