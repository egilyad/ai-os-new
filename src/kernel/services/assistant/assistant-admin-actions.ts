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
        updateSettings?(updates: Record<string, unknown>): Promise<unknown>;
    };
    audit?: {
        list(limit?: number): Promise<Array<{ actor: string; action: string; target?: string }>>;
        verify?(): Promise<{ ok: boolean; brokenAt?: number }>;
    };
}

/** Values the assistant may write; anything else is refused, not guessed. */
const SETTING_VALUES: Record<string, unknown[]> = {
    defaultMode: ['broadcast', 'single', 'smart'],
    slaMode: ['LOW_LATENCY', 'HIGH_QUALITY', 'BALANCED', 'ECONOMY', 'FREE_FIRST'],
    language: ['en', 'ru'],
    streamingEnabled: [true, false],
    historyPersistence: [true, false],
    fallbackEnabled: [true, false],
};

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

    actions.push({
        id: 'settings.update',
        group: 'work',
        description:
            'Change a safe system setting: default routing mode, SLA mode, language, or one of the on/off switches (streaming, history persistence, fallback). The user confirms before it is applied; the result is read back.',
        parameters: {
            type: 'object',
            properties: {
                defaultMode: { type: 'string', enum: ['broadcast', 'single', 'smart'] },
                slaMode: {
                    type: 'string',
                    enum: ['LOW_LATENCY', 'HIGH_QUALITY', 'BALANCED', 'ECONOMY', 'FREE_FIRST'],
                },
                language: { type: 'string', enum: ['en', 'ru'] },
                streamingEnabled: { type: 'boolean' },
                historyPersistence: { type: 'boolean' },
                fallbackEnabled: { type: 'boolean' },
            },
        },
        action: 'tool:write',
        run: async (args) => {
            const settings = deps.settings;
            if (!settings) return { ok: false, detail: 'settings are not available', verification: 'discovered' };
            if (!settings.updateSettings) {
                return { ok: false, detail: 'settings are read-only in this build', verification: 'discovered' };
            }

            const patch: Record<string, unknown> = {};
            const rejected: string[] = [];
            for (const [key, value] of Object.entries(args)) {
                if (SETTING_VALUES[key] === undefined) {
                    rejected.push(key);
                } else if (!SETTING_VALUES[key].includes(value)) {
                    rejected.push(`${key}=${String(value)}`);
                } else {
                    patch[key] = value;
                }
            }
            if (rejected.length > 0) {
                return {
                    ok: false,
                    detail: `refuses to change ${rejected.join(', ')}; allowed values: ${Object.entries(
                        SETTING_VALUES,
                    )
                        .map(([k, v]) => `${k} ∈ {${v.join('|')}}`)
                        .join('; ')}`,
                    verification: 'discovered',
                };
            }
            if (Object.keys(patch).length === 0) {
                return {
                    ok: false,
                    detail: `nothing to change; allowed keys: ${Object.keys(SETTING_VALUES).join(', ')}`,
                    verification: 'discovered',
                };
            }

            const before = settings.getSettings();
            try {
                await settings.updateSettings(patch);
            } catch (e) {
                return {
                    ok: false,
                    detail: `settings were not changed: ${e instanceof Error ? e.message : String(e)}`,
                    verification: 'discovered',
                };
            }
            const after = settings.getSettings() as Record<string, unknown>;
            const changed = Object.keys(patch)
                .map((k) => `${k}: ${String((before as Record<string, unknown>)[k])} → ${String(after[k])}`)
                .join(' | ');
            const applied = Object.keys(patch).filter(
                (k) => (before as Record<string, unknown>)[k] !== after[k],
            );
            return {
                ok: applied.length > 0,
                detail:
                    applied.length > 0
                        ? `changed ${applied.join(', ')} (the new values are read back)`
                        : 'the settings service accepted the call but kept the old values',
                evidence: changed,
                verification: 'verified',
            };
        },
    });

    return actions;
}
