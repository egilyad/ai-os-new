import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { crewService } from '../kernel/instances/services-extras';
import type { Crew } from '../kernel/types/crew-types';

export type CrewRunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'aborted';

interface CrewState {
    crews: Crew[];
    activeCrewId: string | null;
    runStatus: CrewRunStatus;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    select: (id: string | null) => void;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    _unsubs = [
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_STARTED, (d) =>
            useCrewStore.setState((s) => ({
                runStatus: s.activeCrewId === d.crewId ? 'running' : s.runStatus,
            })),
        ),
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_COMPLETED, (d) =>
            useCrewStore.setState((s) => ({
                runStatus: s.activeCrewId === d.crewId ? 'completed' : s.runStatus,
            })),
        ),
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_FAILED, (d) =>
            useCrewStore.setState((s) => ({
                runStatus: s.activeCrewId === d.crewId ? 'failed' : s.runStatus,
            })),
        ),
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_ABORTED, (d) =>
            useCrewStore.setState((s) => ({
                runStatus: s.activeCrewId === d.crewId ? 'aborted' : s.runStatus,
            })),
        ),
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_CREATED, () => {
            void useCrewStore.getState().refresh();
        }),
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_DELETED, () => {
            void useCrewStore.getState().refresh();
        }),
    ];
    _subscribed = true;
}

export function resetCrewStoreSubscription(): void {
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

export const useCrewStore = create<CrewState>()((set) => {
    ensureSubscription();
    return {
        crews: [],
        activeCrewId: null,
        runStatus: 'idle',
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const crews = await crewService.listCrews();
                set({ crews, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
        select: (id) => set({ activeCrewId: id, runStatus: 'idle' }),
    };
});
