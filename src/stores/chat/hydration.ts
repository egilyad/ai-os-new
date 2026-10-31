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
import { applyBufferedChunks } from './chat-event-handlers';
import { _sendQueue } from './chat-send-message';
import type { QueuedMessage } from './chat-send-message';
const LOGGER = rootLogger.child('ChatHydration');

const SEND_QUEUE_BACKUP_KEY = 'super_agents_chat_send_queue_backup';

/**
 * Serialize sessions to the localStorage backup, trimming oldest history rather
 * than dropping entire sessions when the budget is exceeded.
 */
function serializeSessionsWithBudget(sessions: ChatSession[]): string | null {
    const json = JSON.stringify(sessions);
    if (json.length < 4_500_000) return json;
    const copy = sessions.map((s) => ({ ...s, history: [...(s.history ?? [])] }));
    while (copy.some((s) => s.history.length > 0)) {
        let maxIdx = -1;
        let maxLen = 0;
        copy.forEach((s, i) => {
            if (s.history.length > maxLen) {
                maxLen = s.history.length;
                maxIdx = i;
            }
        });
        if (maxIdx < 0) break;
        copy[maxIdx] = { ...copy[maxIdx], history: copy[maxIdx].history.slice(1) };
        if (JSON.stringify(copy).length < 4_500_000) break;
    }
    const finalJson = JSON.stringify(copy);
    if (finalJson.length < 4_500_000) return finalJson;
    return JSON.stringify(copy.slice(-20));
}

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
        let lastSyncedSig = '';
        const sessionsSig = (sessions: ChatSession[]): string =>
            `${sessions.length}:${sessions.reduce((m, s) => Math.max(m, s.updatedAt), 0)}`;

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
            // H-08: skip Dexie writes when nothing changed since last sync
            const sig = sessionsSig(state.sessions);
            if (syncedDeletes.length === 0 && sig === lastSyncedSig) return;
            try {
                await sStore.syncSessions(state.sessions, syncedDeletes);
                lastSyncedSig = sessionsSig(useChatStore.getState().sessions);
            } catch (e) {
                console.error('[ChatStore] Failed to sync to Dexie', e);
            } finally {
                // H-08: don't allocate a new Set when nothing was deleted —
                // unconditional setState re-triggers this subscriber forever.
                // NOTE: setState must be skipped entirely (not called with the
                // same reference) — zustand notifies on every setState call.
                if (syncedDeletes.length > 0) {
                    const prev = useChatStore.getState();
                    const remaining = new Set(prev.deletedIds);
                    for (const id of syncedDeletes) remaining.delete(id);
                    if (remaining.size !== prev.deletedIds.size) {
                        useChatStore.setState({ deletedIds: remaining });
                    }
                }
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
                        // 3.9: the backup is newer than Dexie when the 1s
                        // debounced flush didn't survive unload — newer wins,
                        // otherwise ≤1s of tail edits are silently lost.
                        if (!existing) await sStore.put(session);
                        else if ((session.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
                            await sStore.put(session);
                        }
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
                            // FIX(chat-identity): restore the user's last selected session
                            // instead of always jumping to most-recent. Validate: the saved
                            // id may point to a deleted session.
                            let restoredId: string | null;
                            try {
                                restoredId = BucketStorageAdapter.getItem('chat_active_session_id');
                            } catch {
                                restoredId = null;
                            }
                            const ids = new Set(cleaned.map((s) => s.id));
                            // C-03: on fresh install Dexie is empty — seed the default
                            // session instead of pointing activeSessionId at a phantom id.
                            const seeded = cleaned.length > 0 ? cleaned : [{ ...DEFAULT_SESSION }];
                            const activeSessionId =
                                (restoredId && ids.has(restoredId) && restoredId) || seeded[0]!.id;
                            useChatStore.setState({
                                sessions: seeded,
                                activeSessionId,
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
                const mergedIdx = new Map(merged.map((s, i) => [s.id, i] as const));
                for (const [id, cur] of currentMap) {
                    const idx = mergedIdx.get(id);
                    if (idx !== undefined) {
                        const existing = merged[idx]!;
                        if (cur.updatedAt < existing.updatedAt) continue;
                        // replace stale Dexie version with newer in-memory version
                        merged[idx] = cur;
                    } else {
                        merged.push(cur);
                        mergedIdx.set(id, merged.length - 1);
                    }
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
            // P-02: fold buffered stream chunks into the snapshot before backup
            // so an in-flight response tail is not lost on close.
            const sessions = applyBufferedChunks(state.sessions);
            if (sessions !== state.sessions) {
                useChatStore.setState({ sessions });
            }
            if (sessions.length > 0) {
                try {
                    const json = serializeSessionsWithBudget(sessions);
                    if (json) {
                        BucketStorageAdapter.setItem('super_agents_chat_sessions_backup', json);
                    }
                } catch (e) {
                    LOGGER.warn('ChatHydration', 'beforeunload backup skipped', { error: e });
                }
            }
            // P-01: persist unsent queued messages so they are not lost on close.
            try {
                if (_sendQueue.size > 0) {
                    const snapshot: Record<string, QueuedMessage[]> = {};
                    for (const [sessionId, items] of _sendQueue) {
                        if (items && items.length > 0) snapshot[sessionId] = [...items];
                    }
                    if (Object.keys(snapshot).length > 0) {
                        BucketStorageAdapter.setItem(
                            SEND_QUEUE_BACKUP_KEY,
                            JSON.stringify(snapshot),
                        );
                        return;
                    }
                }
                BucketStorageAdapter.removeItem(SEND_QUEUE_BACKUP_KEY);
            } catch {
                /* best-effort */
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        const restoreSendQueue = async () => {
            const raw = BucketStorageAdapter.getItem(SEND_QUEUE_BACKUP_KEY);
            if (!raw) return;
            BucketStorageAdapter.removeItem(SEND_QUEUE_BACKUP_KEY);
            try {
                const queue = safeJsonParse(raw) as Record<string, QueuedMessage[]>;
                const send = useChatStore.getState().sendMessage;
                if (!queue || typeof send !== 'function') return;
                for (const [sessionId, items] of Object.entries(queue)) {
                    for (const item of items ?? []) {
                        useChatStore.setState({ activeSessionId: sessionId });
                        try {
                            await send(
                                item.targets,
                                item.text,
                                item.systemPromptArg,
                                item.temperature,
                                item.maxTokens,
                            );
                        } catch (err) {
                            // Keep replaying remaining items — one failure must not
                            // drop the whole queue silently.
                            LOGGER.warn('ChatHydration', 'restore send queue item failed', {
                                error: err,
                            });
                        }
                    }
                }
            } catch (err) {
                LOGGER.warn('ChatHydration', 'restore send queue failed', { error: err });
            }
        };
        void restoreSendQueue().catch(() => {});

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
