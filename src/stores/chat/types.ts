import type { ChatResponse } from '../../types/chat';

export const MAX_HISTORY = 200;

export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'gemini-3.1-flash-lite': 1048576,
    'gemini-2.0-flash': 1000000,
    'gemini-3.1-pro': 1000000,
    'llama-3.3-70b-versatile': 128000,
    'llama-3.1-8b-instant': 128000,
    'openrouter/auto': 128000,
};

export interface ChatEntry {
    id: string;
    requestId?: string;
    role: 'user' | 'system' | 'assistant';
    text: string;
    responses: ChatResponse[];
    timestamp: number;
    parentId?: string;
    recalledMemories?: { content: string; score?: number }[];
}

export interface ChatSession {
    id: string;
    title: string;
    history: ChatEntry[];
    createdAt: number;
    updatedAt: number;
    version?: number;
    tags?: string[];
    folder?: string;
    isArchived?: boolean;
    isPinned?: boolean;
    summary?: string;
    linkedDebateId?: string;
    currentProvider?: string;
    currentModel?: string;
    currentKeyId?: string;
}

export const DEFAULT_SESSION: ChatSession = {
    id: 'default',
    title: 'New Chat',
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

export const SESSION_BATCH_SIZE = 50;

export const DELETED_IDS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ChatState {
    sessions: ChatSession[];
    activeSessionId: string;
    activeRequestIds: Set<string>;
    deletedIds: Set<string>;
    deletedAtTimestamps: Map<string, number>;
    isLoaded: boolean;
    hasMoreSessions: boolean;
    systemPrompt: string;
}

export interface ChatActions {
    setSessions: (updater: (prev: ChatSession[]) => ChatSession[]) => void;
    setActiveSessionId: (id: string) => void;
    addActiveRequestId: (requestId: string) => void;
    removeActiveRequestId: (requestId: string) => void;
    hasActiveRequestId: (requestId: string) => boolean;
    isAnySending: () => boolean;
    setHasMoreSessions: (v: boolean) => void;
    setSystemPrompt: (s: string) => void;
    setIsLoaded: (v: boolean) => void;
    loadMoreSessions: () => Promise<void>;
    sendMessage: (
        targets: { provider: string; model: string; keyId?: string }[],
        text: string,
        systemPrompt?: string,
        temperature?: number,
        maxTokens?: number,
    ) => Promise<void>;
    cancelSending: () => void;
    cancelMessage: (requestId: string) => void;
    editEntry: (entryId: string, newText: string) => void;
    clearHistory: () => void;
    createSession: (title?: string) => string | Promise<string>;
    deleteSession: (id: string) => void;
    forkSession: (entryId: string, newTitle?: string) => void;
    renameSession: (id: string, title: string) => void;
    archiveSession: (id: string) => void;
    unarchiveSession: (id: string) => void;
    tagSession: (id: string, tags: string[]) => void;
    moveToFolder: (id: string, folder: string) => void;
    pinSession: (id: string) => void;
    importSessions: (importedSessions: ChatSession[]) => void;
    switchModel: (provider: string, model: string) => void;
    switchKey: (keyId: string) => void;
    getSessionConfig: () => { provider?: string; model?: string; keyId?: string } | undefined;
    destroy: () => void;
}

export type ChatStoreShape = ChatState & ChatActions;

export const DEFAULT_HISTORY: ChatEntry[] = [];

export interface RequestEntryRef {
    sessionId: string;
    entryId: string;
}

export const requestEntryMap = new Map<string, RequestEntryRef>();

export function rebuildRequestEntryMap(sessions: ChatSession[]): void {
    const newMap = new Map<string, RequestEntryRef>();
    for (const session of sessions) {
        for (const entry of session.history) {
            if (entry.requestId) {
                newMap.set(entry.requestId, { sessionId: session.id, entryId: entry.id });
            }
            for (const response of entry.responses) {
                if (response.requestId) {
                    newMap.set(response.requestId, { sessionId: session.id, entryId: entry.id });
                }
            }
        }
    }
    requestEntryMap.clear();
    for (const [k, v] of newMap) requestEntryMap.set(k, v);
}

export function genId(): string {
    return `${Date.now()}-${crypto.randomUUID()}`;
}

export function isResponseMatch(
    entry: ChatEntry,
    requestId: string | undefined,
    prefixMatch: (rid: string) => boolean,
): boolean {
    if (!requestId) return false;
    if (entry.requestId === requestId) return true;
    if (entry.requestId && prefixMatch(entry.requestId)) return true;
    return false;
}

export type ZustandSet = (
    partial:
        ChatState | Partial<ChatState> | ((state: ChatState) => ChatState | Partial<ChatState>),
    replace?: boolean,
) => void;
export type ZustandGet = () => ChatStoreShape;
