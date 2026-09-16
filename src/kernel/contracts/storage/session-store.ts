import type { ChatResponse } from '../../types/chat-types';

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

export interface SessionStore {
    saveSession(session: ChatSession): Promise<void>;
    put(session: ChatSession): Promise<void>;
    getSession(id: string): Promise<ChatSession | null>;
    listSessions(limit?: number, offset?: number): Promise<ChatSession[]>;
    listAll(): Promise<ChatSession[]>;
    deleteSession(id: string): Promise<void>;
    updateSession(id: string, changes: Partial<ChatSession>): Promise<void>;
    bulkPut(sessions: ChatSession[]): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    syncSessions(sessions: ChatSession[], deletedIds: string[]): Promise<void>;
    count(): Promise<number>;
    exportAll(): Promise<string>;
    importAll(payload: string): Promise<void>;
    clear(): Promise<void>;
}
