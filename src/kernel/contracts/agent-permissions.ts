/**
 * Permission ruleset contract.
 *
 * The rule model is a port of three MIT-licensed third-party agent harnesses,
 * rewritten for this codebase (no code copied):
 *
 *  - OpenCode (sst/opencode): a rule is `{action, resource, effect}` where
 *    effect is `allow | deny | ask`. Patterns are globs and the *last matching
 *    rule wins*. The default effect when nothing matches is `ask`.
 *  - OpenClaw: session permission modes that bundle a filesystem sandbox with
 *    an approval policy (`read-only` / `guarded` / `workspace` / `full`).
 *  - DeepSeek Harness: named permission *presets* that bind a sandbox mode and
 *    an approval policy in one switchable unit.
 *
 * All three collapse into one evaluator here so the admin UI, the tool
 * pipeline and the audit log speak the same language.
 */

export type PermissionEffect = 'allow' | 'deny' | 'ask';

/** Canonical action vocabulary. `*` matches every action. */
export const PERMISSION_ACTIONS = [
    'tool:read',
    'tool:write',
    'tool:exec',
    'tool:net',
    'tool:mcp',
    'tool:memory',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number] | string;

export interface PermissionRule {
    /** Glob pattern of the action, e.g. `tool:exec` or `tool:*`. */
    action: string;
    /** Glob pattern of the resource, e.g. `t-web`, `*.env`, `*`. */
    resource: string;
    effect: PermissionEffect;
    /** Optional human-readable note (shown in the admin UI and audit log). */
    note?: string;
}

export type PermissionRuleset = readonly PermissionRule[];

/** Session-level permission mode (OpenClaw style). */
export type PermissionMode = 'read-only' | 'guarded' | 'workspace' | 'full';

/** Named preset binding a sandbox mode to an approval policy (DeepSeek style). */
export type PermissionPresetId =
    | 'read-only'
    | 'workspace-write'
    | 'guarded'
    | 'danger-full-access';

export type SandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access';
export type ApprovalPolicy = 'never' | 'ask' | 'always';

export interface PermissionPreset {
    id: PermissionPresetId;
    label: string;
    description: string;
    sandbox: SandboxMode;
    approval: ApprovalPolicy;
    rules: PermissionRule[];
}

