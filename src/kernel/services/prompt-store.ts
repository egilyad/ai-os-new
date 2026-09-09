import { rootLogger } from './logger-service';
const PS_LOGGER = rootLogger.child('PromptStore');

const STORAGE_KEY = 'superagents_prompt_overrides';

export type PromptRole = 'attacker' | 'defender' | 'judge' | 'pro' | 'con' | 'default';

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
    } catch (e) {
        PS_LOGGER.warn('PromptStore', 'resetAllPrompts failed', { error: e });
    }
}
