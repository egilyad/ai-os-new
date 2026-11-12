/**
 * AssistantStore — the chat surface of the project assistant.
 *
 * It owns only the conversation view: the brain (context assembly, actions,
 * permissions) lives in the kernel's AssistantService. Streaming arrives as
 * events, so the panel stays dumb.
 *
 * History is persisted in the existing Dexie `sessions` table (folder =
 * "assistant"), so it reuses the same storage as the regular chat without a
 * second storage subsystem.
 */
import { create } from 'zustand';
import { projectAssistantService, assistantDiaryService } from '../kernel/instances/services-core';
import { eventBus } from '../kernel/instances/events';
import { getDexieDb } from '../kernel/instances';
import { EVENTS } from '../kernel/events/event-names';
import type { ChatEntry, ChatSession } from '../kernel/contracts/storage/session-store';

export interface AssistantActionTrace {
    action: string;
    group: string;
    status: 'started' | 'done' | 'error' | 'denied';
    detail?: string;
}

export interface AssistantMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    actions: AssistantActionTrace[];
    pending?: boolean;
}

export interface AssistantDiaryRow {
    id: string;
    kind: string;
    text: string;
}

/** The assistant's own node, as the topology sees it. */
export interface AssistantSelfRow {
    id: string;
    name: string;
    status: string;
    mode: string;
    preset: string;
    denials: number;
}

export interface AssistantSessionMeta {
    id: string;
    title: string;
    updatedAt: number;
}

export interface AssistantState {
    messages: AssistantMessage[];
    busy: boolean;
    error: string | null;
    /** The assistant's own recent experience. */
    diary: AssistantDiaryRow[];
    /** Who the assistant is as an agent: node, lifecycle, permission mode. */
    self: AssistantSelfRow | null;
    /** Key id the assistant is pinned to (null = auto-routing). */
    keyId: string | null;
    /** Model the assistant is pinned to (null = key default). */
    modelId: string | null;
    /** Current persisted session id (folder=assistant). */
    sessionId: string | null;
    /** Past assistant sessions, newest first. */
    sessionList: AssistantSessionMeta[];
    isHistoryLoaded: boolean;
    send: (text: string) => Promise<void>;
    cancel: () => void;
    setKey: (keyId: string | null) => void;
    setModel: (modelId: string | null) => void;
    refreshSelf: () => void;
    clear: () => void;
    newSession: () => Promise<void>;
    loadSession: (id: string) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
}

const KEY_STORAGE_KEY = 'assistant.keyId';
const MODEL_STORAGE_KEY = 'assistant.modelId';
const ASSISTANT_FOLDER = 'assistant';
const MAX_ASSISTANT_SESSIONS = 30;

function readStoredKey(): string | null {
    try {
        const v = localStorage.getItem(KEY_STORAGE_KEY);
        return v ? v : null;
    } catch {
        return null;
    }
}

function readStoredModel(): string | null {
    try {
        const v = localStorage.getItem(MODEL_STORAGE_KEY);
        return v ? v : null;
    } catch {
        return null;
    }
}

interface ChunkPayload {
    chunk: string;
}
interface ToolCallPayload extends AssistantActionTrace {
    requestId: string;
}
interface DonePayload {
    content: string;
    cancelled?: boolean;
}

let counter = 0;
function nextId(prefix: string): string {
    counter += 1;
    return `${prefix}-${Date.now()}-${counter}`;
}

function notePending(state: AssistantState, patch: (m: AssistantMessage) => AssistantMessage) {
    const index = [...state.messages]
        .reverse()
        .findIndex((m) => m.role === 'assistant' && m.pending);
    if (index === -1) return state.messages;
    const at = state.messages.length - 1 - index;
    return state.messages.map((m, i) => (i === at ? patch(m) : m));
}

function readDiary(): AssistantDiaryRow[] {
    try {
        return assistantDiaryService
            .recent(5)
            .map((e) => ({ id: e.id, kind: e.kind, text: e.text }));
    } catch {
        return [];
    }
}

function readSelf(): AssistantSelfRow | null {
    try {
        return projectAssistantService.describeSelf();
    } catch {
        return null;
    }
}

