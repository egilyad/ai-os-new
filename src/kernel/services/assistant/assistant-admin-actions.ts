/**
 * The assistant's view of the admin panels it can otherwise only open.
 *
 * Opening a panel is navigation; answering "кто здесь роль" or "что последним
 * меняли" needs the same data the panel shows. These actions read it, and only
 * the safe part: no keys, no tokens, no secrets.
 */
import type { AssistantAction } from '../../contracts/assistant';

/** Structural shapes of the services behind these actions (kept minimal). */
export interface AssistantAdminDeps {
    roles?: {
        getAllRoles(): Array<{ id: string; category?: string; builtin?: boolean }>;
    };
    settings?: {
        getSettings(): {
            defaultMode?: string;
            slaMode?: string;
            language?: string;
            theme?: string;
            streamingEnabled?: boolean;
            historyPersistence?: boolean;
            fallbackEnabled?: boolean;
            debugMode?: boolean;
            notifications?: boolean;
            telemetryEnabled?: boolean;
            chatDefaultProvider?: string;
            chatDefaultModel?: string;
        };
    };
    audit?: {
        list(limit?: number): Promise<Array<{ actor: string; action: string; target?: string }>>;
        verify?(): Promise<{ ok: boolean; brokenAt?: number }>;
    };
}

const argLimit = (value: unknown, fallback: number, max: number): number => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(Math.floor(n), max);
};

export function createAssistantAdminActions(deps: AssistantAdminDeps): AssistantAction[] {
    const actions: AssistantAction[] = [];

    actions.push({
        id: 'roles.list',
        group: 'research',
        description:
            'List the roles registered in the system, grouped by category, with the built-in/custom split.',
        parameters: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Optional category filter' },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.roles) return { ok: false, detail: 'roles are not available', verification: 'discovered' };
            const category = typeof args['category'] === 'string' ? args['category'] : undefined;
            const all = deps.roles.getAllRoles();
            const roles = category ? all.filter((r) => r.category === category) : all;
            if (roles.length === 0) {
                return {
                    ok: true,
                    detail: category ? `no roles in category "${category}"` : 'no roles registered',
                    evidence: 'roles: 0',
                    verification: 'verified',
                };
            }
            const builtin = roles.filter((r) => r.builtin).length;
            const byCategory = new Map<string, number>();
            for (const role of roles) {
                const key = role.category ?? 'uncategorized';
                byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
            }
            return {
                ok: true,
                detail: `${roles.length} role(s): ${builtin} built-in, ${roles.length - builtin} custom`,
                evidence: [...byCategory.entries()].map(([k, v]) => `${k}: ${v}`).join(' | '),
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'settings.get',
        group: 'research',
        description:
            'Read the current system settings that matter for behaviour: routing mode, SLA mode, language, theme, streaming, fallback, debug, default chat model.',
        parameters: { type: 'object', properties: {} },
        action: 'tool:read',
        run: async () => {
            const s = deps.settings?.getSettings();
            if (!s) return { ok: false, detail: 'settings are not available', verification: 'discovered' };
            const flags = Object.entries({
                streaming: s.streamingEnabled,
                history: s.historyPersistence,
                fallback: s.fallbackEnabled,
                debug: s.debugMode,
                notifications: s.notifications,
                telemetry: s.telemetryEnabled,
            })
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => `${k}: ${v ? 'on' : 'off'}`)
                .join(', ');
            const model = s.chatDefaultProvider
                ? `${s.chatDefaultProvider}${s.chatDefaultModel ? `/${s.chatDefaultModel}` : ''}`
                : 'not set';
            return {
                ok: true,
                detail: `mode ${s.defaultMode ?? 'unknown'}, SLA ${s.slaMode ?? 'unknown'}, language ${s.language ?? 'unknown'}, theme ${s.theme ?? 'unknown'}, default chat model ${model}${flags ? `; ${flags}` : ''}`,
                evidence: `defaultMode: ${s.defaultMode ?? 'unknown'} | slaMode: ${s.slaMode ?? 'unknown'}`,
                verification: 'verified',
            };
        },
    });

    actions.push({
        id: 'audit.recent',
        group: 'research',
        description:
            'Read the most recent audit-log entries (who did what) and check that the log chain is intact.',
        parameters: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'How many entries to read (default 10, max 50)' },
            },
        },
        action: 'tool:read',
        run: async (args) => {
            if (!deps.audit) return { ok: false, detail: 'audit log is not available', verification: 'discovered' };
            const limit = argLimit(args['limit'], 10, 50);
            const entries = await deps.audit.list(limit);
            const integrity = deps.audit.verify ? await deps.audit.verify() : undefined;
            const chain = integrity ? (integrity.ok ? 'chain intact' : `chain broken at ${integrity.brokenAt}`) : 'chain not checked';
            if (entries.length === 0) {
                return { ok: true, detail: `no audit entries; ${chain}`, evidence: 'entries: 0', verification: 'verified' };
            }
            return {
                ok: true,
                detail: `${entries.length} recent entr${entries.length === 1 ? 'y' : 'ies'}; ${chain}`,
                evidence: entries
                    .map((e) => `${e.actor} ${e.action}${e.target ? ` → ${e.target}` : ''}`)
                    .join(' | '),
                verification: 'verified',
            };
        },
    });

    return actions;
}
