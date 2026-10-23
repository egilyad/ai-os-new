/**
 * Panel actions — the panel-action contract of the project assistant.
 *
 * The admin has hundreds of panels, and hand-writing one assistant action per
 * panel does not scale: every action costs prompt space on every turn. Instead
 * a panel publishes what it can do as a small *descriptor*, and the assistant
 * reaches all of them through three generic actions:
 *
 *   panel.list  - which panels are actable, and what each one offers;
 *   panel.read  - run a read-only descriptor (never gated);
 *   panel.act   - run a mutating descriptor (always gated by approval).
 *
 * A descriptor is a promise about the real service behind the panel: it must
 * read its result back, so the evidence proves the operation happened.
 */
import type { AssistantActionResult } from './assistant';

/** What a descriptor is allowed to do. Mirrors the action permission classes. */
export type PanelActionPermission = 'tool:read' | 'tool:write';

export interface PanelActionDescriptor {
    /** Panel id — the route key (e.g. `memory`, `tasks`, `scheduler`). */
    panelId: string;
    /** Verb id, unique within the panel (e.g. `search`, `forget`). */
    id: string;
    /** Short human title shown to the model and to the user. */
    title: string;
    /** What it does, in one sentence — becomes part of the tool description. */
    description: string;
    permission: PanelActionPermission;
    /** JSON schema of the arguments (OpenAI function-call shape). */
    parameters?: Record<string, unknown>;
    /** Run it. Reads its result back; must not throw. */
    run(args: Record<string, unknown>): Promise<AssistantActionResult>;
}

/** A catalog of panel capabilities, shared by the kernel actions and the UI. */
export interface PanelActionCatalog {
    /** Register one descriptor. Throws on a duplicate panelId+id. */
    register(descriptor: PanelActionDescriptor): void;
    /** All descriptors, or only the ones of one panel. */
    list(panelId?: string): PanelActionDescriptor[];
    /** Panels that have at least one descriptor, sorted. */
    panels(): string[];
    /** One descriptor, if it exists. */
    get(panelId: string, id: string): PanelActionDescriptor | undefined;
}
