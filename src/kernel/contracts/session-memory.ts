import type { ILifecycle } from './lifecycle';

/** Kinds of per-session scratchpad facts kept while a coding agent works. */
export type SessionMemoryKind = 'objective' | 'file' | 'command' | 'decision' | 'issue' | 'note';

export interface SessionMemoryItem {
    kind: SessionMemoryKind;
    text: string;
    /** Last time this item was (re)recorded. */
    at: number;
}

export interface SessionMemoryRecord {
    sessionId: string;
    objective?: string;
    items: SessionMemoryItem[];
    createdAt: number;
    updatedAt: number;
}

/**
 * Session-scoped scratchpad memory (Claude-Mem style): the small, durable set of
 * facts a coding agent accumulates within one session — the objective, files and
 * commands touched, decisions taken and open issues. Persisted per session and
 * rendered into a compact context block. Distinct from long-term mesh memory.
 */
export interface ISessionMemoryService extends ILifecycle {
    /** Record an item; duplicates (same kind+text) are refreshed, not appended. */
    remember(sessionId: string, kind: SessionMemoryKind, text: string): Promise<SessionMemoryItem>;
    /** Set the session objective only if none is set yet (first-write-wins). */
    setObjectiveIfEmpty(sessionId: string, text: string): Promise<boolean>;
    /** Read the persisted record, or undefined if the session is unknown. */
    get(sessionId: string): SessionMemoryRecord | undefined;
    /** Read or create an empty record for the session. */
    snapshot(sessionId: string): SessionMemoryRecord;
    /** Compact markdown context block, or '' when the session has nothing. */
    buildContext(sessionId: string, options?: { maxItems?: number }): string;
    clear(sessionId: string): Promise<void>;
    list(): SessionMemoryRecord[];
}
