import type { ChatResponse } from '../../types/chat';
import { eventBus, EVENTS } from './service-deps';
import type { ChatEntry, ChatSession, ZustandSet, ZustandGet } from './types';
import { requestEntryMap } from './types';

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

export function setupChatEventHandlers(set: ZustandSet, _get: ZustandGet): Array<() => void> {
    const unsubs: Array<() => void> = [];

    unsubs.push(
        eventBus.on(EVENTS.MESSAGE_RESPONSE, (res: ChatResponse) => {
            const ref = requestEntryMap.get(res.requestId);
            if (!ref) return;
            set((s) => {
                const newActiveIds = new Set(s.activeRequestIds);
                if (
                    res.status === 'done' ||
                    res.status === 'error' ||
                    res.status === 'cancelled' ||
                    res.status === 'timeout'
                ) {
                    newActiveIds.delete(res.requestId);
                }
                return {
                    sessions: updateEntryInSession(
                        s.sessions,
                        ref.sessionId,
                        ref.entryId,
                        (entry) => ({
                            ...entry,
                            responses: entry.responses.map((r) =>
                                r.requestId === res.requestId ? { ...r, ...res } : r,
                            ),
                        }),
                    ),
                    activeRequestIds: newActiveIds,
                };
            });
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
                                          content: '',
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
        }),
    );

    return unsubs;
}
