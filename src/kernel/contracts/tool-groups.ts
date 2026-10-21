/**
 * Tool groups and tool profiles.
 *
 *  - Tool *groups* and *profiles* are ported from OpenClaw: instead of handing
 *    a model the full tool catalogue, an agent equips a profile and the
 *    profile expands into groups; explicit denies always beat allows.
 *
 *  - Both tool namespaces live here: the catalog namespace (`t-*`, executed by
 *    ToolService) and the runner namespace (`workspace.*`, `http.*`, `mcp.*`,
 *    `knowledge.*`, `debate.*`, executed by ToolRunnerService). A profile that
 *    only mentions `t-*` would otherwise leave the runner tools unreachable —
 *    or, worse, reachable regardless of the profile.
 *
 * Pure data + pure functions only — the stateful availability probe lives in
 * `src/kernel/services/tool-pipeline/tool-availability.ts`.
 */

export type ToolGroupId =
    | 'group:fs'
    | 'group:code'
    | 'group:web'
    | 'group:memory'
    | 'group:mcp'
    | 'group:data'
    | 'group:utility'
    | 'group:debate';

export interface ToolGroup {
    id: ToolGroupId;
    label: string;
    description: string;
    tools: string[];
}

export const TOOL_GROUPS: Readonly<Record<ToolGroupId, ToolGroup>> = {
    'group:fs': {
        id: 'group:fs',
        label: 'Filesystem',
        description: 'Чтение и запись файлов рабочей области.',
        tools: [
            't-read-file',
            't-list-files',
            'workspace.list',
            'workspace.read',
            'workspace.search',
        ],
    },
    'group:code': {
        id: 'group:code',
        label: 'Code execution',
        description: 'Исполнение кода в песочнице.',
        tools: ['t-code'],
    },
    'group:web': {
        id: 'group:web',
        label: 'Web',
        description: 'Внешние HTTP-запросы и поиск.',
        tools: ['t-web', 't-web-search', 'http.fetch'],
    },
    'group:memory': {
        id: 'group:memory',
        label: 'Memory',
        description: 'Поиск по долговременной памяти и LLM-утилиты.',
        tools: ['t-search', 't-summarize', 't-translate', 'knowledge.search'],
    },
    'group:mcp': {
        id: 'group:mcp',
        label: 'MCP',
        description: 'Инструменты Model Context Protocol.',
        tools: ['t-mcp', 'mcp.call'],
    },
    'group:data': {
        id: 'group:data',
        label: 'Data',
        description: 'HTTP-вызовы к внешним API.',
        tools: ['t-api-call'],
    },
    'group:utility': {
        id: 'group:utility',
        label: 'Utility',
        description: 'Служебные инструменты без внешних эффектов.',
        tools: ['time.now', 'math.calc'],
    },
    'group:debate': {
        id: 'group:debate',
        label: 'Debate',
        description: 'Запуск дебатов и чтение их вердиктов.',
        tools: ['debate.start', 'debate.verdict', 'debate.status'],
    },
};

export interface ToolProfile {
    id: string;
    label: string;
    description: string;
    groups: ToolGroupId[];
    /** Individual tools added on top of the groups. */
    tools: string[];
}

export const TOOL_PROFILES: Readonly<Record<string, ToolProfile>> = {
    minimal: {
        id: 'minimal',
        label: 'Minimal',
        description: 'Только чтение памяти и локальных файлов.',
        groups: ['group:memory', 'group:fs'],
        tools: [],
    },
    research: {
        id: 'research',
        label: 'Research',
        description: 'Поиск в памяти и в сети.',
        groups: ['group:memory', 'group:web'],
        tools: [],
    },
    coding: {
        id: 'coding',
        label: 'Coding',
        description: 'Файлы, песочница исполнения, веб и MCP.',
        groups: ['group:fs', 'group:code', 'group:web', 'group:mcp'],
        tools: [],
    },
    full: {
        id: 'full',
        label: 'Full',
        description: 'Все группы инструментов без ограничений.',
        groups: [
            'group:fs',
            'group:code',
            'group:web',
            'group:memory',
            'group:mcp',
            'group:data',
            'group:utility',
            'group:debate',
        ],
        tools: [],
    },
};

export interface ToolSetOptions {
    /** Extra tool ids to allow. */
    allow?: string[];
    /** Tool ids to deny — a deny always beats an allow. */
    deny?: string[];
    /** Tool ids that are currently reachable (availability probe result). */
    available?: string[];
}

/**
 * Resolve the effective tool set for a profile.
 *
 * Order of precedence: group denies override explicit allows (OpenClaw), an
 * unavailable tool is removed, and `deny` always wins.
 */
export function resolveToolSet(profileId: string, options: ToolSetOptions = {}): string[] {
    const profile = TOOL_PROFILES[profileId] ?? TOOL_PROFILES['minimal']!;
    const denied = new Set(options.deny ?? []);
    const available = options.available ? new Set(options.available) : null;

    const ids = new Set<string>();
    for (const groupId of profile.groups) {
        const group = TOOL_GROUPS[groupId];
        if (!group) continue;
        for (const toolId of group.tools) ids.add(toolId);
    }
    for (const toolId of profile.tools) ids.add(toolId);
    for (const toolId of options.allow ?? []) ids.add(toolId);

    return [...ids].filter((id) => {
        if (denied.has(id)) return false;
        if (available && !available.has(id)) return false;
        return true;
    });
}

export function groupOfTool(toolId: string): ToolGroupId | undefined {
    for (const group of Object.values(TOOL_GROUPS)) {
        if (group.tools.includes(toolId)) return group.id;
    }
    return undefined;
}

export function toolsOfGroup(groupId: ToolGroupId): string[] {
    return TOOL_GROUPS[groupId]?.tools ?? [];
}
