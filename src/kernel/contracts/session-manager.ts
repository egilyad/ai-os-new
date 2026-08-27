import type { DebateSession } from './debate-types';

export type SessionType = 'debate' | 'chat';

export type SessionStatus = 'active' | 'paused' | 'completed' | 'archived' | 'failed';

export interface SessionMeta {
    id: string;
    type: SessionType;
    title: string;
    status: SessionStatus;
    tags: string[];
    folder: string;
    isArchived: boolean;
    isPinned: boolean;
    createdAt: number;
    updatedAt: number;
    linkedSessionIds: string[];
    linkedDebateId?: string;
}

export interface SessionLink {
    id: string;
    fromId: string;
    toId: string;
    linkType: 'chat_to_debate' | 'debate_to_chat' | 'continuation' | 'derivative';
    context: string;
    createdAt: number;
}

export interface SessionFilters {
    type?: SessionType;
    status?: SessionStatus;
    tags?: string[];
    folder?: string;
    search?: string;
    isArchived?: boolean;
}

export interface DebateTimelineEntry {
    id: string;
    sessionId: string;
    timestamp: number;
    type: string;
    payload: string;
}

export interface DebateOverride {
    id: string;
    sessionId: string;
    type: string;
    payload: string;
    appliedAt: number;
}

/** Debate-specific fields for create() */
export interface DebateCreateData {
    topologyType?: string;
    participants?: string;
    topology?: string;
    tags?: string[];
    folder?: string;
}

export interface ISessionManager {
    create(
        type: SessionType,
        meta: Partial<SessionMeta>,
        debateData?: DebateCreateData,
    ): Promise<string>;
    load(id: string): Promise<SessionMeta | null>;
    save(id: string): Promise<void>;
    pause(id: string): Promise<void>;
    resume(id: string): Promise<void>;
    list(filters: SessionFilters): Promise<SessionMeta[]>;
    archive(id: string): Promise<void>;
    unarchive(id: string): Promise<void>;
    delete(id: string): Promise<void>;
    link(
        fromId: string,
        toId: string,
        linkType: SessionLink['linkType'],
        context?: string,
    ): Promise<void>;
    getLinked(id: string): Promise<SessionLink[]>;
    updateMeta(id: string, updates: Partial<SessionMeta>): Promise<void>;

    /** Get completed debate history from in-memory cache */
    getDebateHistory(): DebateSession[];
    /** Add a completed debate session to history */
    saveToDebateHistory(session: DebateSession): void;
    /** Restore a completed session (removes from history, returns clone with active status) */
    restoreDebateSession(id: string): DebateSession | null;
    /** Archive a completed session */
    archiveDebateSession(id: string): boolean;
    /** Permanently delete a session from history */
    deleteDebateHistory(id: string): boolean;
    /** Clear all debate history */
    clearDebateHistory(): void;
}
