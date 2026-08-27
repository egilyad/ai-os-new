import type { DebateSession } from './debate-types';

export interface IDebateSessionStore {
    readonly session: DebateSession | null;
    readonly governorState: unknown;
    /** Upsert a session and make it the active (viewed) one. */
    setSession(session: DebateSession | null): void;
    /** Upsert a value without stealing focus from another running debate. */
    upsertSession(session: DebateSession | null, makeActive?: boolean): void;
    /** Set governor state for the active (viewed) session. */
    setGovernorState(state: unknown): void;
    /** Set governor state for a specific session id (per-session projection). */
    setGovernorStateFor(sessionId: string, state: unknown): void;
    /** Switch the viewed session. */
    setActiveSessionId(id: string): void;
    /** Read a specific session by id. */
    getSession(id: string): DebateSession | null;
    /** Drop a single session from the projection. */
    clearSession(id: string): void;
    clearAll(): void;
}

export interface IDebateLiveStore {
    streamingContent: Map<string, string>;
    emotions: Map<string, unknown>;
    agentCountdowns: Map<string, unknown>;
    agentAddressing: Map<string, string>;
    memoryBubbles: Map<string, unknown>;
    currentThinking: Map<string, string>;
    agentEvents: { length: number };
    roundEvents: { length: number };
    clearSession(sessionId: string): void;
    clearAll(): void;
}

export type SessionStoreSubscriber = (
    listener: (state: { session: DebateSession | null }) => void,
) => () => void;

/**
 * DI container tokens for the UI-backed debate store adapters.
 *
 * The kernel must not import `src/stores/` (layer rule). The UI composition
 * root registers the zustand-backed adapters into the container under these
 * tokens, and service-registration phases pull them via `getOptional(...)`
 * with a no-op fallback for headless usage (tests / non-UI contexts).
 */
export const DEBATE_SESSION_STORE_ADAPTER = 'debateSessionStoreAdapter';
export const DEBATE_LIVE_STORE_ADAPTER = 'debateLiveStoreAdapter';
export const DEBATE_SESSION_STORE_SUBSCRIBER = 'debateSessionStoreSubscriber';
