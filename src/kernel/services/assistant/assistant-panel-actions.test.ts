import { describe, expect, it, vi } from 'vitest';
import { AssistantActionRegistry } from './assistant-action-registry';
import { PanelActionRegistry } from './panel-action-registry';
import { createPanelActions } from './assistant-panel-actions';
import type { PanelActionDescriptor } from '../../contracts/panel-actions';

function descriptor(
    over: Partial<PanelActionDescriptor> & Pick<PanelActionDescriptor, 'panelId' | 'id'>,
): PanelActionDescriptor {
    return {
        title: 'x',
        description: 'x',
        permission: 'tool:read',
        run: async () => ({ ok: true, detail: 'read', evidence: 'e' }),
        ...over,
    };
}

function registryWith(
    descriptors: PanelActionDescriptor[],
    knowledge?: { panelsMatching(query?: string): Array<{ id: string }> },
): AssistantActionRegistry {
    const panels = new PanelActionRegistry();
    panels.registerAll(descriptors);
    const registry = new AssistantActionRegistry();
    registry.registerAll(createPanelActions({ panels, knowledge }));
    return registry;
}

describe('panel action registry', () => {
    it('refuses duplicate panel verbs and sorts the rest', () => {
        const panels = new PanelActionRegistry();
        panels.register(descriptor({ panelId: 'b', id: 'x' }));
        panels.register(descriptor({ panelId: 'a', id: 'z' }));
        panels.register(descriptor({ panelId: 'a', id: 'a' }));
        expect(panels.panels()).toEqual(['a', 'b']);
        expect(panels.list('a').map((d) => d.id)).toEqual(['a', 'z']);
        expect(panels.get('a', 'a')?.panelId).toBe('a');
        expect(panels.get('a', 'ghost')).toBeUndefined();
        expect(() => panels.register(descriptor({ panelId: 'a', id: 'a' }))).toThrow(
            /already registered/,
        );
        expect(() => panels.register(descriptor({ panelId: ' ', id: 'x' }))).toThrow(
            /panelId is required/,
        );
    });
});

describe('panel actions', () => {
    it('lists the actable panels and the capabilities of one', async () => {
        const registry = registryWith([
            descriptor({ panelId: 'memory', id: 'search', title: 'Search' }),
            descriptor({ panelId: 'memory', id: 'forget', permission: 'tool:write' }),
            descriptor({ panelId: 'tasks', id: 'create', permission: 'tool:write' }),
        ]);

        const all = await registry.run('panel.list', {});
        expect(all.ok).toBe(true);
        expect(all.detail).toBe('2 actable panel(s), 3 action(s)');
        expect(all.evidence).toContain('memory: 2');
        expect(all.evidence).toContain('tasks: 1');

        const one = await registry.run('panel.list', { panelId: 'memory' });
        expect(one.detail).toBe('2 action(s) in "memory"');
        expect(one.evidence).toContain('search (tool:read) — Search');
        expect(one.evidence).toContain('forget (tool:write)');

        const none = await registry.run('panel.list', { panelId: 'ghost' });
        expect(none.ok).toBe(true);
        expect(none.detail).toBe('no panel actions for "ghost"');
    });

    it('reports how much of the admin is actable yet', async () => {
        const registry = registryWith(
            [descriptor({ panelId: 'memory', id: 'search' })],
            { panelsMatching: () => Array.from({ length: 260 }, (_, i) => ({ id: `p${i}` })) },
        );
        const result = await registry.run('panel.list', {});
        expect(result.detail).toBe('1 actable of 260 panel(s), 1 action(s)');
    });

    it('runs reads and refuses to smuggle a write through panel.read', async () => {
        const run = vi.fn(async () => ({ ok: true, detail: 'searched', evidence: 'hits: 1' }));
        const registry = registryWith([
            descriptor({ panelId: 'memory', id: 'search', run }),
            descriptor({
                panelId: 'memory',
                id: 'forget',
                permission: 'tool:write',
                run: async () => ({ ok: true, detail: 'deleted' }),
            }),
        ]);

        const read = await registry.run('panel.read', {
            panelId: 'memory',
            id: 'search',
            args: { query: 'x' },
        });
        expect(read.ok).toBe(true);
        expect(read.evidence).toBe('hits: 1');
        expect(run).toHaveBeenCalledWith({ query: 'x' });

        const refused = await registry.run('panel.read', { panelId: 'memory', id: 'forget' });
        expect(refused.ok).toBe(false);
        expect(refused.detail).toContain('is a write; use panel.act');

        const refusedRead = await registry.run('panel.act', { panelId: 'memory', id: 'search' });
        expect(refusedRead.ok).toBe(false);
        expect(refusedRead.detail).toContain('is a read; use panel.read');
    });

    it('reports unknown capabilities and failed runs instead of throwing', async () => {
        const registry = registryWith([
            descriptor({
                panelId: 'memory',
                id: 'boom',
                run: async () => {
                    throw new Error('storage is closed');
                },
            }),
        ]);

        const unknown = await registry.run('panel.read', { panelId: 'memory', id: 'ghost' });
        expect(unknown.ok).toBe(false);
        expect(unknown.detail).toBe('no panel action "memory.ghost"');

        const missing = await registry.run('panel.read', { panelId: 'memory' });
        expect(missing.ok).toBe(false);
        expect(missing.detail).toBe('id is required');

        const threw = await registry.run('panel.read', { panelId: 'memory', id: 'boom' });
        expect(threw.ok).toBe(false);
        expect(threw.detail).toBe('memory.boom failed: storage is closed');
    });
});
