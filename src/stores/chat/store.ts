import { create } from 'zustand';
import { rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ChatStore');
import { eventBus, EVENTS, sessionManager, getDistributedLock } from './service-deps';
import { setupChatEventHandlers } from './chat-event-handlers';
import { createSendMessageHandler, _sendQueue, _historyLimitWarned } from './chat-send-message';
import { resolveSessionStore, updateSessionInList } from './store-helpers';
import type { ChatStoreShape, ChatEntry, ChatSession, ZustandSet, ZustandGet } from './types';
import {
    DEFAULT_SESSION,
    SESSION_BATCH_SIZE,
    MODEL_CONTEXT_WINDOWS,
    DELETED_IDS_TTL,
    rebuildRequestEntryMap,
    requestEntryMap,
} from './types';

const updateActiveSession =
    (set: ZustandSet, get: ZustandGet) =>
    (updater: (history: ChatEntry[]) => ChatEntry[]): void => {
        const id = get().activeSessionId;
        set((s) => ({
            sessions: updateSessionInList(s.sessions, id, {
                history: updater(s.sessions.find((x) => x.id === id)?.history ?? []),
            }),
        }));
    };

export const useChatStore = create<ChatStoreShape>((set, get) => {
    const uas = updateActiveSession(set, get);

    const _unsubs = setupChatEventHandlers(set, get);

    return {
        sessions: [DEFAULT_SESSION],
        activeSessionId: DEFAULT_SESSION.id,
        activeRequestIds: new Set<string>(),
        deletedIds: new Set<string>(),
        deletedAtTimestamps: new Map(),
        isLoaded: false,
        hasMoreSessions: false,
        systemPrompt: '',

        setSessions: (updater) => set((s) => ({ sessions: updater(s.sessions) })),
        setActiveSessionId: (id) => set({ activeSessionId: id }),
        addActiveRequestId: (requestId) =>
            set((s) => {
                const next = new Set(s.activeRequestIds);
                next.add(requestId);
                return { activeRequestIds: next };
            }),
        removeActiveRequestId: (requestId) =>
            set((s) => {
                const newSet = new Set(s.activeRequestIds);
                newSet.delete(requestId);
                return { activeRequestIds: newSet };
            }),
        hasActiveRequestId: (requestId) => get().activeRequestIds.has(requestId),
        isAnySending: () => get().activeRequestIds.size > 0,
        setHasMoreSessions: (v) => set({ hasMoreSessions: v }),
        setSystemPrompt: (s) => set({ systemPrompt: s }),
        setIsLoaded: (v) => set({ isLoaded: v }),

        loadMoreSessions: async () => {
            const sStore = resolveSessionStore();
            if (!sStore) return;
            const offset = get().sessions.length;
            const more = await sStore.listSessions(SESSION_BATCH_SIZE, offset);
            if (more.length > 0) {
                set((s) => {
                    const existing = new Set(s.sessions.map((x) => x.id));
                    const newOnes = more.filter((x) => !existing.has(x.id));
                    if (newOnes.length === 0) return {};
                    return { sessions: [...s.sessions, ...newOnes] };
                });
            }
        },

        sendMessage: createSendMessageHandler(set, get),

        cancelSending: () => {
            const sessions = get().sessions;
            const allLoadingReqs: Array<{ entryId: string; requestId: string; sessionId: string }> =
                [];
            for (const session of sessions) {
                for (const entry of session.history) {
                    for (const r of entry.responses || []) {
                        if (r.status === 'loading' || r.status === 'streaming') {
                            allLoadingReqs.push({
                                entryId: entry.id,
                                requestId: r.requestId,
                                sessionId: session.id,
                            });
                        }
                    }
                }
            }
            if (allLoadingReqs.length === 0) {
                set({ activeRequestIds: new Set() });
                return;
            }
            for (const req of allLoadingReqs) {
                if (req.requestId)
                    eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: req.requestId });
            }
            const sessionIdsToUpdate = new Set(allLoadingReqs.map((r) => r.sessionId));
            set((s) => {
                const newActiveIds = new Set(s.activeRequestIds);
                for (const req of allLoadingReqs) {
                    if (req.requestId) newActiveIds.delete(req.requestId);
                }
                return {
                    activeRequestIds: newActiveIds,
                    sessions: s.sessions.map((session) =>
                        sessionIdsToUpdate.has(session.id)
                            ? {
                                  ...session,
                                  history: session.history.map((e) => ({
                                      ...e,
                                      responses: e.responses.map((r) =>
                                          r.status === 'loading' || r.status === 'streaming'
                                              ? { ...r, status: 'cancelled' as const }
                                              : r,
                                      ),
                                  })),
                              }
                            : session,
                    ),
                };
            });
            for (const sid of sessionIdsToUpdate) {
                _sendQueue.delete(sid);
            }
        },

        cancelMessage: (requestId) => {
            eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId });
        },

        editEntry: async (entryId, newText) => {
            if (get().isAnySending()) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message:
                        'Cannot edit message while a message is being sent. Cancel first or wait for completion.',
                    type: 'warning',
                });
                return;
            }
            const sessionId = get().activeSessionId;
            const distLock = getDistributedLock();
            const lockResult = await distLock.acquire(`chat:${sessionId}`, { ttl: 30_000 });
            if (!lockResult.lock) {
                LOGGER.warn('ChatStore', 'editEntry failed to acquire lock', {
                    error: lockResult.error,
                });
                return;
            }
            try {
                const session = get().sessions.find((s) => s.id === sessionId);
                const oldEntry = session?.history.find((e) => e.id === entryId);
                if (oldEntry) {
                    for (const r of oldEntry.responses) {
                        if (r.status === 'loading' || r.status === 'streaming') {
                            eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: r.requestId });
                            get().removeActiveRequestId(r.requestId);
                        }
                    }
                }
                const sStore = resolveSessionStore();
                if (!sStore) {
                    LOGGER.warn('ChatStore', 'No session store available, editEntry not persisted');
                    return;
                }
                const fullSession = get().sessions.find((s) => s.id === sessionId);
                if (!fullSession) return;
                try {
                    await sStore.put({
                        ...fullSession,
                        history: fullSession.history.map((e) =>
                            e.id === entryId ? { ...e, text: newText, responses: [] } : e,
                        ),
                        updatedAt: Date.now(),
                    });
                } catch (e) {
                    console.error('[ChatStore] Failed to persist editEntry', e);
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: 'Failed to save edited message',
                        type: 'error',
                    });
                    return;
                }
                uas((prev) =>
                    prev.map((e) =>
                        e.id === entryId ? { ...e, text: newText, responses: [] } : e,
                    ),
                );
            } finally {
                distLock
                    .release(lockResult.lock)
                    .catch((e: unknown) =>
                        LOGGER.warn('ChatStore', 'Failed to release editEntry lock', { error: e }),
                    );
            }
        },

        clearHistory: async () => {
            const sessionId = get().activeSessionId;
            const distLock = getDistributedLock();
            const lockResult = await distLock.acquire(`chat:${sessionId}`, { ttl: 30_000 });
            if (!lockResult.lock) {
                LOGGER.warn('ChatStore', 'clearHistory failed to acquire lock', {
                    error: lockResult.error,
                });
                return;
            }
            try {
                const session = get().sessions.find((s) => s.id === sessionId);
                if (session) {
                    const loadingReqs = session.history
                        .flatMap((e) =>
                            (e.responses || []).map((r) => ({
                                requestId: r.requestId,
                                status: r.status,
                            })),
                        )
                        .filter((r) => r.status === 'loading' || r.status === 'streaming');
                    for (const req of loadingReqs) {
                        if (req.requestId)
                            eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: req.requestId });
                    }
                }
                const sStore = resolveSessionStore();
                if (sStore && session) {
                    try {
                        await sStore.put({ ...session, history: [], updatedAt: Date.now() });
                    } catch (e) {
                        console.error('[ChatStore] Failed to persist clearHistory', e);
                        return;
                    }
                }
                uas(() => []);
                set({ activeRequestIds: new Set() });
            } finally {
                distLock.release(lockResult.lock).catch((e: unknown) =>
                    LOGGER.warn('ChatStore', 'Failed to release clearHistory lock', {
                        error: e,
                    }),
                );
            }
        },

        createSession: async (title = 'New Chat') => {
            let id: string;
            try {
                id = await sessionManager.create('chat', { title });
            } catch (e) {
                console.error('[ChatStore] Failed to create session', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to create new chat session',
                    type: 'error',
                });
                return '';
            }
            const newSession: ChatSession = {
                id,
                title,
                history: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            set((s) => ({ sessions: [newSession, ...s.sessions], activeSessionId: id }));
            return id;
        },

        deleteSession: async (id) => {
            for (const [reqId, ref] of requestEntryMap) {
                if (ref.sessionId === id) requestEntryMap.delete(reqId);
            }
            _sendQueue.delete(id);
            try {
                await sessionManager.delete(id);
            } catch (e) {
                console.error('[ChatStore] Failed to persist session deletion', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to delete session in database',
                    type: 'error',
                });
                return;
            }
            set((s) => {
                const now = Date.now();
                const timestamps = new Map(s.deletedAtTimestamps);
                timestamps.set(id, now);
                const expired: string[] = [];
                for (const [tsId, ts] of timestamps) {
                    if (now - ts > DELETED_IDS_TTL) expired.push(tsId);
                }
                for (const tsId of expired) timestamps.delete(tsId);
                const updated = new Set(timestamps.keys());
                if (updated.size > 1000) {
                    const arr = [...updated];
                    updated.clear();
                    for (const x of arr.slice(arr.length - 1000)) updated.add(x);
                    const stale: string[] = [];
                    for (const [tsId] of timestamps) {
                        if (!updated.has(tsId)) stale.push(tsId);
                    }
                    for (const tsId of stale) timestamps.delete(tsId);
                }
                const filtered = s.sessions.filter((x) => x.id !== id);
                if (filtered.length === 0) {
                    const fresh: ChatSession = {
                        id: 'default',
                        title: 'New Chat',
                        history: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };
                    return {
                        sessions: [fresh],
                        activeSessionId: DEFAULT_SESSION.id,
                        deletedIds: updated,
                        deletedAtTimestamps: timestamps,
                    };
                }
                if (s.activeSessionId === id) {
                    return {
                        sessions: filtered,
                        activeSessionId: filtered[0]!.id,
                        deletedIds: updated,
                        deletedAtTimestamps: timestamps,
                    };
                }
                return { sessions: filtered, deletedIds: updated, deletedAtTimestamps: timestamps };
            });
        },

        forkSession: async (entryId, newTitle) => {
            const sessionId = get().activeSessionId;
            const session = get().sessions.find((s) => s.id === sessionId);
            if (!session) return;
            const entryIndex = session.history.findIndex((e) => e.id === entryId);
            if (entryIndex === -1) return;
            const newHistory = session.history.slice(0, entryIndex + 1).map((e) => ({
                ...e,
                id: crypto.randomUUID(),
                requestId: crypto.randomUUID(),
                responses: e.responses.map((r) => ({
                    ...r,
                    requestId: crypto.randomUUID(),
                })),
            }));
            const id = crypto.randomUUID();
            const newSession: ChatSession = {
                id,
                title: newTitle || `Fork of ${session.title}`,
                history: newHistory,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            const sStore = resolveSessionStore();
            if (sStore) {
                try {
                    await sStore.put(newSession);
                } catch (e) {
                    console.error('[ChatStore] Failed to persist forked session', e);
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: 'Failed to save forked session in database',
                        type: 'error',
                    });
                    return;
                }
            }
            set((s) => ({ sessions: [newSession, ...s.sessions], activeSessionId: id }));
            rebuildRequestEntryMap(get().sessions);
        },

        renameSession: async (id, title) => {
            try {
                await sessionManager.updateMeta(id, { title });
            } catch (e) {
                console.error('[ChatStore] Failed to persist session rename', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to rename session in database',
                    type: 'error',
                });
                return;
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, id, { title }),
            }));
        },

        archiveSession: async (id) => {
            try {
                await sessionManager.updateMeta(id, { isArchived: true });
            } catch (e) {
                console.error('[ChatStore] Failed to persist archive state', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to archive session',
                    type: 'error',
                });
                return;
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, id, { isArchived: true }),
            }));
        },

        unarchiveSession: async (id) => {
            try {
                await sessionManager.updateMeta(id, { isArchived: false });
            } catch (e) {
                console.error('[ChatStore] Failed to persist unarchive state', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to unarchive session',
                    type: 'error',
                });
                return;
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, id, { isArchived: false }),
            }));
        },

        tagSession: async (id, tags) => {
            try {
                await sessionManager.updateMeta(id, { tags });
            } catch (e) {
                console.error('[ChatStore] Failed to persist tags', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to save tags',
                    type: 'error',
                });
                return;
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, id, { tags }),
            }));
        },

        moveToFolder: async (id, folder) => {
            try {
                await sessionManager.updateMeta(id, { folder });
            } catch (e) {
                console.error('[ChatStore] Failed to persist folder', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to save folder',
                    type: 'error',
                });
                return;
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, id, { folder }),
            }));
        },

        pinSession: async (id) => {
            const current = get().sessions.find((x) => x.id === id);
            const next = !current?.isPinned;
            try {
                await sessionManager.updateMeta(id, { isPinned: next });
            } catch (e) {
                console.error('[ChatStore] Failed to persist pin state', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to pin session in database',
                    type: 'error',
                });
                return;
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, id, { isPinned: next }),
            }));
        },

        importSessions: async (imported) => {
            const existingIds = new Set(get().sessions.map((x) => x.id));
            const newSessions = imported.filter((x) => !existingIds.has(x.id));
            if (newSessions.length > 0) {
                const sStore = resolveSessionStore();
                if (sStore) {
                    try {
                        await sStore.bulkPut(newSessions);
                    } catch (e) {
                        console.error('[ChatStore] Failed to persist imported sessions', e);
                        eventBus.emit(EVENTS.NOTIFICATION, {
                            message: 'Failed to save imported sessions in database',
                            type: 'error',
                        });
                        return;
                    }
                }
            }
            set((s) => ({ sessions: [...newSessions, ...s.sessions] }));
        },

        switchModel: async (provider, model) => {
            if (get().isAnySending()) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message:
                        'Cannot switch model while a message is being sent. Wait for completion.',
                    type: 'warning',
                });
                return;
            }
            const sessionId = get().activeSessionId;
            const session = get().sessions.find((s) => s.id === sessionId);
            const historyText =
                session?.history
                    .map((h) => h.text + h.responses.map((r) => r.content).join(''))
                    .join('') || '';
            const estimatedTokens = Math.ceil(historyText.length / 4);
            const contextWindow = MODEL_CONTEXT_WINDOWS[model] || 128000;
            if (estimatedTokens > contextWindow * 0.85) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Context (${estimatedTokens} tokens) may exceed ${model} limit (${contextWindow}). Consider starting a new chat.`,
                    type: 'warning',
                });
            }
            const systemEntry: ChatEntry = {
                id: crypto.randomUUID(),
                role: 'system' as const,
                text: `\u{1F504} Switched to ${provider}/${model}`,
                responses: [],
                timestamp: Date.now(),
            };
            const sStore = resolveSessionStore();
            if (sStore) {
                const fullSession = get().sessions.find((s) => s.id === sessionId);
                if (fullSession) {
                    try {
                        await sStore.put({
                            ...fullSession,
                            currentProvider: provider,
                            currentModel: model,
                            history: [...fullSession.history, systemEntry],
                            updatedAt: Date.now(),
                        });
                    } catch (e) {
                        console.error('[ChatStore] Failed to persist switchModel', e);
                        return;
                    }
                }
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, sessionId, {
                    currentProvider: provider,
                    currentModel: model,
                }),
            }));
            uas((prev) => [...prev, systemEntry]);
        },

        switchKey: async (keyId) => {
            if (get().isAnySending()) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message:
                        'Cannot switch key while a message is being sent. Wait for completion.',
                    type: 'warning',
                });
                return;
            }
            const sessionId = get().activeSessionId;
            const keyLabel = keyId?.slice(0, 8) ?? '';
            const systemEntry: ChatEntry = {
                id: crypto.randomUUID(),
                role: 'system' as const,
                text: `\u{1F504} Switched to key ${keyLabel}...`,
                responses: [],
                timestamp: Date.now(),
            };
            const sStore = resolveSessionStore();
            if (sStore) {
                const fullSession = get().sessions.find((s) => s.id === sessionId);
                if (fullSession) {
                    try {
                        await sStore.put({
                            ...fullSession,
                            currentKeyId: keyId,
                            history: [...fullSession.history, systemEntry],
                            updatedAt: Date.now(),
                        });
                    } catch (e) {
                        console.error('[ChatStore] Failed to persist switchKey', e);
                        return;
                    }
                }
            }
            set((s) => ({
                sessions: updateSessionInList(s.sessions, sessionId, { currentKeyId: keyId }),
            }));
            uas((prev) => [...prev, systemEntry]);
        },

        getSessionConfig: () => {
            const sessionId = get().activeSessionId;
            const session = get().sessions.find((s) => s.id === sessionId);
            return session
                ? {
                      provider: session.currentProvider,
                      model: session.currentModel,
                      keyId: session.currentKeyId,
                  }
                : undefined;
        },

        destroy: () => {
            _unsubs.forEach((u) => u());
            _unsubs.length = 0;
            _sendQueue.clear();
            _historyLimitWarned.clear();
        },
    };
});

let _chatStoreDestroyed = false;
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        if (!_chatStoreDestroyed) {
            _chatStoreDestroyed = true;
            useChatStore.getState().destroy();
        }
    });
}
