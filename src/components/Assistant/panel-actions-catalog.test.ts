import { describe, expect, it } from 'vitest';
import { ensurePanelActionCatalog, panelActionDescriptors } from './panel-actions-catalog';
import type {
    PanelActionCatalog,
    PanelActionDescriptor,
} from '../../kernel/contracts/panel-actions';

/** A minimal catalog: the real registry is kernel-side and covered by its own test. */
function fakeCatalog(): PanelActionCatalog & { sizes: number[] } {
    const map = new Map<string, PanelActionDescriptor>();
    return {
        sizes: [],
        register(descriptor) {
            const key = `${descriptor.panelId}.${descriptor.id}`;
            if (map.has(key)) throw new Error(`duplicate ${key}`);
            map.set(key, descriptor);
        },
        list(panelId) {
            const all = [...map.values()];
            return panelId ? all.filter((d) => d.panelId === panelId) : all;
        },
        panels() {
            return [...new Set([...map.values()].map((d) => d.panelId))].sort();
        },
        get(panelId, id) {
            return map.get(`${panelId}.${id}`);
        },
    };
}

describe('panel action catalog', () => {
    it('publishes unique verbs per panel with honest permissions', () => {
        const descriptors = panelActionDescriptors();
        const keys = descriptors.map((d) => `${d.panelId}.${d.id}`);
        expect(new Set(keys).size).toBe(keys.length);

        const panels = new Set(descriptors.map((d) => d.panelId));
        expect([...panels].sort()).toEqual(['agent-journal', 'approvals', 'memory']);

        const writes = descriptors
            .filter((d) => d.permission === 'tool:write')
            .map((d) => `${d.panelId}.${d.id}`)
            .sort();
        expect(writes).toEqual(['agent-journal.remove', 'memory.forget']);

        // The human-in-the-loop queue must never be resolvable by the assistant.
        expect(descriptors.some((d) => d.panelId === 'approvals' && d.permission === 'tool:write')).toBe(
            false,
        );
        for (const descriptor of descriptors) {
            expect(descriptor.title.length).toBeGreaterThan(0);
            expect(descriptor.description.length).toBeGreaterThan(0);
        }
    });

    it('registers once and skips duplicated mounts', () => {
        const catalog = fakeCatalog();
        const added = ensurePanelActionCatalog(catalog);
        expect(added).toBe(panelActionDescriptors().length);
        expect(ensurePanelActionCatalog(catalog)).toBe(0);
        expect(catalog.list().length).toBe(panelActionDescriptors().length);
    });
});
