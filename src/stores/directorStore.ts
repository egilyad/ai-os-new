import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { directorRepository } from '../kernel/instances/services-extras';
import type { ConversationSession } from '../kernel/contracts/conversation/session';

export type DirectorStatus = 'idle' | 'running' | 'paused' | 'aborted' | 'completed' | 'error';

/** Safety cap so a long/looping run cannot grow the turn log without bound (FA-05). */
const MAX_TURN_LOG = 200;

export interface DirectorTurnLogEntry {
    participantId: string;
    status: 'running' | 'complete' | 'error';
    success?: boolean;
    error?: string;
    content?: string;
    /** Index of this turn in the scenario's planned turn list (-1 / absent for operator-injected overrides). */
    turnIndex?: number;
    /** True when this turn was injected by an operator override rather than from the scripted plan. */
    injected?: boolean;
}

const EMPTY_STATE = {
    sessionId: '',
    status: 'idle' as DirectorStatus,
    currentParticipantId: null as string | null,
    turnLog: [] as DirectorTurnLogEntry[],
};

// Subscription handles are retained (FA-04) so the store can be torn down and
// re-subscribed instead of leaking an always-on event-bus subscription.
let _unsubs: Array<() => void> = [];
let _subscribed = false;

function subscribeDirectorStore() {
    if (_subscribed) return;
    _unsubs = [
        eventBus.onSafe<{
            sessionId: string;
            participantId: string;
            turnIndex?: number;
            injected?: boolean;
        }>(EVENTS.CONVERSATION_TURN_START, (d) =>
            useDirectorStore.setState((s) => {
                // A turn starting while paused/aborted (an in-flight turn resuming)
                // must not resurrect `running` — the lifecycle status wins.
                const status =
                    s.status === 'paused' || s.status === 'aborted' ? s.status : 'running';
                const entry: DirectorTurnLogEntry = {
                    participantId: d.participantId,
                    status: 'running',
                    turnIndex: d.turnIndex,
                    injected: d.injected,
                };
                return {
                    sessionId: d.sessionId,
                    status,
                    currentParticipantId: d.participantId,
                    turnLog: [...s.turnLog, entry].slice(-MAX_TURN_LOG),
                };
            }),
        ),
        eventBus.onSafe<{
            sessionId: string;
            participantId: string;
            success: boolean;
            content?: string;
            turnIndex?: number;
            injected?: boolean;
        }>(EVENTS.CONVERSATION_TURN_COMPLETE, (d) =>
            useDirectorStore.setState((s) => {
                const log = [...s.turnLog];
                const idx = log.findIndex(
                    (e) => e.participantId === d.participantId && e.status === 'running',
                );
                if (idx >= 0) {
                    const entry = log[idx]!;
                    log[idx] = {
                        ...entry,
                        status: 'complete',
                        success: d.success,
                        content: d.content,
                        turnIndex: d.turnIndex,
                        injected: d.injected,
                    };
                }
                // A turn completing after a pause/abort must not resurrect `running`.
                const status =
                    s.status === 'paused' || s.status === 'aborted' ? s.status : 'running';
                return { status, currentParticipantId: null, turnLog: log };
            }),
        ),
        eventBus.onSafe<{
            sessionId: string;
            participantId: string;
            error: string;
            turnIndex?: number;
            injected?: boolean;
        }>(EVENTS.CONVERSATION_TURN_ERROR, (d) =>
            useDirectorStore.setState((s) => {
                const log = [...s.turnLog];
                const idx = log.findIndex(
                    (e) => e.participantId === d.participantId && e.status === 'running',
                );
                if (idx >= 0) {
                    const entry = log[idx]!;
                    log[idx] = {
                        ...entry,
                        status: 'error',
                        success: false,
                        error: d.error,
                        turnIndex: d.turnIndex,
                        injected: d.injected,
                    };
                }
                const status = s.status === 'paused' || s.status === 'aborted' ? s.status : 'error';
                return { status, currentParticipantId: null, turnLog: log };
            }),
        ),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.CONVERSATION_PAUSED, (d) =>
            useDirectorStore.setState({ status: 'paused', sessionId: d.sessionId }),
        ),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.CONVERSATION_RESUMED, (d) =>
            useDirectorStore.setState({ status: 'running', sessionId: d.sessionId }),
        ),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.CONVERSATION_ABORTED, (d) =>
            useDirectorStore.setState({ status: 'aborted', sessionId: d.sessionId }),
        ),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.CONVERSATION_COMPLETED, (d) =>
            useDirectorStore.setState({ status: 'completed', sessionId: d.sessionId }),
        ),
    ];
    _subscribed = true;
}

function unsubscribeDirectorStore() {
    _unsubs.forEach((u) => u());
    _unsubs = [];
    _subscribed = false;
}

export interface DirectorStoreState {
    sessionId: string;
    status: DirectorStatus;
    currentParticipantId: string | null;
    turnLog: DirectorTurnLogEntry[];
    /** Past Director runs (live ConversationSession records) persisted to Dexie. */
    history: ConversationSession[];
    loadHistory: () => Promise<void>;
    reset: () => void;
    /** Ensures the event-bus subscriptions are active (idempotent, FA-04). */
    ensureSubscribed: () => void;
    /** Tears down event-bus subscriptions + resets state (FA-04). */
    destroy: () => void;
}

/**
 * Application-layer observer for the generic `conversation:*` lifecycle events
 * emitted by `ConversationOrchestrator`. It is intentionally OUTSIDE the kernel:
 * Core only emits observable events; this store decides how to present them.
 * Any policy (Scripted/Hybrid/Debate/Future) driven through the orchestrator is
 * observable here without the Core knowing about the Director, UI, or Debate.
 */
export const useDirectorStore = create<DirectorStoreState>((set) => {
    // Subscribe at module load (retained behaviour) but keep the handles so the
    // store can be torn down and re-subscribed by its consuming panel (FA-04).
    subscribeDirectorStore();

    return {
        ...EMPTY_STATE,
        history: [],
        loadHistory: async () => {
            let all: ConversationSession[] = [];
            try {
                all = await directorRepository.list();
            } catch {
                return;
            }
            set({ history: all });
        },
        reset: () =>
            set({
                sessionId: '',
                status: 'idle',
                currentParticipantId: null,
                turnLog: [],
            }),
        ensureSubscribed: () => subscribeDirectorStore(),
        destroy: () => {
            unsubscribeDirectorStore();
            set({ ...EMPTY_STATE, history: useDirectorStore.getState().history });
        },
    };
});