function toChatEntry(m: AssistantMessage): ChatEntry {
    return {
        id: m.id,
        role: m.role,
        text: m.content,
        responses: [],
        timestamp: Number(m.id.split('-')[1]) || Date.now(),
    };
}

function fromChatEntry(e: ChatEntry): AssistantMessage {
    return {
        id: e.id,
        role: e.role === 'user' ? 'user' : 'assistant',
        content: e.text,
        actions: [],
    };
}

function sessionTitle(messages: AssistantMessage[]): string {
    const firstUser = messages.find((m) => m.role === 'user');
    if (!firstUser) return 'Диалог с ассистентом';
    const t = firstUser.content.replace(/\s+/g, ' ').trim();
    return t.length > 60 ? `${t.slice(0, 60)}…` : t;
}

async function listAssistantSessions(): Promise<AssistantSessionMeta[]> {
    try {
        const db = getDexieDb();
        const all = await db.sessions.toArray();
        return all
            .filter((s) => s.folder === ASSISTANT_FOLDER)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, MAX_ASSISTANT_SESSIONS)
            .map((s) => ({ id: s.id, title: s.title, updatedAt: s.updatedAt }));
    } catch {
        return [];
    }
}

async function persistSession(
    sessionId: string | null,
    messages: AssistantMessage[],
): Promise<string | null> {
    if (messages.length === 0) return sessionId;
    try {
        const db = getDexieDb();
        const id = sessionId ?? `ast-${Date.now()}`;
        const now = Date.now();
        const existing = sessionId ? await db.sessions.get(id) : undefined;
        const session: ChatSession = {
            id,
            title: existing?.title || sessionTitle(messages),
            history: messages.map(toChatEntry),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            tags: ['assistant'],
            folder: ASSISTANT_FOLDER,
            version: (existing?.version ?? 0) + 1,
        };
        await db.sessions.put(session);
        return id;
    } catch {
        return sessionId;
    }
}

async function loadSessionMessages(id: string): Promise<AssistantMessage[]> {
    try {
        const db = getDexieDb();
        const session = await db.sessions.get(id);
        if (!session) return [];
        return (session.history ?? []).map(fromChatEntry);
    } catch {
        return [];
    }
}

let subscribed = false;
function ensureSubscribed(set: (fn: (s: AssistantState) => Partial<AssistantState>) => void) {
    if (subscribed) return;
    subscribed = true;

    eventBus.on(EVENTS.ASSISTANT_CHUNK, (payload: ChunkPayload) => {
        set((s) => ({
            messages: notePending(s, (m) => ({
                ...m,
                content: m.content + (payload?.chunk ?? ''),
            })),
        }));
    });

    eventBus.on(EVENTS.ASSISTANT_TOOL_CALL, (payload: ToolCallPayload) => {
        if (!payload || payload.status === 'started') return;
        set((s) => ({
            messages: notePending(s, (m) => ({
                ...m,
                actions: [
                    ...m.actions.filter((a) => a.action !== payload.action),
                    {
                        action: payload.action,
                        group: payload.group,
                        status: payload.status,
                        detail: payload.detail,
                    },
                ],
            })),
        }));
    });

    eventBus.on(EVENTS.ASSISTANT_DONE, (payload: DonePayload) => {
        void (async () => {
            let prevSessionId = '';
            let messages: AssistantMessage[] = [];
            set((s) => {
                prevSessionId = s.sessionId ?? '';
                messages = notePending(s, (m) => ({
                    ...m,
                    content: payload?.content || m.content,
                    pending: false,
                }));
                return {
                    messages,
                    busy: false,
                    diary: readDiary(),
                    self: readSelf(),
                };
            });
            const id = await persistSession(prevSessionId || null, messages);
            if (id) {
                const sessionList = await listAssistantSessions();
                set(() => ({ sessionId: id, sessionList }));
            }
        })();
    });
}

