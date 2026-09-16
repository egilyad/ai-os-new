import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { rivalRepository, runQueueService } from '../kernel/instances/services-extras';
import type { AgentLoop, QueuedRun } from '../kernel/types/rival-types';

interface RivalState {
    loops: AgentLoop[];
    queue: QueuedRun[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useRivalStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ loopId: string }>(EVENTS.LOOP_ITER, refresh),
        eventBus.onSafe<{ chatId: string }>(EVENTS.GROUPCHAT_CREATED, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.QUEUE_ENQUEUED, refresh),
        eventBus.onSafe<{ loopId: string }>(EVENTS.DYAD_DONE, refresh),
    ];
    _subscribed = true;
}

export function resetRivalStoreSubscription(): void {
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

export const useRivalStore = create<RivalState>()((set) => {
    ensureSubscription();
    return {
        loops: [],
        queue: [],
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [loops, queue] = await Promise.all([
                    rivalRepository.listLoops(),
                    runQueueService.list(),
                ]);
                set({ loops, queue, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
    };
});
