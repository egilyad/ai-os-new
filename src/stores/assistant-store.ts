/**
 * AssistantStore — the chat surface of the project assistant.
 *
 * It owns only the conversation view: the brain (context assembly, actions,
 * permissions) lives in the kernel's AssistantService. Streaming arrives as
 * events, so the panel stays dumb.
 */
import { create } from 'zustand';
import { projectAssistantService, assistantDiaryService } from '../kernel/instances/services-core';
import { eventBus } from '../kernel/instances/events';
import { EVENTS } from '../kernel/events/event-names';

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
    send: (text: string) => Promise<void>;
    setKey: (keyId: string | null) => void;
    refreshSelf: () => void;
    clear: () => void;
}

const KEY_STORAGE_KEY = 'assistant.keyId';

function readStoredKey(): string | null {
    try {
        const v = localStorage.getItem(KEY_STORAGE_KEY);
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
}

let counter = 0;
function nextId(prefix: string): string {
    counter += 1;
    return `${prefix}-${Date.now()}-${counter}`;
}

function notePending(state: AssistantState, patch: (m: AssistantMessage) => AssistantMessage) {
    const index = [...state.messages].reverse().findIndex((m) => m.role === 'assistant' && m.pending);
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

let subscribed = false;
function ensureSubscribed(set: (fn: (s: AssistantState) => Partial<AssistantState>) => void) {
    if (subscribed) return;
    subscribed = true;

    eventBus.on(EVENTS.ASSISTANT_CHUNK, (payload: ChunkPayload) => {
        set((s) => ({
            messages: notePending(s, (m) => ({ ...m, content: m.content + (payload?.chunk ?? '') })),
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
        set((s) => ({
            messages: notePending(s, (m) => ({
                ...m,
                content: payload?.content || m.content,
                pending: false,
            })),
            busy: false,
            diary: readDiary(),
            self: readSelf(),
        }));
    });
}

export const useAssistantStore = create<AssistantState>((set, get) => {
    ensureSubscribed(set as never);

    return {
        messages: [],
        busy: false,
        error: null,
        diary: [],
        self: readSelf(),
        keyId: readStoredKey(),

        send: async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || get().busy) return;

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

            try {
                const result = await projectAssistantService.ask({
                    text: trimmed,
                    keyId: get().keyId ?? undefined,
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
            } catch (e) {
                const detail = e instanceof Error ? e.message : String(e);
                set((s) => ({
                    messages: s.messages.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  // The reason of the failure belongs in the
                                  // answer, not only in the strip below.
                                  content: m.content || `Не получилось получить ответ: ${detail}`,
                                  pending: false,
                              }
                            : m,
                    ),
                    busy: false,
                    error: detail,
                    self: readSelf(),
                }));
            }
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

        clear: () =>
            set({ messages: [], busy: false, error: null, diary: [], self: readSelf() }),
    };
});
