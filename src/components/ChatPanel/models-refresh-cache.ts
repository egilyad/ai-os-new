import { storageAdapter } from '../../kernel/instances';

const STORAGE_KEY = 'chat_models_refresh_v1';

export const MODELS_REFRESH_TTL_MS = 24 * 60 * 60 * 1000;

type RefreshMap = Record<string, number>;

function readMap(): RefreshMap {
    try {
        const raw = storageAdapter.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return parsed as RefreshMap;
    } catch {
        return {};
    }
}

export function shouldRefreshModels(keyId: string, createdAt?: number, now = Date.now()): boolean {
    const last = readMap()[keyId] ?? createdAt ?? 0;
    return now - last > MODELS_REFRESH_TTL_MS;
}

export function markModelsRefreshed(keyId: string, now = Date.now()): void {
    const map = readMap();
    map[keyId] = now;
    storageAdapter.setItem(STORAGE_KEY, JSON.stringify(map));
}
