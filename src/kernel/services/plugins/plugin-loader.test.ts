import { describe, expect, it, vi } from 'vitest';
import type { IPluginRegistry, PluginManifest, RegisteredPlugin } from '../../contracts/plugin';
import { PluginLoader } from './plugin-loader';

const manifest: PluginManifest = {
    id: 'acme.search',
    name: 'Search',
    version: '1.0.0',
    engines: { os: '4.0.0' },
    contributes: { tools: [{ name: 'acme.search', handler: 'search' }] },
};

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
    it('load регистрирует в реестре и подключает инструменты в хост', async () => {
        const registry = fakeRegistry();
        const registerTools = vi.fn();
        const host = { registerTools, unregisterTools: vi.fn() };
        const loader = new PluginLoader({ registry, host });
        const executor = vi.fn(async () => 'ok');

        const ok = await loader.load(manifest, executor, { apiKey: 'k' });
        expect(ok).toBe(true);
        expect(registry.register).toHaveBeenCalledWith(manifest);
        expect(registry.activate).toHaveBeenCalledWith('acme.search');
        expect(registerTools).toHaveBeenCalledWith(manifest, executor, { apiKey: 'k' });
    });

    it('load отклоняет невалидный манифест', async () => {
        const registry = fakeRegistry();
        const loader = new PluginLoader({
            registry,
            host: { registerTools: vi.fn(), unregisterTools: vi.fn() },
        });
        const bad = { ...manifest, engines: { os: 'not-semver' } } as unknown as PluginManifest;
        const ok = await loader.load(bad);
        expect(ok).toBe(false);
        expect(registry.register).not.toHaveBeenCalled();
    });

    it('unload снимает инструменты и дерегистрирует', async () => {
        const registry = fakeRegistry();
        await registry.register(manifest);
        const unregisterTools = vi.fn();
        const loader = new PluginLoader({
            registry,
            host: { registerTools: vi.fn(), unregisterTools },
        });
        const ok = await loader.unload('acme.search');
        expect(ok).toBe(true);
        expect(unregisterTools).toHaveBeenCalledWith('acme.search');
        expect(registry.unregister).toHaveBeenCalledWith('acme.search');
    });

    it('reload пере-подключает плагин', async () => {
        const registry = fakeRegistry();
        const unregisterTools = vi.fn();
        const registerTools = vi.fn();
        const loader = new PluginLoader({ registry, host: { registerTools, unregisterTools } });
        const ok = await loader.reload(
            manifest,
            vi.fn(async () => 'ok'),
        );
        expect(ok).toBe(true);
        expect(unregisterTools).toHaveBeenCalledWith('acme.search');
        expect(registerTools).toHaveBeenCalled();
    });
});
