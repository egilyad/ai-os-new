/**
 * No-op fallback implementations of the UI debate-store contracts.
 *
 * The real adapters live in `src/stores/` (zustand-backed) and are registered
 * into the DI container by the UI composition root. Kernel service-registration
 * phases resolve them via `container.getOptional(...)` and fall back to these
 * in-memory stubs when no UI is present (tests, headless runs). This keeps the
 * kernel free of any `src/stores/` import (layer rule: kernel must not import UI).
 */
import type {
    IDebateSessionStore,
    IDebateLiveStore,
    SessionStoreSubscriber,
} from '../../contracts/debate-store';
import type { DebateSession } from '../../contracts/debate-types';

/** In-memory stub for the active-debate session store. */
export function createFallbackDebateSessionStore(): IDebateSessionStore {
    const sessions = new Map<string, { session: DebateSession | null; governorState: unknown }>();
    let activeSessionId: string | null = null;
    return {
        get session() {
            const e = activeSessionId ? sessions.get(activeSessionId) : undefined;
            return e?.session ?? null;
        },
        get governorState() {
            const e = activeSessionId ? sessions.get(activeSessionId) : undefined;
            return e?.governorState ?? null;
        },
        setSession: (s) => {
            if (!s) {
                activeSessionId = null;
                return;
            }
            sessions.set(s.id, {
                session: s,
                governorState: sessions.get(s.id)?.governorState ?? null,
            });
            activeSessionId = s.id;
        },
        upsertSession: (s) => {
            if (!s) return;
            sessions.set(s.id, {
                session: s,
                governorState: sessions.get(s.id)?.governorState ?? null,
            });
        },
        setGovernorState: (state) => {
            if (activeSessionId) {
                const e = sessions.get(activeSessionId);
                if (e) e.governorState = state;
            }
        },
        setGovernorStateFor: (id, state) => {
            const e = sessions.get(id);
            if (e) e.governorState = state;
        },
        setActiveSessionId: (id) => {
            activeSessionId = id;
        },
        getSession: (id) => sessions.get(id)?.session ?? null,
        clearSession: (id) => {
            sessions.delete(id);
            if (activeSessionId === id) activeSessionId = null;
        },
        clearAll: () => {
            sessions.clear();
            activeSessionId = null;
        },
    };
}

/** In-memory stub for the live debate UI store. */
export function createFallbackDebateLiveStore(): IDebateLiveStore {
    return {
        streamingContent: new Map(),
        emotions: new Map(),
        agentCountdowns: new Map(),
        agentAddressing: new Map(),
        memoryBubbles: new Map(),
        currentThinking: new Map(),
        agentEvents: [],
        roundEvents: [],
        clearSession: () => {
            /* no-op */
        },
        clearAll: () => {
            /* no-op */
        },
    };
}

/** No-op session-change subscriber for headless runs. */
export const fallbackSessionStoreSubscriber: SessionStoreSubscriber = () => () => {};
