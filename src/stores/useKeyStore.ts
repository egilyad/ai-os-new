import { create } from 'zustand';
import { useMemo } from 'react';
import { eventBus, EVENTS, keyService, groupManager, keyStateStore } from './key-store-deps';
import { getDexieDb } from '../kernel/instances';
import { tryGetServiceProp } from '../kernel/service-helper';
import type { ApiKey, ProviderAlert } from '../types/metrics';
import {
    parseImportedKey,
    computeActiveKeys,
    computeActiveCount,
    computeErrorCount,
} from './key-store-utils';
import { ensureInitialized, type KeyStoreState } from './key-store-init';

export type { KeyMeta } from './key-store-utils';
export type { KeyStoreState } from './key-store-init';

export interface KeyStoreActions {
    addKey: (data: Omit<ApiKey, 'id' | 'stats'>) => Promise<void>;
    removeKey: (id: string) => Promise<void>;
    updateKey: (id: string, data: Partial<ApiKey>) => Promise<void>;
    checkHealth: (id: string) => void;
    checkAllHealth: () => void;
    toggleKeyStatus: (id: string) => Promise<void>;
    enableAllKeys: () => Promise<void>;
    disableAllKeys: () => Promise<void>;
    exportKeys: () => Promise<string>;
    importKeys: (jsonData: string) => Promise<number>;
    getKeyById: (id: string) => ApiKey | undefined;
    getKeysByProvider: (provider: string) => ApiKey[];
    getAlerts: () => ProviderAlert[];
    resolveAlert: (alertId: string) => void;
    refresh: () => void;
}

type Store = KeyStoreState & KeyStoreActions;

