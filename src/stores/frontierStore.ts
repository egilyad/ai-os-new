import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { evalService, frontierOpsService } from '../kernel/instances/services-extras';
import type { Benchmark, EvalRun, OrgCharter } from '../kernel/types/frontier-types';

interface FrontierState {
    benchmarks: Benchmark[];
    runs: EvalRun[];
    orgs: OrgCharter[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

let _unsubs: Array<() => void> = [];
let _subscribed = false;

function ensureSubscription() {
    if (_subscribed) return;
    const refresh = () => {
        void useFrontierStore.getState().refresh();
    };
    _unsubs = [
        eventBus.onSafe<{ runId: string }>(EVENTS.EVAL_RUN, refresh),
        eventBus.onSafe<{ benchmarkId: string }>(EVENTS.EVAL_COMPARED, refresh),
        eventBus.onSafe<{ orgId: string }>(EVENTS.EVAL_ORG, refresh),
        eventBus.onSafe<{ intentId: string }>(EVENTS.EVAL_INTENT, refresh),
    ];
    _subscribed = true;
}

export function resetFrontierStoreSubscription(): void {
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

export const useFrontierStore = create<FrontierState>()((set) => {
    ensureSubscription();
    return {
        benchmarks: [],
        runs: [],
        orgs: [],
        loading: false,
        error: null,
        refresh: async () => {
            set({ loading: true, error: null });
            try {
                const [benchmarks, runs, orgs] = await Promise.all([
                    evalService.listBenchmarks(),
                    evalService.listRuns(),
                    frontierOpsService.listOrgs(),
                ]);
                set({ benchmarks, runs, orgs, loading: false });
            } catch (e) {
                set({ loading: false, error: e instanceof Error ? e.message : String(e) });
            }
        },
    };
});
