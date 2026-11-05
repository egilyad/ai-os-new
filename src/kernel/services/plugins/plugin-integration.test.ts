import { describe, expect, it, vi } from 'vitest';
import type { PluginManifest } from '../../contracts/plugin';
import { PluginRegistry, type RegisteredRegistryStore } from './plugin-registry';
import { PluginHost, type PluginEventBusPort } from './plugin-host';
import { PluginLoader } from './plugin-loader';

const manifest: PluginManifest = {
    id: 'acme.integration',
    name: 'Integration',
    version: '1.0.0',
    engines: { os: '4.0.0' },
    contributes: {
        tools: [{ name: 'acme.search' }],
        subscriptions: [{ event: 'agent:start' }],
        mcpServers: [{ name: 'demo-mcp' }],
    },
    permissions: ['tool:acme.search'],
};

describe('Plugin integration (SPEC_06)', () => {
    it('полный жизненный цикл: load → call tool → unload', async () => {
        const store = new Map<string, string>();
        const mcp = {
            registerLocalServer: vi.fn(),
            unregisterLocalServer: vi.fn(),
            isLocalServer: () => false,
        };
        const bus = {
            on: vi.fn(() => vi.fn()),
            emit: vi.fn(),
            off: vi.fn(),
            onSafe: vi.fn(() => vi.fn()),
            emitOnce: vi.fn(),
            subscribeAll: vi.fn(),
            getSubscriptionStats: vi.fn(() => ({})),
        } as unknown as PluginEventBusPort;

        const memoryStore = {
            get: vi.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
            set: vi.fn(async (key: string, value: string) => void store.set(key, value)),
            delete: vi.fn(async (key: string) => void store.delete(key)),
        } as RegisteredRegistryStore;

        const registry = new PluginRegistry({ store: memoryStore, bus });
        const host = new PluginHost(bus, mcp);
        const loader = new PluginLoader({ registry, host });

        const executor = vi.fn(
            async (_name: string, args: Record<string, unknown>) => `found ${args.q}`,
        );

        // load
        expect(await loader.load(manifest, executor)).toBe(true);
        expect(registry.get('acme.integration')?.status).toBe('active');
        expect(host.hasTool('acme.search')).toBe(true);
        expect(mcp.registerLocalServer).toHaveBeenCalled();

        // call через порт ToolService
        const port = host.toRegistryPort();
        expect(await port.getTool('acme.search')!.execute({ q: 'x' }, {})).toBe('found x');

        // persist произошёл
        expect(memoryStore.set).toHaveBeenCalled();

        // hydrate в новый реестр
        const registry2 = new PluginRegistry({ store: memoryStore, bus });
        expect(registry2.has('acme.integration')).toBe(false);
        expect(await registry2.hydrate()).toBe(1);
        expect(registry2.has('acme.integration')).toBe(true);

        // unload
        expect(await loader.unload('acme.integration')).toBe(true);
        expect(host.hasTool('acme.search')).toBe(false);
        expect(mcp.unregisterLocalServer).toHaveBeenCalled();
    });
});
