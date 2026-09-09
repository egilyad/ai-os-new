import type { ApiKey, KeyNote } from '../types/metrics';

export interface KeyMeta {
    backoff: boolean;
    backoffRemainingMs: number;
    lastRateLimitAt?: number;
    consecutiveErrors: number;
}

export const VALID_KEY_STATUSES = new Set<ApiKey['status']>([
    'active',
    'inactive',
    'error',
    'checking',
    'pending',
    'quota_exhausted',
    'invalid',
    'duplicate',
    'quarantined',
    'probation',
    'compromised',
]);

export type ImportedKeyInput = Omit<ApiKey, 'id' | 'stats'>;

export function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseNotes(value: unknown): KeyNote[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) {
        const valid: KeyNote[] = [];
        for (const item of value) {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                const note = item as Record<string, unknown>;
                if (
                    typeof note.id === 'string' &&
                    typeof note.keyId === 'string' &&
                    typeof note.text === 'string' &&
                    typeof note.timestamp === 'number' &&
                    typeof note.type === 'string'
                ) {
                    valid.push(note as unknown as KeyNote);
                }
            }
        }
        return valid.length > 0 ? valid : undefined;
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parseNotes(parsed);
        } catch {
            return undefined;
        }
    }
    return undefined;
}

export function parseImportedKey(item: unknown): ImportedKeyInput | null {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const source = item as Record<string, unknown>;
    if (
        typeof source.provider !== 'string' ||
        typeof source.label !== 'string' ||
        typeof source.key !== 'string'
    ) {
        return null;
    }

    const status =
        typeof source.status === 'string' &&
        VALID_KEY_STATUSES.has(source.status as ApiKey['status'])
            ? (source.status as ApiKey['status'])
            : 'active';

    const imported: ImportedKeyInput = {
        provider: source.provider,
        label: source.label,
        key: source.key,
        status,
    };

    if (typeof source.group === 'string') imported.group = source.group;
    if (typeof source.account === 'string') imported.account = source.account;
    if (typeof source.accountId === 'string') imported.accountId = source.accountId;
    if (typeof source.model === 'string') imported.model = source.model;
    const parsedNotes = parseNotes(source.notes);
    if (parsedNotes) imported.notes = parsedNotes;
    if (typeof source.isEncrypted === 'boolean') imported.isEncrypted = source.isEncrypted;
    if (typeof source.fingerprint === 'string') imported.fingerprint = source.fingerprint;
    if (typeof source.secretRef === 'string') imported.secretRef = source.secretRef;
    if (typeof source.priority === 'number' && Number.isFinite(source.priority))
        imported.priority = source.priority;
    if (typeof source.expiresAt === 'number' && Number.isFinite(source.expiresAt))
        imported.expiresAt = source.expiresAt;
    if (typeof source.createdAt === 'number' && Number.isFinite(source.createdAt))
        imported.createdAt = source.createdAt;
    if (
        (typeof source.lastUsed === 'number' && Number.isFinite(source.lastUsed)) ||
        source.lastUsed === null
    )
        imported.lastUsed = source.lastUsed as number | null;
    if (
        (typeof source.maxBudget === 'number' && Number.isFinite(source.maxBudget)) ||
        source.maxBudget === null
    )
        imported.maxBudget = source.maxBudget as number | null;
    if (typeof source.monthlySpend === 'number' && Number.isFinite(source.monthlySpend))
        imported.monthlySpend = source.monthlySpend;
    if (isStringArray(source.tags)) imported.tags = source.tags;
    if (isStringArray(source.availableModels)) imported.availableModels = source.availableModels;

    return imported;
}

export function computeActiveKeys(keys: ApiKey[]): ApiKey[] {
    return keys.filter((k) => k.status === 'active');
}

export function computeActiveCount(keys: ApiKey[]): number {
    return keys.reduce((acc, k) => acc + (k.status === 'active' ? 1 : 0), 0);
}

export function computeErrorCount(keys: ApiKey[]): number {
    return keys.reduce((acc, k) => acc + (k.status === 'error' ? 1 : 0), 0);
}