export const useKeyStore = create<Store>((set, get) => {
    ensureInitialized(set);

    return {
        keys: [],
        activeKeys: [],
        alerts: (() => {
            try {
                const gmReady = tryGetServiceProp(groupManager, 'ready');
                const getAlertsFn = tryGetServiceProp(keyService, 'getAlerts');
                return gmReady && typeof getAlertsFn === 'function'
                    ? (getAlertsFn as () => ProviderAlert[])()
                    : [];
            } catch {
                return [];
            }
        })(),
        checkingIds: new Set(),
        keyMeta: new Map(),
        isLoaded: false,
        totalKeys: 0,
        activeCount: 0,
        errorCount: 0,

        addKey: async (data) => {
            await groupManager.createKey(data, { source: 'ui' });
        },

        removeKey: async (id) => {
            await groupManager.deleteKey(id);
        },

        updateKey: async (id, data) => {
            await groupManager.updateKey(id, data);
        },

        checkHealth: (id) => {
            eventBus.emit(EVENTS.CHECK_HEALTH, id);
        },

        checkAllHealth: () => {
            eventBus.emit(EVENTS.CHECK_ALL_HEALTH, undefined);
        },

        toggleKeyStatus: async (id) => {
            const key = get().keys.find((k) => k.id === id);
            if (!key) return;
            await groupManager.syncKeyStatus(id, key.status === 'active' ? 'inactive' : 'active');
        },

        enableAllKeys: async () => {
            const errors: string[] = [];
            for (const k of get().keys) {
                try {
                    await groupManager.syncKeyStatus(k.id, 'active');
                    const currentState = keyStateStore.get(k.id);
                    if (currentState) {
                        keyStateStore.update(k.id, {
                            flags: {
                                circuitOpen: false,
                                rateLimited: false,
                                authFailed: false,
                            },
                            status: 'ready',
                            healthScore: 100,
                            health: {
                                ...currentState.health,
                                errorRate: 0,
                                consecutiveErrors: 0,
                                successRate: 1,
                            },
                        });
                    }
                    await keyService.updateKey(k.id, {
                        status: 'active',
                        stats: {
                            ...k.stats,
                            errorCount: 0,
                            lastError: undefined,
                        },
                    });
                } catch {
                    errors.push(k.id);
                }
            }
            if (errors.length > 0) {
                eventBus.emit(EVENTS.METRICS_ALERT, {
                    id: 'enable-all-keys',
                    metric: 'partial_failure',
                    value: errors.length,
                    severity: 'warning',
                    timestamp: Date.now(),
                });
            }
        },

        disableAllKeys: async () => {
            const errors: string[] = [];
            for (const k of get().keys) {
                try {
                    await groupManager.syncKeyStatus(k.id, 'inactive');
                } catch {
                    errors.push(k.id);
                }
            }
            if (errors.length > 0) {
                eventBus.emit(EVENTS.METRICS_ALERT, {
                    id: 'disable-all-keys',
                    metric: 'partial_failure',
                    value: errors.length,
                    severity: 'warning',
                    timestamp: Date.now(),
                });
            }
        },

        exportKeys: () => keyService.exportKeys(),

        importKeys: async (jsonData) => {
            const imported = JSON.parse(jsonData);
            if (!Array.isArray(imported)) throw new Error('Invalid data format');
            let count = 0;
            const makeFingerprint = (provider: string, label: string, key: string) => {
                let h = 0x811c9dc5;
                for (let i = 0; i < key.length; i++) {
                    h ^= key.charCodeAt(i);
                    h = (h * 0x01000193) >>> 0;
                }
                return `${provider.toLowerCase()}::${label.toLowerCase()}::${h.toString(36)}`;
            };
            const existingFingerprints = new Set(
                get().keys.map((k) => makeFingerprint(k.provider, k.label, k.key)),
            );
            for (const item of imported) {
                const parsed = parseImportedKey(item);
                if (!parsed) continue;
                const fingerprint = makeFingerprint(parsed.provider, parsed.label, parsed.key);
                if (existingFingerprints.has(fingerprint)) continue;
                const result = await groupManager.createKey(parsed, { source: 'import' });
                if (result.ok) {
                    count++;
                    existingFingerprints.add(fingerprint);
                }
            }
            return count;
        },

        getKeyById: (id) => get().keys.find((k) => k.id === id),

        getKeysByProvider: (provider) =>
            get().keys.filter((k) => k.provider.toLowerCase() === provider.toLowerCase()),

        getAlerts: () => (keyService.getAlerts ? keyService.getAlerts() : []),

        resolveAlert: (alertId) => {
            keyService.resolveAlert?.(alertId);
            if (keyService.getAlerts) set(() => ({ alerts: keyService.getAlerts() }));
        },

        refresh: () => {
            const db = getDexieDb();
            db.apiKeys
                .toArray()
                .then((keys) => {
                    const activeCount = computeActiveCount(keys);
                    const errorCount = computeErrorCount(keys);
                    set(() => ({
                        keys,
                        activeKeys: computeActiveKeys(keys),
                        isLoaded: true,
                        totalKeys: keys.length,
                        activeCount,
                        errorCount,
                    }));
                })
                .catch((e: unknown) => console.error('[KeyStore] refresh failed', e));
        },
    };
});

export function useKeyList(): { keys: ApiKey[]; activeKeys: ApiKey[] } {
    const keys = useKeyStore((s) => s.keys);
    const activeKeys = useMemo(() => keys.filter((k) => k.status === 'active'), [keys]);
    return useMemo(() => ({ keys, activeKeys }), [keys, activeKeys]);
}

export function useCheckingIds(): Set<string> {
    return useKeyStore((s) => s.checkingIds);
}

export function useKeySelector<T>(selector: (s: Store) => T): T {
    return useKeyStore(selector);
}

export function refreshKeyStore() {
    const db = getDexieDb();
    db.apiKeys
        .toArray()
        .then((keys) => {
            useKeyStore.setState({
                keys,
                activeKeys: computeActiveKeys(keys),
                isLoaded: true,
            });
        })
        .catch((e: unknown) => console.error('[KeyStore] refresh failed', e));
}
