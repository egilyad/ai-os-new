import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import {
    fleetMonitorService,
    mobileAccessService,
} from '../kernel/instances/services-extras';
import type { MissionWatch, PushNotification } from '../kernel/types/ops-types';

interface OpsState {
    missions: MissionWatch[];
    notifications: PushNotification[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useOpsStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ ticketId: string }>(EVENTS.OPS_SANDBOX, refresh),
        eventBus.onSafe<{ notificationId: string }>(EVENTS.OPS_NOTIFY, refresh),
        eventBus.onSafe<{ runId: string }>(EVENTS.GRAPH_COMPLETED, refresh),
        eventBus.onSafe<{ sessionId: string }>(EVENTS.COUNCIL_COMPLETED, refresh),
        eventBus.onSafe<{ crewId: string }>(EVENTS.CREW_COMPLETED, refresh),
    ];
    _subscribed = true;
}

export function resetOpsStoreSubscription(): void {
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

export const useOpsStore = create<OpsState>()((set) => {
    ensureSubscription();
    return {
        missions: [],
        notifications: [],
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [{ missions }, notifications] = await Promise.all([
                    fleetMonitorService.snapshot(),
                    mobileAccessService.listNotifications(true),
                ]);
                set({ missions, notifications, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
    };
});
