import { EVENTS } from '../events/event-names';
import type {
    ICausalTraceStore,
    ICausalScopeManager,
    CausalTraceEntry,
    CausalTrace,
    DecisionSnapshot,
    EventRef,
    ProjectionSnapshot,
} from '../contracts/causal-debugger';
import type { IKeyStateStore } from '../contracts/key-state';
import type { Projection } from '../contracts/projection';
import type { IEventBus } from '../types/interfaces';
import type { ILogger } from '../contracts/logger';

const MAX_TRACES = 200;
type EventName = string;

const GLOBAL_EVENTS: EventName[] = ['system:state:changed', 'key:state:changed', 'kernel:updated'];

function isGlobalEvent(name: EventName): boolean {
    return GLOBAL_EVENTS.includes(name);
}

export class CausalTimelineService implements ICausalTraceStore {
    private traces = new Map<string, CausalTraceEntry>();
    private traceOrder: string[] = [];
    private unsub: (() => void) | null = null;

    constructor(
        private scopeManager: ICausalScopeManager,
        private keyStateStore: IKeyStateStore,
        private routerProjection: Projection,
        private eventBus: IEventBus,
        private logger: ILogger,
    ) {}

    start(): void {
        this.unsub = this.eventBus.on(EVENTS.DECISION, (data: unknown) => {
            try {
                const payload = data as Record<string, unknown>;
                const requestId = payload.requestId as string;
                if (!requestId) return;
                this.captureDecision(requestId, payload);
            } catch (err) {
                this.logger.error('CausalTimeline', 'Failed to capture decision', {
                    error: String(err),
                });
            }
        });
        this.logger.info('CausalTimeline', 'Listening to system:decision');
    }

    destroy(): void {
        this.unsub?.();
    }

    recordDecision(entry: CausalTraceEntry): void {
        if (this.traces.size >= MAX_TRACES) {
            // Evict oldest
            const oldest = this.traceOrder.shift();
            if (oldest) this.traces.delete(oldest);
        }
        this.traces.set(entry.causalId, entry);
        this.traceOrder.push(entry.causalId);
    }

    getTrace(causalId: string): CausalTrace | undefined {
        const entry = this.traces.get(causalId);
        if (!entry) return undefined;
        const scope = this.scopeManager.getScope(causalId);
        const timeline: EventRef[] = [];
        return {
            entry,
            timeline,
            scope: scope ?? {
                causalId,
                requestIds: entry.requestIds,
                startedAt: entry.createdAt,
                providerIds: [],
                keyIds: [],
            },
        };
    }

    listTraces(limit = 50): CausalTraceEntry[] {
        return this.traceOrder
            .slice(-limit)
            .map((id) => this.traces.get(id))
            .filter((x): x is CausalTraceEntry => x !== undefined);
    }

    getRelevantEvents(causalId: string, eventLog: { entries: EventRef[] }): EventRef[] {
        const scope = this.scopeManager.getScope(causalId);
        if (!scope) return [];
        const keyIds = new Set(scope.keyIds);
        const providerIds = new Set(scope.providerIds);
        return eventLog.entries.filter((ref) => {
            if (isGlobalEvent(ref.eventName)) return true;
            const p = ref.payload;
            const keyId = (p as Record<string, unknown>).keyId as string | undefined;
            const providerId = (p as Record<string, unknown>).providerId as string | undefined;
            if (keyId && keyIds.has(keyId)) return true;
            if (providerId && providerIds.has(providerId)) return true;
            return false;
        });
    }

    /** Capture snapshot + decision record for a requestId */
    private captureDecision(requestId: string, payload: Record<string, unknown>): void {
        const providerIds: string[] = Array.isArray(payload.providers)
            ? (payload.providers as string[])
            : [];
        const keyIds: string[] = Array.isArray(payload.candidateKeys)
            ? (payload.candidateKeys as string[])
            : [];
        const scope = this.scopeManager.resolveScope(requestId, providerIds, keyIds);

        const snapshot = (proj: Projection): ProjectionSnapshot => {
            const raw = proj.getState();
            const data =
                raw instanceof Map
                    ? Object.fromEntries(raw)
                    : structuredClone(raw as Record<string, unknown>);
            return { data, takenAt: Date.now() };
        };

        const takeKeySnapshot = (): ProjectionSnapshot => ({
            data: Object.fromEntries(this.keyStateStore.getAll().map((s) => [s.id, s])),
            takenAt: Date.now(),
        });

        const before = {
            keyState: takeKeySnapshot(),
            routerState: snapshot(this.routerProjection),
        };

        queueMicrotask(() => {
            const entry: CausalTraceEntry = {
                causalId: scope.causalId,
                requestIds: [requestId],
                logPos: 0,
                before,
                decision: payload as unknown as DecisionSnapshot,
                after: {
                    keyState: takeKeySnapshot(),
                    routerState: snapshot(this.routerProjection),
                },
                links: [],
                createdAt: Date.now(),
            };
            this.recordDecision(entry);
        });
    }
}
