import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { coordinationService, federationService } from '../kernel/instances/services-extras';
import type { FederationPeer, HandoffRecord } from '../kernel/types/interop-types';

interface InteropState {
    peers: FederationPeer[];
    handoffs: HandoffRecord[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useInteropStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ peerId: string }>(EVENTS.FED_PEER, refresh),
        eventBus.onSafe<{ handoffId: string }>(EVENTS.HANDOFF_DISPATCHED, refresh),
        eventBus.onSafe<{ handoffId: string }>(EVENTS.HANDOFF_RETURNED, refresh),
        eventBus.onSafe<{ listingId: string }>(EVENTS.MARKET_AWARDED, refresh),
    ];
    _subscribed = true;
}

export function resetInteropStoreSubscription(): void {
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

export const useInteropStore = create<InteropState>()((set) => {
    ensureSubscription();
    return {
        peers: [],
        handoffs: [],
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [peers, handoffs] = await Promise.all([
                    federationService.listPeers(),
                    coordinationService.listHandoffs(),
                ]);
                set({ peers, handoffs, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
    };
});
