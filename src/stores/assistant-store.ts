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

export interface AssistantState {
    messages: AssistantMessage[];
    busy: boolean;
    error: string | null;
    /** The assistant's own recent experience. */
    diary: AssistantDiaryRow[];
    send: (text: string) => Promise<void>;
    clear: () => void;
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
                const result = await projectAssistantService.ask({ text: trimmed });
                set((s) => ({
                    messages: s.messages.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: result.content || m.content, pending: false }
                            : m,
                    ),
                    busy: false,
                    diary: readDiary(),
                }));
            } catch (e) {
                const detail = e instanceof Error ? e.message : String(e);
                set((s) => ({
                    messages: s.messages.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  content: m.content || 'Не удалось получить ответ.',
                                  pending: false,
                              }
                            : m,
                    ),
                    busy: false,
                    error: detail,
                }));
            }
        },

        clear: () => set({ messages: [], busy: false, error: null, diary: [] }),
    };
});
