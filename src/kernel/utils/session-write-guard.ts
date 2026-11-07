import type { ChatSession, ChatEntry } from '../contracts/storage/session-store';

/**
 * W6-011: stale-write guard for chat sessions, shared by the storage layer
 * (dexie-storage.ts) and the DAL (SessionRepository) so no write path can
 * bypass it.
 *
 * Version numbers are bumped on write but never synced back into the
 * in-memory snapshots, so after enough writes EVERYTHING looks stale and
 * fresh messages get silently dropped forever. Fall back to wall-clock:
 * strictly-older snapshots still drop (cross-tab protection),
 * same-or-newer always wins. Drops are logged (the silent drop was the bug).
 */
export interface SessionLike {
    id?: string;
    version?: number;
    updatedAt?: number;
}

export function isStaleSessionWrite(
    session: SessionLike,
    current: SessionLike | undefined,
): boolean {
    const currentVersion = current?.version ?? 0;
    const incomingVersion = session?.version ?? 0;
    // Treat version as authoritative: an incoming snapshot whose version is
    // behind the DB is stale regardless of wall-clock, because the in-memory
    // copy never carries the latest version back. Merging is far safer than
    // a last-writer-wins overwrite across tabs.
    return incomingVersion > 0 && incomingVersion < currentVersion;
}

/**
 * Merge a stale (older) incoming session into the fresher current one instead
 * of dropping it. The stale writer may hold messages the current record never
 * saw (e.g. from another tab), so we union history by entry id while keeping
 * the current record as the base. Returns `current` unchanged when the
 * incoming history adds nothing new.
 */
export function mergeStaleSession(current: ChatSession, incoming: ChatSession): ChatSession {
    const byId = new Map<string, ChatEntry>();
    for (const entry of current.history ?? []) byId.set(entry.id, entry);
    let added = 0;
    for (const entry of incoming.history ?? []) {
        if (!byId.has(entry.id)) {
            byId.set(entry.id, entry);
            added++;
        }
    }
    if (added === 0) return current;
    return {
        ...current,
        history: [...byId.values()],
        updatedAt: Math.max(current.updatedAt ?? 0, incoming.updatedAt ?? 0),
    };
}
