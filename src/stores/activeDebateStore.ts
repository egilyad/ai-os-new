/**
 * Active debate session metadata — which debate is currently selected/active.
 * Separate from debateLiveStore (streaming UI state) and debate-session-store (DB persistence).
 *
 * Multi-session projection (B-15/B-16 Phase 2): holds ALL live/terminal debates
 * keyed by id, with `activeSessionId` selecting which one the UI views. The
 * `DebateSyncManager` keeps the authoritative per-session runtime state; this
 * store is a projection of it (single-view UI — see docs/road/DEBATE_MULTI_SESSION_DESIGN.md).
 */
import { create } from 'zustand';
import type { DebateSession } from '../kernel/contracts/debate-types';
import type { GovernorState } from '../kernel/services/debate-runtime/debate-governor/types';
import type { IDebateSessionStore } from '../kernel/contracts/debate-store';

export type { IDebateSessionStore };

export function createDebateSessionStoreAdapter(): IDebateSessionStore {
    return {
        get session() {
            return useActiveDebateStore.getState().session;
        },
        get governorState() {
            return useActiveDebateStore.getState().governorState;
        },
        setSession: (session) => useActiveDebateStore.getState().setSession(session),
        upsertSession: (session, makeActive) =>
            useActiveDebateStore.getState().upsertSession(session, makeActive),
        setGovernorState: (state) =>
            useActiveDebateStore.getState().setGovernorState(state as never),
        setGovernorStateFor: (id, state) =>
            useActiveDebateStore.getState().setGovernorStateFor(id, state as never),
        setActiveSessionId: (id) => useActiveDebateStore.getState().setActiveSessionId(id),
        getSession: (id) => useActiveDebateStore.getState().getSession(id),
        clearSession: (id) => useActiveDebateStore.getState().clearSession(id),
        clearAll: () => useActiveDebateStore.getState().clearAll(),
    };
}

type SessionEntry = { session: DebateSession | null; governorState: GovernorState | null };

export const useActiveDebateStore = create<{
    sessions: Record<string, SessionEntry>;
    activeSessionId: string | null;
    session: DebateSession | null;
    governorState: GovernorState | null;
    setSession: (session: DebateSession | null) => void;
    upsertSession: (session: DebateSession | null, makeActive?: boolean) => void;
    setGovernorState: (state: GovernorState | null) => void;
    setGovernorStateFor: (sessionId: string, state: GovernorState | null) => void;
    setActiveSessionId: (id: string) => void;
    getSession: (id: string) => DebateSession | null;
    clearSession: (id: string) => void;
    clearAll: () => void;
}>((set, get) => ({
    sessions: {},
    activeSessionId: null,
    session: null,
    governorState: null,
    setSession: (session) => {
        if (!session) {
            set({ activeSessionId: null, session: null });
            return;
        }
        set((s) => {
            const sessions = {
                ...s.sessions,
                [session.id]: {
                    session,
                    governorState: s.sessions[session.id]?.governorState ?? null,
                },
            };
            return {
                sessions,
                activeSessionId: session.id,
                session,
                governorState: s.governorState,
            };
        });
    },
    upsertSession: (session, makeActive = false) => {
        if (!session) return;
        set((s) => {
            const sessions = {
                ...s.sessions,
                [session.id]: {
                    session,
                    governorState: s.sessions[session.id]?.governorState ?? null,
                },
            };
            if (makeActive) {
                return {
                    sessions,
                    activeSessionId: session.id,
                    session,
                    governorState: s.governorState,
                };
            }
            // Keep current view; surface the viewed session's data unchanged.
            const activeId = s.activeSessionId;
            const active = activeId ? (sessions[activeId]?.session ?? null) : null;
            const gov = activeId ? (sessions[activeId]?.governorState ?? null) : null;
            return { sessions, session: active, governorState: gov };
        });
    },
    setGovernorState: (governorState) =>
        set((s) => {
            const activeId = s.activeSessionId;
            if (!activeId) return { governorState };
            const sessions = {
                ...s.sessions,
                [activeId]: { session: s.sessions[activeId]?.session ?? null, governorState },
            };
            return { sessions, governorState };
        }),
    setGovernorStateFor: (sessionId, governorState) =>
        set((s) => {
            const entry = s.sessions[sessionId];
            if (!entry) return {};
            const sessions = {
                ...s.sessions,
                [sessionId]: { ...entry, governorState },
            };
            if (s.activeSessionId === sessionId) return { sessions, governorState };
            return { sessions };
        }),
    setActiveSessionId: (id) =>
        set((s) => {
            const entry = s.sessions[id];
            return {
                activeSessionId: id,
                session: entry?.session ?? null,
                governorState: entry?.governorState ?? null,
            };
        }),
    getSession: (id) => get().sessions[id]?.session ?? null,
    clearSession: (id) =>
        set((s) => {
            const sessions = { ...s.sessions };
            delete sessions[id];
            if (s.activeSessionId !== id) return { sessions };
            const remaining = Object.keys(sessions);
            const nextId = remaining.length ? remaining[remaining.length - 1] : null;
            return {
                sessions,
                activeSessionId: nextId,
                session: nextId ? (sessions[nextId]?.session ?? null) : null,
                governorState: nextId ? (sessions[nextId]?.governorState ?? null) : null,
            };
        }),
    clearAll: () =>
        set({ sessions: {}, activeSessionId: null, session: null, governorState: null }),
}));
