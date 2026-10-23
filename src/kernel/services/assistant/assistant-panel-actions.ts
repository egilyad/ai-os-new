/**
 * The three generic actions that reach every panel capability: `panel.list`,
 * `panel.read` and `panel.act`.
 *
 * One descriptor per panel verb would bloat the model's tool schema on every
 * turn, so the model sees three stable actions instead and discovers the rest
 * at runtime. Reads and writes are deliberately split: a single action cannot
 * be both, or the approval gate would either miss writes or ask for reads.
 */
import type {
    AssistantAction,
    AssistantActionResult,
} from '../../contracts/assistant';
import type { PanelActionCatalog } from '../../contracts/panel-actions';

export interface PanelActionDeps {
    panels: PanelActionCatalog;
    /**
     * Optional: the panel catalog of the project (route registry + wiki), used
     * only to report how many of the panels are actable yet.
     */
    knowledge?: { panelsMatching(query?: string): Array<{ id: string }> };
}

function str(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function fail(detail: string): AssistantActionResult {
    return { ok: false, detail };
}

export function createPanelActions(deps: PanelActionDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    actions.push({
        id: 'panel.list',
        group: 'research',
        description:
            'List the panels the assistant can act in, or the capabilities of one panel. Use it to discover what is possible in the panel the user is talking about before claiming it cannot be done.',
        parameters: {
            type: 'object',
            properties: {
                panelId: {
                    type: 'string',
                    description: 'Panel to describe (omit to list every actable panel).',
                },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            const panelId = str(args['panelId']);
            if (panelId) {
                const found = deps.panels.list(panelId);
                if (found.length === 0) {
                    return {
                        ok: true,
                        detail: `no panel actions for "${panelId}"`,
                        evidence: `panel: ${panelId} | actions: 0`,
                        verification: 'verified',
                    };
                }
                return {
                    ok: true,
                    detail: `${found.length} action(s) in "${panelId}"`,
                    evidence: found
                        .map((a) => `${a.id} (${a.permission}) — ${a.title}`)
                        .join(' | '),
                    verification: 'verified',
                };
            }
            const panels = deps.panels.panels();
            if (panels.length === 0) {
                return {
                    ok: true,
                    detail: 'no actable panels yet',
                    evidence: 'panels: 0',
                    verification: 'verified',
                };
            }
            const total = deps.panels.list().length;
            const lines = panels.map((p) => `${p}: ${deps.panels.list(p).length}`);
            const panelCount = deps.knowledge?.panelsMatching().length;
            return {
                ok: true,
                detail: panelCount
                    ? `${panels.length} actable of ${panelCount} panel(s), ${total} action(s)`
                    : `${panels.length} actable panel(s), ${total} action(s)`,
                evidence: lines.slice(0, 40).join(' | '),
                verification: 'verified',
            };
        },
    });

    const runPanel = async (
        args: Record<string, unknown>,
        expected: 'tool:read' | 'tool:write',
    ): Promise<AssistantActionResult> => {
        const panelId = str(args['panelId']);
        const id = str(args['id']);
        if (!panelId) return fail('panelId is required');
        if (!id) return fail('id is required');
        const descriptor = deps.panels.get(panelId, id);
        if (!descriptor) return fail(`no panel action "${panelId}.${id}"`);
        if (descriptor.permission !== expected) {
            return fail(
                `"${panelId}.${id}" is a ${descriptor.permission === 'tool:write' ? 'write' : 'read'}; use ${expected === 'tool:read' ? 'panel.act' : 'panel.read'}`,
            );
        }
        try {
            return await descriptor.run(asObject(args['args']));
        } catch (err) {
            return fail(`${panelId}.${id} failed: ${(err as Error).message}`);
        }
    };

    actions.push({
        id: 'panel.read',
        group: 'research',
        description:
            'Run a read-only capability of a panel (`panel.list` shows which exist). Never changes anything.',
        parameters: {
            type: 'object',
            properties: {
                panelId: { type: 'string', description: 'Panel id, e.g. "memory".' },
                id: { type: 'string', description: 'Capability id, e.g. "search".' },
                args: { type: 'object', description: 'Capability arguments.' },
            },
            required: ['panelId', 'id'],
        },
        action: 'tool:read',
        run: (args) => runPanel(args, 'tool:read'),
    });

    actions.push({
        id: 'panel.act',
        group: 'work',
        description:
            'Run a mutating capability of a panel (`panel.list` shows which exist). It waits for the confirmation of the user, like every other write.',
        parameters: {
            type: 'object',
            properties: {
                panelId: { type: 'string', description: 'Panel id, e.g. "memory".' },
                id: { type: 'string', description: 'Capability id, e.g. "forget".' },
                args: { type: 'object', description: 'Capability arguments.' },
            },
            required: ['panelId', 'id'],
        },
        action: 'tool:write',
        run: (args) => runPanel(args, 'tool:write'),
    });

    return actions;
}
