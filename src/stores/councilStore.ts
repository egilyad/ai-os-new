import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { councilService } from '../kernel/instances/services-extras';
import type { CouncilSession } from '../kernel/types/council-types';

interface CouncilState {
    sessions: CouncilSession[];
    activeSessionId: string | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    select: (id: string | null) => void;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useCouncilStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_CREATED, refresh),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_PHASE, refresh),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_COMPLETED, refresh),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_ABORTED, refresh),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_JUDGED, refresh),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_VOTE, refresh),
    ];
    _subscribed = true;
}

export function resetCouncilStoreSubscription(): void {
    for (const u of _unsubs) {
        try {
            u();
        } catch {
            // ignore teardown errors
        }
    }
    _unsubs = [];
    _subscribed = false;
}

export const useCouncilStore = create<CouncilState>()((set) => {
    ensureSubscription();
    return {
        sessions: [],
        activeSessionId: null,
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const sessions = await councilService.listSessions();
                set({ sessions, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
        select: (id) => set({ activeSessionId: id }),
    };
});
