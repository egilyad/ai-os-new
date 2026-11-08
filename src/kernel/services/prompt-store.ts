import { rootLogger } from './logger-service';
const PS_LOGGER = rootLogger.child('PromptStore');

const STORAGE_KEY = 'superagents_prompt_overrides';
const VERSION_KEY = 'superagents_prompt_version_history';
const MAX_VERSIONS_PER_ROLE = 50;

export type PromptRole = 'attacker' | 'defender' | 'judge' | 'pro' | 'con' | 'default';

export interface PromptRoleVersion {
    id: string;
    role: PromptRole;
    content: string;
    author: string;
    createdAt: number;
    comment: string;
}

const DEFAULT_PROMPTS: Record<PromptRole, string> = {
    attacker:
        'You are a critical examiner. Challenge assumptions, find flaws, and probe weaknesses in arguments.',
    defender:
        'You are a defensive reasoner. Protect valid claims with evidence, address criticisms constructively.',
    judge: 'You are an impartial judge. Evaluate arguments based on logical validity, evidence, and coherence.',
    pro: 'You argue in favor of the proposition. Provide strong supporting evidence and reasoning.',
    con: 'You argue against the proposition. Identify weaknesses and present counterarguments.',
    default: 'Present your reasoning clearly and concisely.',
};

let _db: Promise<import('../types/interfaces').IDatabaseService> | null = null;
let _overrideCache: Partial<Record<PromptRole, string>> | null = null;
let _versionCache: PromptRoleVersion[] | null = null;

async function db(): Promise<import('../types/interfaces').IDatabaseService> {
    if (!_db)
        _db = (async () => {
            const { database } = await import('../instances/core-references');
            return database;
        })();
    return _db;
}

function invalidateCache(): void {
    _overrideCache = null;
    _versionCache = null;
}

function versionId(): string {
    return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

async function loadVersions(): Promise<PromptRoleVersion[]> {
    if (_versionCache) return _versionCache;
    try {
        const raw = await (await db()).getKv<PromptRoleVersion[]>(VERSION_KEY);
        _versionCache = Array.isArray(raw) ? raw : [];
        return _versionCache;
    } catch (e) {
        PS_LOGGER.warn('PromptStore', 'loadVersions failed', { error: e });
    }
    return [];
}

async function saveVersions(versions: PromptRoleVersion[]): Promise<void> {
    try {
        await (await db()).setKv(VERSION_KEY, versions);
    } catch (e) {
        PS_LOGGER.warn('PromptStore', 'saveVersions failed', { error: e });
    }
}

async function loadOverrides(): Promise<Partial<Record<PromptRole, string>>> {
    if (_overrideCache) return _overrideCache;
    try {
        const raw = await (await db()).getKv<Partial<Record<PromptRole, string>>>(STORAGE_KEY);
        _overrideCache = raw ?? {};
        return _overrideCache;
    } catch (e) {
        PS_LOGGER.warn('PromptStore', 'loadOverrides failed', { error: e });
    }
    return {};
}

async function saveOverrides(overrides: Partial<Record<PromptRole, string>>): Promise<void> {
    try {
        await (await db()).setKv(STORAGE_KEY, overrides);
    } catch (e) {
        PS_LOGGER.warn('PromptStore', 'saveOverrides failed', { error: e });
    }
}

export async function getPrompt(role: string | undefined): Promise<string> {
    const overrides = await loadOverrides();
    const r = (role as PromptRole) || 'default';
    return overrides[r] || DEFAULT_PROMPTS[r] || DEFAULT_PROMPTS.default;
}

export async function setPrompt(role: PromptRole, prompt: string): Promise<void> {
    const overrides = await loadOverrides();
    overrides[role] = prompt;
    invalidateCache();
    await saveOverrides(overrides);
    await recordVersion(role, prompt, 'admin', 'Saved from Settings');
}

export async function recordVersion(
    role: PromptRole,
    content: string,
    author = 'admin',
    comment = 'Prompt updated',
): Promise<PromptRoleVersion> {
    const versions = await loadVersions();
    const v: PromptRoleVersion = {
        id: versionId(),
        role,
        content,
        author,
        createdAt: Date.now(),
        comment,
    };
    versions.push(v);
    const roleVersions = versions.filter((x) => x.role === role);
    if (roleVersions.length > MAX_VERSIONS_PER_ROLE) {
        const toRemove = roleVersions
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, roleVersions.length - MAX_VERSIONS_PER_ROLE);
        const removeIds = new Set(toRemove.map((r) => r.id));
        _versionCache = null;
        await saveVersions(versions.filter((x) => !removeIds.has(x.id)));
    } else {
        _versionCache = null;
        await saveVersions(versions);
    }
    return v;
}

export async function getVersionHistory(role: PromptRole): Promise<PromptRoleVersion[]> {
    const versions = await loadVersions();
    return versions
        .filter((v) => v.role === role)
        .sort((a, b) => b.createdAt - a.createdAt);
}

export async function rollbackPrompt(role: PromptRole, versionId: string): Promise<boolean> {
    const versions = await loadVersions();
    const target = versions.find((v) => v.id === versionId && v.role === role);
    if (!target) return false;
    const overrides = await loadOverrides();
    overrides[role] = target.content;
    invalidateCache();
    await saveOverrides(overrides);
    await recordVersion(role, target.content, 'admin', `Rolled back to ${target.id}`);
    return true;
}

export async function getAllPrompts(): Promise<Record<PromptRole, string>> {
    const overrides = await loadOverrides();
    const result = { ...DEFAULT_PROMPTS };
    for (const key of Object.keys(overrides) as PromptRole[]) {
        if (overrides[key]) result[key] = overrides[key]!;
    }
    return result;
}

export async function resetAllPrompts(): Promise<void> {
    invalidateCache();
    try {
        await (await db()).setKv(STORAGE_KEY, {});
        await (await db()).setKv(VERSION_KEY, []);
    } catch (e) {
        PS_LOGGER.warn('PromptStore', 'resetAllPrompts failed', { error: e });
    }
}
