/**
 * ToolCatalogService static test (G2) — no network, no Dexie.
 * Verifies: unified list (runner ∪ skillMarket ∪ mcp), search, groups, install/uninstall, fallback.
 */

import { describe, it, expect } from 'vitest';
import { ToolCatalogService } from './tool-catalog-service';

function fakeRunner(tools: Array<{ name: string; description: string }>) {
    return {
        listTools: () => tools,
    } as unknown as import('../../contracts/parity').IToolRunnerService;
}

function fakeSkillMarket(manifests: Array<{ id: string; name: string; description: string; installed: boolean }>) {
    let store = [...manifests];
    return {
        list: async () => store,
        install: async (id: string) => {
            store = store.map((m) => (m.id === id ? { ...m, installed: true } : m));
            return store.find((m) => m.id === id)! as unknown as import('../../types/ops-types').SkillManifest;
        },
        uninstall: async (id: string) => {
            store = store.map((m) => (m.id === id ? { ...m, installed: false } : m));
            return store.find((m) => m.id === id)! as unknown as import('../../types/ops-types').SkillManifest;
        },
    } as unknown as import('../../contracts/ops').ISkillMarketService;
}

function fakeBus() {
    return { emit: () => {}, on: () => () => {}, off: () => {} } as unknown as import('../../types/interfaces').IEventBus;
}

describe('G2 ToolCatalogService (static)', () => {
    it('list = runner ∪ platform ∪ mcp, groups', async () => {
        const runner = fakeRunner([
            { name: 'workspace.list', description: 'List files' },
            { name: 'math.calc', description: 'Calc' },
            { name: 'knowledge.search', description: 'RAG' },
        ]);
        const skillMarket = fakeSkillMarket([
            { id: 'sk1', name: 'yadisk.read', description: 'Yandex Disk', installed: false },
            { id: 'sk2', name: 'wb.price', description: 'WB', installed: true },
        ]);
        const mcp = { listServers: async () => [{ id: 'srv1', tools: ['toolA', 'toolB'] }] };
        const svc = new ToolCatalogService({ toolRunner: runner, skillMarket, mcp, events: fakeBus() });
        await svc.init();
        const all = await svc.list();
        expect(all.length).toBe(3 + 2 + 2); // 7
        expect(all.some((e) => e.name === 'workspace.list' && e.group === 'workspace')).toBe(true);
        expect(all.some((e) => e.name === 'skill:yadisk.read' && e.group === 'platform')).toBe(true);
        expect(all.some((e) => e.name === 'mcp:srv1:toolA')).toBe(true);
        const groups = await svc.groups();
        expect(groups.workspace).toBe(1);
        expect(groups.core).toBe(1);
        expect(groups.platform).toBe(2);
        expect(groups.mcp).toBe(2);
        await svc.destroy();
    });

    it('search by name/description, get', async () => {
        const svc = new ToolCatalogService({
            toolRunner: fakeRunner([{ name: 'http.fetch', description: 'Fetch URL' }]),
            events: fakeBus(),
        });
        await svc.init();
        expect((await svc.search('fetch')).length).toBe(1);
        expect((await svc.search('FETCH')).length).toBe(1); // case-insensitive
        expect(await svc.get('http.fetch')).not.toBeNull();
        expect(await svc.get('unknown')).toBeNull();
        await svc.destroy();
    });

    it('install/uninstall platform skill delegates to SkillMarket', async () => {
        const skillMarket = fakeSkillMarket([{ id: 'sk1', name: 'yadisk.read', description: 'Yandex', installed: false }]);
        const svc = new ToolCatalogService({
            toolRunner: fakeRunner([]),
            skillMarket,
            events: fakeBus(),
        });
        await svc.init();
        const before = await svc.get('skill:yadisk.read');
        expect(before!.installed).toBe(false);
        await svc.install('skill:yadisk.read');
        const after = await svc.get('skill:yadisk.read');
        expect(after!.installed).toBe(true);
        await svc.uninstall('skill:yadisk.read');
        let off = await svc.get('skill:yadisk.read');
        expect(off!.installed).toBe(false);
        await svc.destroy();
    });

    it('fallback: no skillMarket/mcp → runner only', async () => {
        const svc = new ToolCatalogService({
            toolRunner: fakeRunner([{ name: 'time.now', description: 'Now' }]),
            events: fakeBus(),
        });
        await svc.init();
        const all = await svc.list();
        expect(all.length).toBe(1);
        expect(all[0]!.name).toBe('time.now');
        await svc.destroy();
    });
});
