import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { ecosystemService } from '../kernel/instances/services-extras';
import type { InstallBundle, OsSnapshot } from '../kernel/types/trust-types';

interface TrustState {
    bundles: InstallBundle[];
    snapshots: OsSnapshot[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useTrustStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ bundleId: string }>(EVENTS.ECO_INSTALLED, refresh),
        eventBus.onSafe<{ snapshotId: string }>(EVENTS.ECO_SNAPSHOT, refresh),
        eventBus.onSafe<{ policyId: string }>(EVENTS.TRUST_POLICY, refresh),
    ];
    _subscribed = true;
}

export function resetTrustStoreSubscription(): void {
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

export const useTrustStore = create<TrustState>()((set) => {
    ensureSubscription();
    return {
        bundles: [],
        snapshots: [],
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [bundles, snapshots] = await Promise.all([
                    ecosystemService.listBundles(),
                    ecosystemService.listSnapshots(),
                ]);
                set({ bundles, snapshots, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
    };
});
