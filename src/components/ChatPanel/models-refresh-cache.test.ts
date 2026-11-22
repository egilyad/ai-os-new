import { beforeEach, describe, it, expect, vi } from 'vitest';

const storage = vi.hoisted(() => {
    const data = new Map<string, string>();
    return {
        data,
        getItem: vi.fn((key: string) => data.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            data.set(key, value);
        }),
    };
});

vi.mock('../../kernel/instances', () => ({ storageAdapter: storage }));

import {
    MODELS_REFRESH_TTL_MS,
    markModelsRefreshed,
    shouldRefreshModels,
} from './models-refresh-cache';

const NOW = 1_700_000_000_000;

describe('models refresh cache', () => {
    beforeEach(() => {
        storage.data.clear();
        storage.getItem.mockClear();
        storage.setItem.mockClear();
    });

    it('treats a fresh key as not stale', () => {
        expect(shouldRefreshModels('k1', NOW - 1000, NOW)).toBe(false);
    });

    it('treats a key older than TTL as stale', () => {
        expect(shouldRefreshModels('k1', NOW - MODELS_REFRESH_TTL_MS - 1, NOW)).toBe(true);
    });

    it('marks a refresh and stops reporting stale', () => {
        expect(shouldRefreshModels('k1', 0, NOW)).toBe(true);
        markModelsRefreshed('k1', NOW);
        expect(shouldRefreshModels('k1', 0, NOW)).toBe(false);
    });
});