/** Glob matcher. `*` matches any run of characters, `?` matches one. */
export function matchPattern(pattern: string, value: string): boolean {
    if (pattern === '*') return true;
    if (!pattern.includes('*') && !pattern.includes('?')) return pattern === value;
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`).test(value);
}

/**
 * Evaluate a request against an ordered list of rulesets.
 *
 * Rules are concatenated in the given order and the **last matching rule
 * wins** â€” later rulesets therefore override earlier ones. When nothing
 * matches the request must be approved explicitly (`ask`).
 */
export function evaluatePermission(
    action: PermissionAction,
    resource: string,
    ...rulesets: PermissionRuleset[]
): PermissionRule {
    const rules = rulesets.flat();
    for (let i = rules.length - 1; i >= 0; i--) {
        const rule = rules[i]!;
        if (matchPattern(rule.action, action) && matchPattern(rule.resource, resource)) {
            return rule;
        }
    }
    return { action, resource, effect: 'ask' };
}

/** Merge rulesets preserving order (later wins). */
export function mergeRulesets(...rulesets: PermissionRuleset[]): PermissionRule[] {
    return rulesets.flat().map((r) => ({ ...r }));
}

/**
 * Base ruleset (OpenCode `statics.default`): everything allowed unless a more
 * specific rule says otherwise.
 */
export const BASE_PERMISSION_RULES: PermissionRule[] = [
    { action: '*', resource: '*', effect: 'allow' },
];

/**
 * Secret protection â€” applied after the mode/preset ruleset so a permissive
 * preset still cannot silently read private keys.
 */
export const SECRET_PROTECTION_RULES: PermissionRule[] = [
    { action: 'tool:read', resource: '*.env', effect: 'ask', note: 'Secret file access' },
    { action: 'tool:read', resource: '*.env.*', effect: 'ask', note: 'Secret file access' },
    { action: 'tool:read', resource: '*.env.example', effect: 'allow' },
    { action: 'tool:read', resource: '*.pem', effect: 'ask', note: 'Private key access' },
    { action: 'tool:read', resource: '*.key', effect: 'ask', note: 'Private key access' },
];

// The catch-all deny comes FIRST: the evaluator takes the *last* matching
// rule, so the specific allows/asks below must be able to override it.
const READ_ONLY_RULES: PermissionRule[] = [
    { action: 'tool:*', resource: '*', effect: 'deny', note: 'read-only mode' },
    { action: 'tool:read', resource: '*', effect: 'allow' },
    { action: 'tool:memory', resource: '*', effect: 'allow' },
];

const GUARDED_RULES: PermissionRule[] = [
    { action: 'tool:*', resource: '*', effect: 'deny', note: 'guarded mode' },
    { action: 'tool:read', resource: '*', effect: 'allow' },
    { action: 'tool:memory', resource: '*', effect: 'allow' },
    { action: 'tool:write', resource: '*', effect: 'ask', note: 'guarded mode' },
    { action: 'tool:exec', resource: '*', effect: 'ask', note: 'guarded mode' },
    { action: 'tool:net', resource: '*', effect: 'ask', note: 'guarded mode' },
    { action: 'tool:mcp', resource: '*', effect: 'ask', note: 'guarded mode' },
];

const WORKSPACE_RULES: PermissionRule[] = [
    { action: 'tool:*', resource: '*', effect: 'deny', note: 'workspace sandbox' },
    { action: 'tool:read', resource: '*', effect: 'allow' },
    { action: 'tool:memory', resource: '*', effect: 'allow' },
    { action: 'tool:write', resource: '*', effect: 'allow', note: 'workspace sandbox' },
    { action: 'tool:exec', resource: '*', effect: 'allow', note: 'workspace sandbox' },
    { action: 'tool:net', resource: '*', effect: 'ask', note: 'egress needs approval' },
    { action: 'tool:mcp', resource: '*', effect: 'ask', note: 'MCP needs approval' },
];

const FULL_RULES: PermissionRule[] = [{ action: '*', resource: '*', effect: 'allow' }];

/** Ruleset contributed by a session permission mode. */
export function rulesetForMode(mode: PermissionMode): PermissionRule[] {
    switch (mode) {
        case 'read-only':
            return [...READ_ONLY_RULES];
        case 'guarded':
            return [...GUARDED_RULES];
        case 'workspace':
            return [...WORKSPACE_RULES];
        case 'full':
            return [...FULL_RULES];
    }
}

export const PERMISSION_MODES: ReadonlyArray<{
    id: PermissionMode;
    label: string;
    description: string;
    requiresAdmin: boolean;
}> = [
    {
        id: 'read-only',
        label: 'Read-only',
        description: 'Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ. Ð›ÑŽÐ±Ð°Ñ Ð·Ð°Ð¿Ð¸ÑÑŒ, Ð·Ð°Ð¿ÑƒÑÐº Ð¸ Ð²Ð½ÐµÑˆÐ½Ð¸Ð¹ Ð·Ð°Ð¿Ñ€Ð¾Ñ Ð·Ð°Ð¿Ñ€ÐµÑ‰ÐµÐ½Ñ‹.',
        requiresAdmin: false,
    },
    {
        id: 'guarded',
        label: 'Guarded',
        description: 'Ð§Ñ‚ÐµÐ½Ð¸Ðµ Ñ€Ð°Ð·Ñ€ÐµÑˆÐµÐ½Ð¾, Ð·Ð°Ð¿Ð¸ÑÑŒ/Ð·Ð°Ð¿ÑƒÑÐº/ÑÐµÑ‚ÑŒ â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð¿Ð¾ÑÐ»Ðµ Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¸Ñ.',
        requiresAdmin: false,
    },
    {
        id: 'workspace',
        label: 'Workspace',
        description: 'Ð—Ð°Ð¿Ð¸ÑÑŒ Ð¸ Ð·Ð°Ð¿ÑƒÑÐº Ñ€Ð°Ð·Ñ€ÐµÑˆÐµÐ½Ñ‹ Ð² Ñ€Ð°Ð±Ð¾Ñ‡ÐµÐ¹ Ð¾Ð±Ð»Ð°ÑÑ‚Ð¸, ÑÐµÑ‚ÑŒ Ð¸ MCP â€” Ð¿Ð¾ Ð·Ð°Ð¿Ñ€Ð¾ÑÑƒ.',
        requiresAdmin: false,
    },
    {
        id: 'full',
        label: 'Full',
        description: 'Ð‘ÐµÐ· Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½Ð¸Ð¹. Ð¢Ñ€ÐµÐ±ÑƒÐµÑ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¸Ð²Ð½Ð¾Ð³Ð¾ Ñ€Ð°Ð·Ñ€ÐµÑˆÐµÐ½Ð¸Ñ.',
        requiresAdmin: true,
    },
];

export const PERMISSION_PRESETS: ReadonlyArray<PermissionPreset> = [
    {
        id: 'read-only',
        label: 'Read only',
        description: 'Sandbox: Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ. Approval: never.',
        sandbox: 'read-only',
        approval: 'never',
        rules: [...READ_ONLY_RULES],
    },
    {
        id: 'workspace-write',
        label: 'Workspace write',
        description: 'Sandbox: Ð·Ð°Ð¿Ð¸ÑÑŒ Ð² Ñ€Ð°Ð±Ð¾Ñ‡ÑƒÑŽ Ð¾Ð±Ð»Ð°ÑÑ‚ÑŒ. Approval: ask.',
        sandbox: 'workspace-write',
        approval: 'ask',
        rules: [...WORKSPACE_RULES],
    },
    {
        id: 'guarded',
        label: 'Guarded',
        description: 'Sandbox: Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½Ð½Ð°Ñ Ð·Ð°Ð¿Ð¸ÑÑŒ. Approval: ask.',
        sandbox: 'workspace-write',
        approval: 'ask',
        rules: [...GUARDED_RULES],
    },
    {
        id: 'danger-full-access',
        label: 'Danger full access',
        description: 'Sandbox: Ð±ÐµÐ· Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½Ð¸Ð¹. Approval: never.',
        sandbox: 'danger-full-access',
        approval: 'never',
        rules: [...FULL_RULES],
    },
];

/** Map a session permission mode onto the preset that carries its rules. */
export const PERMISSION_MODE_TO_PRESET: Record<PermissionMode, PermissionPresetId> = {
    'read-only': 'read-only',
    guarded: 'guarded',
    workspace: 'workspace-write',
    full: 'danger-full-access',
};

export function presetById(id: PermissionPresetId): PermissionPreset {
    return (
        PERMISSION_PRESETS.find((p) => p.id === id) ?? PERMISSION_PRESETS[0]!
    );
}

/**
 * Resolve the permission action of a tool.
 *
 * Explicit metadata wins; otherwise the tool id is mapped heuristically.
 * Two namespaces are understood:
 *  - the catalog namespace (`t-read-file`, `t-web-search`, …) used by ToolService;
 *  - the runner namespace (`workspace.read`, `http.fetch`, `mcp.call`, …) used
 *    by ToolRunnerService.
 * Unknown tools fall back to `tool:exec` — the most conservative side-effect
 * class — so a newly added tool is never silently unrestricted.
 */
export function actionForTool(toolId: string, explicit?: string): PermissionAction {
    if (explicit) return explicit;
    // --- catalog namespace (ToolService) ---
    if (toolId.startsWith('t-read') || toolId.startsWith('t-list')) return 'tool:read';
    if (toolId.startsWith('t-write') || toolId.startsWith('t-edit')) return 'tool:write';
    if (toolId.startsWith('t-delete') || toolId.startsWith('t-rm')) return 'tool:exec';
    if (toolId.startsWith('t-mcp')) return 'tool:mcp';
    if (toolId.startsWith('t-search') || toolId.startsWith('t-summarize')) return 'tool:memory';
    if (toolId.startsWith('t-translate')) return 'tool:memory';
    if (toolId.startsWith('t-web') || toolId.startsWith('t-http') || toolId.startsWith('t-api')) {
        return 'tool:net';
    }
    // --- runner namespace (ToolRunnerService) ---
    if (toolId.startsWith('workspace.')) return 'tool:read';
    if (toolId.startsWith('http.')) return 'tool:net';
    if (toolId.startsWith('mcp.')) return 'tool:mcp';
    if (toolId.startsWith('memory.')) return 'tool:memory';
    if (toolId.startsWith('knowledge.')) return 'tool:memory';
    if (toolId.startsWith('session.')) return 'tool:memory';
    if (toolId.startsWith('debate.')) {
        // Starting a debate spawns agents — a side effect, not a read.
        return toolId === 'debate.status' || toolId === 'debate.verdict'
            ? 'tool:read'
            : 'tool:exec';
    }
    if (toolId.startsWith('time.') || toolId.startsWith('math.')) return 'tool:read';
    return 'tool:exec';
}

