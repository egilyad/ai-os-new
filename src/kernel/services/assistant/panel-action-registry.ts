/**
 * PanelActionRegistry — the single catalog behind `panel.list/read/act`.
 *
 * Keys are `panelId` + verb id so that a panel can own several capabilities
 * without inventing global action ids. Registration is strict (duplicates
 * throw) because two descriptors with the same name would make the assistant
 * silently run the wrong one.
 */
import type {
    PanelActionCatalog,
    PanelActionDescriptor,
} from '../../contracts/panel-actions';

function key(panelId: string, id: string): string {
    return `${panelId}.${id}`;
}

export class PanelActionRegistry implements PanelActionCatalog {
    private readonly actions = new Map<string, PanelActionDescriptor>();

    register(descriptor: PanelActionDescriptor): void {
        const panelId = descriptor.panelId.trim();
        const id = descriptor.id.trim();
        if (!panelId) throw new Error('panel action: panelId is required');
        if (!id) throw new Error('panel action: id is required');
        const k = key(panelId, id);
        if (this.actions.has(k)) {
            throw new Error(`panel action already registered: ${k}`);
        }
        this.actions.set(k, { ...descriptor, panelId, id });
    }

    registerAll(descriptors: PanelActionDescriptor[]): void {
        for (const descriptor of descriptors) this.register(descriptor);
    }

    list(panelId?: string): PanelActionDescriptor[] {
        const all = [...this.actions.values()].sort((a, b) =>
            key(a.panelId, a.id).localeCompare(key(b.panelId, b.id)),
        );
        return panelId ? all.filter((a) => a.panelId === panelId) : all;
    }

    panels(): string[] {
        return [...new Set([...this.actions.values()].map((a) => a.panelId))].sort();
    }

    get(panelId: string, id: string): PanelActionDescriptor | undefined {
        return this.actions.get(key(panelId, id));
    }
}
