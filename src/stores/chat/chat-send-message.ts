import type { ChatResponse } from '../../types/chat';
import type { ChatMessage } from '../../kernel/types/llm-types';
import { CONFIG, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ChatStore');
import {
    eventBus,
    EVENTS,
    executionGovernor,
    memoryService,
    workspaceService,
    getDistributedLock,
} from './service-deps';
import type { ChatEntry, ZustandSet, ZustandGet, ChatStoreShape } from './types';
import { genId, MAX_HISTORY, requestEntryMap } from './types';
import { resolveSessionStore, updateSessionInList } from './store-helpers';

interface QueuedMessage {
    targets: Array<{ provider: string; model: string; keyId?: string }>;
    text: string;
    systemPromptArg?: string;
    temperature?: number;
    maxTokens?: number;
}

export const _sendQueue = new Map<string, QueuedMessage[]>();
const MAX_QUEUE_SIZE = 50;
export const _historyLimitWarned = new Set<string>();

export function createSendMessageHandler(
    set: ZustandSet,
    get: ZustandGet,
): ChatStoreShape['sendMessage'] {
    return async (targets, text, systemPromptArg, temperature, maxTokens) => {
        const sessionId = get().activeSessionId;
        const existing = _sendQueue.get(sessionId);
        if (existing) {
            if (existing.length >= MAX_QUEUE_SIZE) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Send queue full (${MAX_QUEUE_SIZE}) — message dropped`,
                    type: 'warning',
                });
                return;
            }
            existing.push({ targets, text, systemPromptArg, temperature, maxTokens });
            return;
        }
        _sendQueue.set(sessionId, []);
        const requestId = `chat-${crypto.randomUUID()}`;
        const entryId = crypto.randomUUID();
        let requestIdsToTrack: string[] = [];
        let govOp;
        let currentHistory: ChatEntry[];
        const distLock = getDistributedLock();
        const lockResult = await distLock.acquire(`chat:${sessionId}`, { ttl: 120_000 });
        if (!lockResult.lock) {
            LOGGER.warn('ChatStore', 'Failed to acquire chat lock, proceeding without lock', {
                error: lockResult.error,
            });
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Failed to acquire chat lock — concurrent send may conflict',
                type: 'warning',
            });
        }
        try {
            currentHistory = (get().sessions.find((s) => s.id === sessionId)?.history ?? []).slice(
                -MAX_HISTORY,
            );
            requestIdsToTrack =
                targets.length > 1
                    ? targets.map((t, idx) => `${requestId}-${t.provider}-${t.keyId ?? idx}`)
                    : [requestId];
            govOp = executionGovernor.start({
                type: 'send-message',
                timeoutMs: 120_000,
                metadata: { textPreview: text.slice(0, 80) },
            });
            if (get().isAnySending()) {
                LOGGER.warn('ChatStore', 'sendMessage already in progress, ignored');
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Cannot send — another message is still being sent',
                    type: 'warning',
                });
                govOp.complete();
                return;
            }
            requestIdsToTrack.forEach((rid) => get().addActiveRequestId(rid));

            const cancelGuard = () => {
                const ids = get().activeRequestIds;
                const anyActive = requestIdsToTrack.some((rid) => ids.has(rid));
                if (!anyActive) throw new Error('CANCELLED');
            };

            let relatedMemories: Array<{ entry: { content: string }; score?: number }> = [];
            if (CONFIG.featureFlags.memory.ragOnChat) {
                try {
                    relatedMemories = (await memoryService.search(text, 3)) || [];
                } catch (e) {
                    LOGGER.warn('ChatStore', 'Memory search failed', { error: e });
                }
                cancelGuard();
            }
            const contextPrefix =
                relatedMemories.length > 0
                    ? `[RECALLED CONTEXT]\n${relatedMemories.map((m) => `- ${m.entry.content}`).join('\n')}\n\n`
                    : '';

            if (CONFIG.featureFlags.memory.autoStore) {
                try {
                    await memoryService.store({
                        content: text,
                        metadata: {
                            source: 'user',
                            type: 'chat_query' as const,
                            timestamp: Date.now(),
                            importance: 0.5,
                            chatId: sessionId,
                        },
                    });
                } catch (e) {
                    LOGGER.warn('ChatStore', 'Memory store failed', { error: e });
                }
                cancelGuard();
            }

            const workspaceContext = workspaceService.isAttached()
                ? (await workspaceService.getFileTreeSnapshot()).slice(0, 5000)
                : null;
            cancelGuard();

            const sanitize = (content: string): string =>
                content
                    .replace(/^(system|SYSTEM|System)\s*:/gm, '[filtered]:')
                    .replace(
                        /^(IMPORTANT NEW|IGNORE ALL|OVERRIDE|DISREGARD|You are now|From now on|New instructions)/gim,
                        '[filtered]',
                    );

            const messages: ChatMessage[] = [
                ...(systemPromptArg
                    ? [{ role: 'system' as const, content: sanitize(systemPromptArg) }]
                    : []),
                ...(workspaceContext
                    ? [
                          {
                              role: 'system' as const,
                              content: sanitize(
                                  `[WORKSPACE FILES]\n${workspaceContext}\n\nYou can read any file by asking me to use the read_file tool.`,
                              ),
                          },
                      ]
                    : []),
                ...currentHistory.flatMap<ChatMessage>((h) => {
                    if (h.role === 'system')
                        return [{ role: 'system' as const, content: sanitize(h.text) }];
                    return [
                        { role: 'user' as const, content: sanitize(h.text) },
                        ...h.responses
                            .filter((r) => r.status === 'done')
                            .map((r) => ({
                                role: 'assistant' as const,
                                content: sanitize(r.content),
                            })),
                    ];
                }),
                { role: 'user' as const, content: sanitize(contextPrefix + text) },
            ];

            const loadingResponses: ChatResponse[] = targets.map((t, idx) => ({
                id: genId(),
                requestId:
                    targets.length > 1 ? `${requestId}-${t.provider}-${t.keyId ?? idx}` : requestId,
                provider: t.provider,
                model: t.model,
                content: '',
                latency: 0,
                status: 'loading',
            }));

            const newEntry: ChatEntry = {
                id: entryId,
                requestId,
                role: 'user',
                text,
                responses: loadingResponses,
                timestamp: Date.now(),
                recalledMemories: relatedMemories.map((m) => ({
                    content: m.entry.content,
                    score: m.score,
                })),
            };

            const sessBefore = get().sessions.find((s) => s.id === sessionId);
            const wouldExceed = (sessBefore?.history.length ?? 0) >= MAX_HISTORY;
            if (wouldExceed && !_historyLimitWarned.has(sessionId)) {
                _historyLimitWarned.add(sessionId);
                const lostCount = (sessBefore?.history.length ?? 0) - MAX_HISTORY + 1;
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Chat history limit (${MAX_HISTORY} entries) reached — ${lostCount} older message(s) will be removed from context.`,
                    type: 'warning',
                });
            }

            const sStore = resolveSessionStore();
            if (sStore) {
                const currentSessions = get().sessions;
                const stateWithNew = {
                    ...get(),
                    sessions: updateSessionInList(currentSessions, sessionId, {
                        history: [
                            ...(currentSessions.find((x) => x.id === sessionId)?.history ?? []),
                            newEntry,
                        ],
                    }),
                };
                await sStore.syncSessions(stateWithNew.sessions, []).catch((e: unknown) => {
                    console.error(
                        '[ChatStore] write-through persist failed — message not saved',
                        e,
                    );
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: 'Failed to save message in database',
                        type: 'error',
                    });
                    throw e;
                });
            }

            set((s) => ({
                sessions: updateSessionInList(s.sessions, sessionId, {
                    history: [
                        ...(s.sessions.find((x) => x.id === sessionId)?.history ?? []),
                        newEntry,
                    ].slice(-MAX_HISTORY),
                }),
            }));

            for (const resp of loadingResponses) {
                requestEntryMap.set(resp.requestId, { sessionId, entryId });
            }

            targets.forEach((t, idx) => {
                eventBus.emit(EVENTS.SEND_MESSAGE, {
                    requestId: loadingResponses[idx]!.requestId,
                    provider: t.provider,
                    model: t.model,
                    keyId: t.keyId,
                    messages,
                    options: { temperature, maxTokens },
                });
            });

            govOp.complete();
        } catch (e) {
            requestIdsToTrack?.forEach((rid) => get().removeActiveRequestId(rid));
            if (e instanceof Error && e.message === 'CANCELLED') {
                govOp?.complete();
                return;
            }
            govOp?.fail(e instanceof Error ? e : new Error(String(e)));
            throw e;
        } finally {
            if (lockResult.lock) {
                distLock
                    .release(lockResult.lock)
                    .catch((e) =>
                        LOGGER.warn('ChatStore', 'Failed to release chat lock', { error: e }),
                    );
            }
            const q = _sendQueue.get(sessionId);
            if (q && q.length > 0) {
                const next = q.shift()!;
                _sendQueue.delete(sessionId);
                get().sendMessage(
                    next.targets,
                    next.text,
                    next.systemPromptArg,
                    next.temperature,
                    next.maxTokens,
                );
            } else {
                _sendQueue.delete(sessionId);
            }
        }
    };
}
