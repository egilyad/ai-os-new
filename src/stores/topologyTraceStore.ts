import { create } from 'zustand';
import { eventBus } from '../kernel/events/event-bus';
import { EVENTS } from '../kernel/events/event-names';

const MAX_STEPS = 1000;
const MAX_ACTIVE_TRACES = 100;
const METRICS_INTERVAL_MS = 30_000;

export interface TopologyStepEvent {
    nodeId: string;
    traceId: string;
    status: 'active' | 'done' | 'error';
    timestamp: number;
    duration?: number;
    label?: string;
}

export interface TopologyTraceState {
    steps: TopologyStepEvent[];
    activeTraces: Set<string>;
    addStep: (step: TopologyStepEvent) => void;
    clearTrace: (traceId: string) => void;
    clearAll: () => void;
    destroy: () => void;
}

export const useTopologyTraceStore = create<TopologyTraceState>((set, get) => {
    const subs = [
        eventBus.onSafe<{ nodeId: string; traceId: string }>('cognitive:step:active', (d) => {
            set((s) => {
                const step: TopologyStepEvent = {
                    nodeId: d.nodeId,
                    traceId: d.traceId,
                    status: 'active',
                    timestamp: Date.now(),
                };
                const activeTraces = new Set(s.activeTraces);
                activeTraces.add(d.traceId);
                if (activeTraces.size > MAX_ACTIVE_TRACES) {
                    const oldest = activeTraces.values().next().value;
                    if (oldest) activeTraces.delete(oldest);
                }
                return { steps: [...s.steps, step].slice(-MAX_STEPS), activeTraces };
            });
        }),
        eventBus.onSafe<{
            nodeId: string;
            traceId: string;
            status: 'done' | 'error';
            duration: number;
        }>('cognitive:step:completed', (d) => {
            set((s) => {
                const step: TopologyStepEvent = {
                    nodeId: d.nodeId,
                    traceId: d.traceId,
                    status: d.status,
                    timestamp: Date.now(),
                    duration: d.duration,
                };
                const activeTraces = new Set(s.activeTraces);
                activeTraces.delete(d.traceId);
                return { steps: [...s.steps, step].slice(-MAX_STEPS), activeTraces };
            });
        }),
        eventBus.on(EVENTS.REQUEST_COMPLETED, () => {
            // trace naturally ends — keep in store for UI reference
        }),
    ];

    const metricsInterval = setInterval(() => {
        const s = get();
        const errorCount = s.steps.filter((st) => st.status === 'error').length;
        const activeCount = s.steps.filter((st) => st.status === 'active').length;
        eventBus.emit(EVENTS.SYSTEM_RUNTIME_METRICS, {
            source: 'topologyTraceStore',
            totalSteps: s.steps.length,
            errorCount,
            activeCount,
            activeTraceCount: s.activeTraces.size,
        });
    }, METRICS_INTERVAL_MS);

    return {
        steps: [],
        activeTraces: new Set<string>(),
        addStep: (step) =>
            set((s) => {
                const activeTraces = new Set(s.activeTraces);
                if (step.status === 'active') {
                    activeTraces.add(step.traceId);
                    if (activeTraces.size > MAX_ACTIVE_TRACES) {
                        const oldest = activeTraces.values().next().value;
                        if (oldest) activeTraces.delete(oldest);
                    }
                } else if (step.status === 'done' || step.status === 'error') {
                    activeTraces.delete(step.traceId);
                }
                return { steps: [...s.steps, step].slice(-MAX_STEPS), activeTraces };
            }),
        clearTrace: (traceId) =>
            set((s) => ({
                steps: s.steps.filter((st) => st.traceId !== traceId),
                activeTraces: new Set([...s.activeTraces].filter((id) => id !== traceId)),
            })),
        clearAll: () => set({ steps: [], activeTraces: new Set() }),
        destroy: () => {
            subs.forEach((u) => u());
            clearInterval(metricsInterval);
        },
    };
});

// HMR cleanup: prevent duplicate event subscriptions on hot reload
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        useTopologyTraceStore.getState().destroy();
    });
}
