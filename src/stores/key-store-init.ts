import { liveQuery } from 'dexie';
import { eventBus, EVENTS, keyService, groupManager } from './key-store-deps';
import { getDexieDb, rootLogger } from '../kernel/instances';
const LOGGER = rootLogger.child('KeyStore');
import type { ApiKey, ProviderAlert } from '../types/metrics';
import type { KeyMeta } from './key-store-utils';
import { computeActiveKeys, computeActiveCount, computeErrorCount } from './key-store-utils';

export interface KeyStoreState {
    keys: ApiKey[];
    activeKeys: ApiKey[];
    alerts: ProviderAlert[];
    checkingIds: Set<string>;
    totalKeys: number;
    activeCount: number;
    errorCount: number;
    keyMeta: Map<string, KeyMeta>;
    isLoaded: boolean;
}

type SetFn = (
    partial: Partial<KeyStoreState> | ((prev: KeyStoreState) => Partial<KeyStoreState>),
) => void;

let liveSub: { unsubscribe: () => void } | null = null;
let initialized = false;
const unsubs: (() => void)[] = [];

export function ensureInitialized(set: SetFn): void {
    if (initialized) return;
    initialized = true;

    const db = getDexieDb();
    const observable = liveQuery(() => db.apiKeys.toArray());
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    liveSub = observable.subscribe({
        next: (keys: ApiKey[]) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
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
                try {
                    eventBus.emit(EVENTS.KEY_STORE_GAUGES, {
                        activeCount,
                        errorCount,
                        alertCount: 0,
                        totalCount: keys.length,
                    });
                } catch {
                    /* best-effort */
                }
            }, 200);
        },
        error: (err: unknown) => {
            LOGGER.warn('KeyStore', 'liveQuery error', { error: err });
            const fallback = groupManager?.getAllKeys?.() || [];
            if (fallback.length > 0) {
                set(() => ({
                    keys: fallback,
                    activeKeys: computeActiveKeys(fallback),
                    isLoaded: true,
                }));
            }
        },
    });

    const refreshAlerts = () => {
        if (keyService.getAlerts) {
            set(() => ({ alerts: keyService.getAlerts() }));
        }
    };
    unsubs.push(eventBus.on(EVENTS.KEY_LATENCY_BURST, refreshAlerts));
    unsubs.push(eventBus.on(EVENTS.KEY_HEALTH_CHECK_FAILED, refreshAlerts));
    unsubs.push(eventBus.on(EVENTS.KEY_QUOTA_EXCEEDED, refreshAlerts));
    unsubs.push(eventBus.on(EVENTS.NOTIFICATION, refreshAlerts));

    unsubs.push(
        eventBus.onSafe<{ id: string }>(EVENTS.KEY_STATE_CHANGED, (data) => {
            if (!data?.id) return;
            const meta = keyService.isKeyInBackoff(data.id);
            const key = keyService.getKey(data.id);
            const errorCount = key?.stats?.errorCount ?? 0;
            set((state) => {
                const nextMeta = new Map(state.keyMeta);
                if (!meta.backoff || meta.remainingMs <= 0) {
                    nextMeta.delete(data.id);
                } else {
                    nextMeta.set(data.id, {
                        backoff: meta.backoff,
                        backoffRemainingMs: meta.remainingMs,
                        consecutiveErrors: errorCount,
                    });
                }
                return { keyMeta: nextMeta };
            });
        }),
    );

    const checkingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    unsubs.push(
        eventBus.on(EVENTS.KEY_HEALTH_CHECK_STARTED, (data) => {
            if (typeof data === 'string') {
                set((state) => {
                    const next = new Set(state.checkingIds);
                    next.add(data);
                    return { checkingIds: next };
                });
                const existing = checkingTimers.get(data);
                if (existing) clearTimeout(existing);
                checkingTimers.set(
                    data,
                    setTimeout(() => {
                        checkingTimers.delete(data);
                        set((state) => {
                            const next = new Set(state.checkingIds);
                            next.delete(data);
                            return { checkingIds: next };
                        });
                    }, 30000),
                );
            }
        }),
    );

    unsubs.push(
        eventBus.onSafe<{ id: string }>(EVENTS.KEY_HEALTH_CHECK_COMPLETED, (data) => {
            if (data?.id) {
                const timer = checkingTimers.get(data.id);
                if (timer) {
                    clearTimeout(timer);
                    checkingTimers.delete(data.id);
                }
                set((state) => {
                    const next = new Set(state.checkingIds);
                    next.delete(data.id);
                    return { checkingIds: next };
                });
            }
        }),
    );

    if (typeof window !== 'undefined') {
        (window as unknown as { __cleanupKeyStore?: () => void }).__cleanupKeyStore = () => {
            liveSub?.unsubscribe();
            liveSub = null;
            for (const unSub of unsubs) unSub();
            unsubs.length = 0;
            initialized = false;
        };
    }

    if (import.meta.hot) {
        import.meta.hot.dispose(() => {
            liveSub?.unsubscribe();
            liveSub = null;
            for (const u of unsubs) u();
            unsubs.length = 0;
            initialized = false;
        });
    }

    const latestKeys = groupManager?.getAllKeys?.() || [];
    if (latestKeys.length > 0) {
        set(() => ({
            keys: latestKeys,
            activeKeys: computeActiveKeys(latestKeys),
        }));
    }
}
