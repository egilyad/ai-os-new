import { describe, expect, it, vi } from 'vitest';
import type { IPluginRegistry, PluginManifest, RegisteredPlugin } from '../../contracts/plugin';
import { PluginLoader } from './plugin-loader';

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

function fakeHost(overrides: Partial<Parameters<typeof makeHost>[0]> = {}) {
    return makeHost(overrides);
}

function makeHost(
    overrides: {
        registerTools?: ReturnType<typeof vi.fn>;
        unregisterTools?: ReturnType<typeof vi.fn>;
        registerSubscriptions?: ReturnType<typeof vi.fn>;
        registerMcpServers?: ReturnType<typeof vi.fn>;
        unregisterAll?: ReturnType<typeof vi.fn>;
    } = {},
) {
    return {
        registerTools: overrides.registerTools ?? vi.fn(),
        unregisterTools: overrides.unregisterTools ?? vi.fn(),
        registerSubscriptions: overrides.registerSubscriptions ?? vi.fn(),
        registerMcpServers: overrides.registerMcpServers ?? vi.fn(),
        unregisterAll: overrides.unregisterAll ?? vi.fn(),
    };
}

function fakeRegistry(): IPluginRegistry {
    const map = new Map<string, RegisteredPlugin>();
    return {
        register: vi.fn(async (m) => {
            map.set(m.id, { manifest: m, status: 'inactive' });
            return true;
        }),
        unregister: vi.fn(async (id) => map.delete(id)),
        activate: vi.fn(async (id) => {
            const p = map.get(id);
            if (p) p.status = 'active';
            return !!p;
        }),
        deactivate: vi.fn(async (id) => {
            const p = map.get(id);
            if (p) p.status = 'inactive';
            return !!p;
        }),
        get: vi.fn((id) => map.get(id)),
        list: vi.fn(() => [...map.values()]),
        has: vi.fn((id) => map.has(id)),
    };
}

describe('PluginLoader (SPEC_06)', () => {
    it('load регистрирует в реестре, подключает инструменты и подписки', async () => {
        const registry = fakeRegistry();
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host });
        const executor = vi.fn(async () => 'ok');
        const eventHandler = vi.fn();

        const ok = await loader.load(manifest, executor, { apiKey: 'k' }, eventHandler);
        expect(ok).toBe(true);
        expect(registry.register).toHaveBeenCalledWith(manifest);
        expect(registry.activate).toHaveBeenCalledWith('acme.search');
        expect(host.registerTools).toHaveBeenCalledWith(manifest, executor, { apiKey: 'k' });
        expect(host.registerSubscriptions).toHaveBeenCalledWith(manifest, eventHandler);
        expect(host.registerMcpServers).toHaveBeenCalledWith(manifest);
    });

    it('load отклоняет невалидный манифест', async () => {
        const registry = fakeRegistry();
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host });
        const bad = { ...manifest, engines: { os: 'not-semver' } } as unknown as PluginManifest;
        const ok = await loader.load(bad);
        expect(ok).toBe(false);
        expect(registry.register).not.toHaveBeenCalled();
        expect(host.registerTools).not.toHaveBeenCalled();
    });

    it('unload снимает инструменты/подписки и дерегистрирует', async () => {
        const registry = fakeRegistry();
        await registry.register(manifest);
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host });
        const ok = await loader.unload('acme.search');
        expect(ok).toBe(true);
        expect(host.unregisterAll).toHaveBeenCalledWith('acme.search');
        expect(registry.unregister).toHaveBeenCalledWith('acme.search');
    });

    it('reload пере-подключает плагин', async () => {
        const registry = fakeRegistry();
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host });
        const ok = await loader.reload(
            manifest,
            vi.fn(async () => 'ok'),
            undefined,
            vi.fn(),
        );
        expect(ok).toBe(true);
        expect(host.unregisterAll).toHaveBeenCalledWith('acme.search');
        expect(host.registerTools).toHaveBeenCalled();
    });

    it('enforceToolPermissions отклоняет инструменты без permissions', async () => {
        const registry = fakeRegistry();
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host, enforceToolPermissions: true });
        const ok = await loader.load(manifest);
        expect(ok).toBe(false);
        expect(registry.register).not.toHaveBeenCalled();
        expect(host.registerTools).not.toHaveBeenCalled();
    });

    it('enforceToolPermissions пропускает плагин с tool:* permission', async () => {
        const registry = fakeRegistry();
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host, enforceToolPermissions: true });
        const permitted = { ...manifest, permissions: ['tool:*'] };
        const ok = await loader.load(permitted);
        expect(ok).toBe(true);
        expect(registry.register).toHaveBeenCalledWith(permitted);
    });

    it('enforceToolPermissions пропускает плагин с конкретной tool permission', async () => {
        const registry = fakeRegistry();
        const host = fakeHost();
        const loader = new PluginLoader({ registry, host, enforceToolPermissions: true });
        const permitted = { ...manifest, permissions: ['tool:acme.search'] };
        const ok = await loader.load(permitted);
        expect(ok).toBe(true);
    });
});
