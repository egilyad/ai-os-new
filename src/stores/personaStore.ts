import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { sharedContextService } from '../kernel/instances/services-extras';
import type { Goal, SharedContext } from '../kernel/types/persona-types';

interface PersonaState {
    contexts: SharedContext[];
    goals: Goal[];
    activeContextId: string | null;
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
        void usePersonaStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ contextId: string }>(EVENTS.CONTEXT_CREATED, refresh),
        eventBus.onSafe<{ contextId: string }>(EVENTS.CONTEXT_SHARED, refresh),
        eventBus.onSafe<{ goalId: string }>(EVENTS.GOAL_CREATED, refresh),
        eventBus.onSafe<{ goalId: string }>(EVENTS.GOAL_PROGRESS, refresh),
        eventBus.onSafe<{ goalId: string }>(EVENTS.GOAL_COMPLETED, refresh),
        eventBus.onSafe<{ personId: string }>(EVENTS.PERSONA_DISTILLED, refresh),
    ];
    _subscribed = true;
}

export function resetPersonaStoreSubscription(): void {
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

export const usePersonaStore = create<PersonaState>()((set, get) => {
    ensureSubscription();
    return {
        contexts: [],
        goals: [],
        activeContextId: null,
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [contexts, goals] = await Promise.all([
                    sharedContextService.listContexts(),
                    sharedContextService.listGoals(),
                ]);
                const { activeContextId } = get();
                set({
                    contexts,
                    goals,
                    loading: false,
                    activeContextId:
                        activeContextId && contexts.some((c) => c.id === activeContextId)
                            ? activeContextId
                            : null,
                });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
        select: (id) => set({ activeContextId: id }),
    };
});
