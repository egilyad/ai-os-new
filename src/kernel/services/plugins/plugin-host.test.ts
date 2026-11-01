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
});
