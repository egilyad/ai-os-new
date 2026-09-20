import type { ChatResponse } from '../../types/chat';
import { eventBus, EVENTS } from './service-deps';
import { resolveSessionStore } from './store-helpers';
import type { ChatEntry, ChatSession, ZustandSet, ZustandGet } from './types';
import { requestEntryMap } from './types';
import { _sendQueue } from './chat-send-message';

const TERMINAL_STATUSES: ReadonlySet<string> = new Set(['done', 'error', 'cancelled', 'timeout']);

/**
 * FIX(chat-persistence): write the session to Dexie immediately when a response
 * reaches a terminal state. Previously durability relied solely on the 1s debounced
 * flush in hydration.ts, so a crash <1s after STREAM_END lost the tail.
 * The write is idempotent (version CAS in DexieSessionStore.put); the debounced
 * flush remains as a safety net. No feedback loop: put() writes the same updatedAt
 * the liveQuery merge compares against, so it resolves to no-op.
 */
function persistSessionSnapshot(get: ZustandGet, sessionId: string): void {
    try {
        const sStore = resolveSessionStore();
        if (!sStore) return;
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;
        void sStore.put(session).catch((e) => {
            console.error('[ChatStore] terminal persist failed', e);
        });
    } catch (e) {
        console.error('[ChatStore] terminal persist failed', e);
    }
}

/**
 * H-09: fire queued messages once a terminal event frees the sender.
 * The busy gate in sendMessage re-queues instead of dropping, so firing here
 * is lossless: if another session still streams, the message re-queues.
 */
function drainSendQueue(get: ZustandGet, sessionId: string): void {
    const q = _sendQueue.get(sessionId);
    if (!q || q.length === 0) return;
    const pending = q.splice(0, q.length);
    if (q.length === 0) _sendQueue.delete(sessionId);
    for (const next of pending) {
        get()
            .sendMessage(
                next.targets,
                next.text,
                next.systemPromptArg,
                next.temperature,
                next.maxTokens,
            )
            .catch((e: unknown) => {
                console.error('[ChatStore] Queued send failed', e);
            });
    }
}

function updateEntryInSession(
    sessions: ChatSession[],
    sessionId: string,
    entryId: string,
    entryUpdater: (entry: ChatEntry) => ChatEntry,
): ChatSession[] {
    const sessIdx = sessions.findIndex((s) => s.id === sessionId);
    if (sessIdx === -1) return sessions;
    const session = sessions[sessIdx]!;
    const entryIdx = session.history.findIndex((e) => e.id === entryId);
    if (entryIdx === -1) return sessions;
    const next = [...sessions];
    const nextHistory = [...session.history];
    nextHistory[entryIdx] = entryUpdater(nextHistory[entryIdx]!);
    next[sessIdx] = { ...session, history: nextHistory, updatedAt: Date.now() };
    return next;
}

export function setupChatEventHandlers(set: ZustandSet, get: ZustandGet): Array<() => void> {
    const unsubs: Array<() => void> = [];

    unsubs.push(
        eventBus.on(EVENTS.MESSAGE_RESPONSE, (res: ChatResponse) => {
            const ref = requestEntryMap.get(res.requestId);
            if (!ref) return;
            set((s) => {
                const newActiveIds = new Set(s.activeRequestIds);
                if (TERMINAL_STATUSES.has(res.status)) {
                    newActiveIds.delete(res.requestId);
                }
                return {
                    sessions: updateEntryInSession(
                        s.sessions,
                        ref.sessionId,
                        ref.entryId,
                        (entry) => ({
                            ...entry,
                            responses: entry.responses.map((r) => {
                                if (r.requestId !== res.requestId) return r;
                                const merged = { ...r, ...res };
                                // FIX(chat-partial): an error/cancel/timeout payload carries
                                // content:'' — must not wipe an already-streamed prefix.
                                if (
                                    (res.status === 'error' ||
                                        res.status === 'cancelled' ||
                                        res.status === 'timeout') &&
                                    !res.content &&
                                    r.content
                                ) {
                                    merged.content = r.content;
                                }
                                return merged;
                            }),
                        }),
                    ),
                    activeRequestIds: newActiveIds,
                };
            });
            if (TERMINAL_STATUSES.has(res.status)) {
                persistSessionSnapshot(get, ref.sessionId);
            }
        }),
    );

    unsubs.push(
        eventBus.on(EVENTS.STREAM_START, (payload) => {
            const ref = requestEntryMap.get(payload.requestId);
            if (!ref) return;
            set((s) => ({
                sessions: updateEntryInSession(s.sessions, ref.sessionId, ref.entryId, (entry) => ({
                    ...entry,
                    responses: entry.responses.map((r) =>
                        r.requestId === payload.requestId
                            ? { ...r, status: 'streaming' as const }
                            : r,
                    ),
                })),
            }));
        }),
    );

    unsubs.push(
        eventBus.on(EVENTS.STREAM_CHUNK, (payload) => {
            const ref = requestEntryMap.get(payload.requestId);
            if (!ref) return;
            set((s) => ({
                sessions: updateEntryInSession(s.sessions, ref.sessionId, ref.entryId, (entry) => ({
                    ...entry,
                    responses: entry.responses.map((r) =>
                        r.requestId === payload.requestId
                            ? { ...r, content: r.content + payload.chunk }
                            : r,
                    ),
                })),
            }));
        }),
    );

    unsubs.push(
        eventBus.on(EVENTS.STREAM_END, (payload) => {
            if (!payload.requestId) return;
            const ref = requestEntryMap.get(payload.requestId);
            if (!ref) return;
            set((s) => {
                const newActiveIds = new Set(s.activeRequestIds);
                newActiveIds.delete(payload.requestId);
                return {
                    sessions: updateEntryInSession(
                        s.sessions,
                        ref.sessionId,
                        ref.entryId,
                        (entry) => ({
                            ...entry,
                            responses: entry.responses.map((r) =>
                                r.requestId === payload.requestId
                                    ? {
                                          ...r,
                                          content: payload.fullContent || r.content,
                                          latency: payload.latency || r.latency,
                                          tokens: payload.tokens ?? r.tokens,
                                          status: 'done' as const,
                                      }
                                    : r,
                            ),
                        }),
                    ),
                    activeRequestIds: newActiveIds,
                };
            });
            persistSessionSnapshot(get, ref.sessionId);
            drainSendQueue(get, ref.sessionId);
        }),
    );

    unsubs.push(
        eventBus.on(EVENTS.STREAM_ERROR, (payload) => {
            const ref = requestEntryMap.get(payload.requestId);
            if (!ref) return;
            set((s) => {
                const newActiveIds = new Set(s.activeRequestIds);
                newActiveIds.delete(payload.requestId);
                return {
                    sessions: updateEntryInSession(
                        s.sessions,
                        ref.sessionId,
                        ref.entryId,
                        (entry) => ({
                            ...entry,
                            responses: entry.responses.map((r) =>
                                r.requestId === payload.requestId
                                    ? {
                                          ...r,
                                          // FIX(chat-partial): keep the already-streamed prefix;
                                          // previously content:'' discarded it.
                                          content: r.content,
                                          error: payload.error,
                                          status: 'error' as const,
                                      }
                                    : r,
                            ),
                        }),
                    ),
                    activeRequestIds: newActiveIds,
                };
            });
            persistSessionSnapshot(get, ref.sessionId);
            drainSendQueue(get, ref.sessionId);
        }),
    );

    return unsubs;
}
