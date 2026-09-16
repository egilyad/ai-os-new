import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { cogMemoryService, metaAgentService } from '../kernel/instances/services-extras';
import type { ImprovementProposal, KnowledgePackage } from '../kernel/types/meta-types';

interface MetaState {
    proposals: ImprovementProposal[];
    packages: KnowledgePackage[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useMetaStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ proposalId: string }>(EVENTS.META_PROPOSED, refresh),
        eventBus.onSafe<{ proposalId: string }>(EVENTS.META_APPLIED, refresh),
        eventBus.onSafe<{ packageId: string }>(EVENTS.COG_COMPILED, refresh),
        eventBus.onSafe<{ kind: string }>(EVENTS.META_HEALTH, refresh),
    ];
    _subscribed = true;
}

export function resetMetaStoreSubscription(): void {
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

export const useMetaStore = create<MetaState>()((set) => {
    ensureSubscription();
    return {
        proposals: [],
        packages: [],
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [proposals, packages] = await Promise.all([
                    metaAgentService.listProposals(),
                    cogMemoryService.listPackages(),
                ]);
                set({ proposals, packages, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
    };
});
