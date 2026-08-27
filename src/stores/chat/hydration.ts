import { useEffect } from 'react';
import { liveQuery } from 'dexie';
import { useChatStore } from './store';
import type { ChatSession } from './types';
import { DEFAULT_SESSION } from './types';
import type { SessionStore } from '../../kernel/contracts/storage/session-store';
import { runtime } from '../../kernel/runtime';
import { BucketStorageAdapter } from '../../kernel/storage-adapter-instance';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { getDexieDb, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ChatHydration');

function cleanupOrphanLoading(sessions: ChatSession[]): ChatSession[] {
    let changed = false;
    const cleaned = sessions.map((s) => {
        const history = s.history.map((e) => {
            const responses = e.responses.map((r) => {
                if (r.status === 'loading' || r.status === 'streaming') {
                    changed = true;
                    return { ...r, status: 'error' as const, error: 'Session was interrupted' };
                }
                return r;
            });
            return responses === e.responses ? e : { ...e, responses };
        });
        return history === s.history ? s : { ...s, history };
    });
    return changed ? cleaned : sessions;
}

let _sessionStore: SessionStore | null = null;
function resolveSessionStore(): SessionStore | null {
    if (_sessionStore) return _sessionStore;
    _sessionStore =
        runtime.getService<{ sessions: SessionStore }>('storageLayer')?.sessions ?? null;
    return _sessionStore;
}

let _lqEpoch = 0;

export function useChatStoreHydration(): void {
    useEffect(() => {
        let cancelled = false;
        let syncTimer: ReturnType<typeof setTimeout> | null = null;
        let lastFlushEpoch = 0;

        const flush = async () => {
            if (syncTimer) {
                clearTimeout(syncTimer);
                syncTimer = null;
            }
            // prevent the finally setState from re-triggering flush
            lastFlushEpoch = _lqEpoch;
            const sStore = resolveSessionStore();
            if (!sStore) return;
            const state = useChatStore.getState();
            const syncedDeletes = [...state.deletedIds];
            try {
                await sStore.syncSessions(state.sessions, syncedDeletes);
            } catch (e) {
                console.error('[ChatStore] Failed to sync to Dexie', e);
            } finally {
                useChatStore.setState((prev) => {
                    const remaining = new Set(prev.deletedIds);
                    for (const id of syncedDeletes) remaining.delete(id);
                    return { deletedIds: remaining };
                });
            }
        };

        const migrateLegacy = async () => {
            const sStore = resolveSessionStore();
            if (!sStore) return;
            const legacyData = BucketStorageAdapter.getItem('super_agents_chat_sessions');
            if (!legacyData) return;
            try {
                const parsed = safeJsonParse(legacyData) as ChatSession[];
                if (parsed.length > 0) {
                    for (const session of parsed) {
                        const existing = await sStore.getSession(session.id);
                        if (!existing) await sStore.put(session);
                    }
                }
            } catch (err) {
                LOGGER.warn('ChatHydration', 'corrupt localStorage data', { error: err });
            }
            BucketStorageAdapter.removeItem('super_agents_chat_sessions');
            BucketStorageAdapter.removeItem('super_agents_chat_sessions_ts');
        };

        const restoreBackup = async () => {
            const backupData = BucketStorageAdapter.getItem('super_agents_chat_sessions_backup');
            if (!backupData) return;
            BucketStorageAdapter.removeItem('super_agents_chat_sessions_backup');
            const sStore = resolveSessionStore();
            if (!sStore) return;
            try {
                const parsed = safeJsonParse(backupData) as ChatSession[];
                if (parsed.length > 0) {
                    for (const session of parsed) {
                        const existing = await sStore.getSession(session.id);
                        if (!existing) await sStore.put(session);
                    }
                }
            } catch (err) {
                LOGGER.warn('ChatHydration', 'corrupt backup', { error: err });
            }
        };

        migrateLegacy().catch((e) => console.error('[Hydration] migrateLegacy failed', e));
        void restoreBackup().catch((e) =>
            LOGGER.warn('ChatHydration', 'restoreBackup failed', { error: e }),
        );

        const db = getDexieDb();
        const observable = liveQuery(() =>
            db.sessions.orderBy('updatedAt').reverse().limit(100).toArray(),
        );
        const subscription = observable.subscribe({
            next: (sessions: ChatSession[]) => {
                if (cancelled) return;
                const current = useChatStore.getState();

                if (!current.isLoaded) {
                    const cleaned = cleanupOrphanLoading(sessions);
                    db.sessions.count().then((total) => {
                        if (!cancelled) {
                            _lqEpoch++;
                            useChatStore.setState({
                                sessions: cleaned,
                                activeSessionId: cleaned[0]?.id ?? DEFAULT_SESSION.id,
                                hasMoreSessions: total > 100,
                                isLoaded: true,
                                activeRequestIds: new Set(),
                            });
                        }
                    });
                    return;
                }

                const currentMap = new Map(current.sessions.map((s) => [s.id, s]));
                let changed = sessions.length !== current.sessions.length;
                if (!changed) {
                    for (const cs of sessions) {
                        const cur = currentMap.get(cs.id);
                        if (!cur || cur.updatedAt !== cs.updatedAt) {
                            changed = true;
                            break;
                        }
                    }
                }
                if (!changed) return;

                const merged = [...sessions];
                for (const [id, cur] of currentMap) {
                    const existing = merged.find((s) => s.id === id);
                    if (existing) {
                        if (cur.updatedAt < existing.updatedAt) continue;
                    }
                    merged.push(cur);
                }
                merged.sort((a, b) => b.updatedAt - a.updatedAt);
                db.sessions.count().then((total) => {
                    if (!cancelled) {
                        _lqEpoch++;
                        useChatStore.setState({ sessions: merged, hasMoreSessions: total > 100 });
                    }
                });
            },
            error: (err: unknown) => {
                LOGGER.warn('ChatHydration', 'liveQuery error', { error: err });
                if (!useChatStore.getState().isLoaded) {
                    useChatStore.setState({ isLoaded: true });
                }
            },
        });

        const unsubPersist = useChatStore.subscribe((state) => {
            if (!state.isLoaded) return;
            // Skip flush if latest state was set by liveQuery (data already in Dexie)
            if (_lqEpoch !== lastFlushEpoch) {
                lastFlushEpoch = _lqEpoch;
                return;
            }
            if (syncTimer) clearTimeout(syncTimer);
            syncTimer = setTimeout(flush, 1000);
        });

        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') flush();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const handleBeforeUnload = () => {
            const state = useChatStore.getState();
            if (state.sessions.length > 0) {
                try {
                    const json = JSON.stringify(state.sessions);
                    if (json.length < 4_500_000) {
                        BucketStorageAdapter.setItem('super_agents_chat_sessions_backup', json);
                    } else {
                        const trimmed = state.sessions.slice(-5);
                        BucketStorageAdapter.setItem(
                            'super_agents_chat_sessions_backup',
                            JSON.stringify(trimmed),
                        );
                    }
                } catch {
                    // localStorage quota exceeded — backup silently skipped
                }
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            cancelled = true;
            subscription.unsubscribe();
            if (syncTimer) clearTimeout(syncTimer);
            unsubPersist();
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);
}