export const useAssistantStore = create<AssistantState>((set, get) => {
    ensureSubscribed(set as never);

    let activeAbort: AbortController | null = null;
    let persistTimer: ReturnType<typeof setTimeout> | null = null;

    const schedulePersist = (messages: AssistantMessage[]) => {
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
            persistTimer = null;
            void (async () => {
                const id = await persistSession(get().sessionId, messages);
                if (id && id !== get().sessionId) {
                    set({ sessionId: id });
                }
                set({ sessionList: await listAssistantSessions() });
            })();
        }, 600);
    };

    return {
        messages: [],
        busy: false,
        error: null,
        diary: [],
        self: readSelf(),
        keyId: readStoredKey(),
        modelId: readStoredModel(),
        sessionId: null,
        sessionList: [],
        isHistoryLoaded: false,

        send: async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || get().busy) return;

            if (get().messages.length === 0) {
                set({ sessionId: null });
            }

            const assistantId = nextId('assistant');
            set((s) => ({
                messages: [
                    ...s.messages,
                    { id: nextId('user'), role: 'user', content: trimmed, actions: [] },
                    {
                        id: assistantId,
                        role: 'assistant',
                        content: '',
                        actions: [],
                        pending: true,
                    },
                ],
                busy: true,
                error: null,
            }));

            const controller = new AbortController();
            activeAbort = controller;

            try {
                const result = await projectAssistantService.ask({
                    text: trimmed,
                    keyId: get().keyId ?? undefined,
                    model: get().modelId ?? undefined,
                    signal: controller.signal,
                });
                set((s) => ({
                    messages: s.messages.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: result.content || m.content, pending: false }
                            : m,
                    ),
                    busy: false,
                    diary: readDiary(),
                    self: readSelf(),
                }));
                schedulePersist(get().messages);
            } catch (e) {
                const aborted = controller.signal.aborted;
                const detail = e instanceof Error ? e.message : String(e);
                set((s) => ({
                    messages: s.messages.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  content: aborted
                                      ? m.content || 'Остановлено пользователем.'
                                      : m.content || `Не получилось получить ответ: ${detail}`,
                                  pending: false,
                              }
                            : m,
                    ),
                    busy: false,
                    error: aborted ? null : detail,
                    self: readSelf(),
                }));
                if (!aborted) schedulePersist(get().messages);
            } finally {
                if (activeAbort === controller) activeAbort = null;
            }
        },

        cancel: () => {
            activeAbort?.abort();
        },

        refreshSelf: () => set({ self: readSelf() }),

        setKey: (keyId) => {
            try {
                if (keyId) {
                    localStorage.setItem(KEY_STORAGE_KEY, keyId);
                } else {
                    localStorage.removeItem(KEY_STORAGE_KEY);
                }
            } catch {
                /* storage may be unavailable (private mode) */
            }
            set({ keyId });
        },

        setModel: (modelId) => {
            try {
                if (modelId) {
                    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
                } else {
                    localStorage.removeItem(MODEL_STORAGE_KEY);
                }
            } catch {
                /* storage may be unavailable (private mode) */
            }
            set({ modelId });
        },

        clear: () => set({ messages: [], busy: false, error: null, diary: [], self: readSelf() }),

        newSession: async () => {
            activeAbort?.abort();
            set({ messages: [], busy: false, error: null, sessionId: null });
            set({ sessionList: await listAssistantSessions() });
        },

        loadSession: async (id) => {
            if (get().busy) return;
            activeAbort?.abort();
            const messages = await loadSessionMessages(id);
            set({
                messages,
                busy: false,
                error: null,
                sessionId: id,
                sessionList: await listAssistantSessions(),
            });
        },

        deleteSession: async (id) => {
            try {
                await getDexieDb().sessions.delete(id);
            } catch {
                /* best-effort */
            }
            if (get().sessionId === id) {
                set({ sessionId: null, messages: [] });
            }
            set({ sessionList: await listAssistantSessions() });
        },
    };
});

// Load the most recent assistant session once on app start (idempotent).
void (async () => {
    try {
        const sessions = await listAssistantSessions();
        const latest = sessions[0];
        const messages = latest ? await loadSessionMessages(latest.id) : [];
        useAssistantStore.setState({
            sessionId: latest?.id ?? null,
            sessionList: sessions,
            messages,
            isHistoryLoaded: true,
        });
    } catch {
        useAssistantStore.setState({ isHistoryLoaded: true });
    }
})();
