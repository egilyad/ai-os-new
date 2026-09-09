import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { graphService } from '../kernel/instances/services-extras';
import type { GraphRun } from '../kernel/types/graph-types';

interface GraphState {
    runs: GraphRun[];
    activeRunId: string | null;
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
        void useGraphStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_STARTED, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_HITL, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_COMPLETED, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_FAILED, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_ABORTED, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_RESTORED, refresh),
    ];
    _subscribed = true;
}

export function resetGraphStoreSubscription(): void {
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

export const useGraphStore = create<GraphState>()((set) => {
    ensureSubscription();
    return {
        runs: [],
        activeRunId: null,
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const runs = await graphService.listRuns();
                set({ runs, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
        select: (id) => set({ activeRunId: id }),
    };
});
