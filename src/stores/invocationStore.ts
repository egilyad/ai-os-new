import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import { invocationRepository, invocationCostTracker } from '../kernel/instances/services-extras';
import type {
    AgentRef,
    ExecutionTarget,
    Invocation,
    InvocationCaller,
    InvocationContext,
    InvocationStatus,
    InvocationTarget,
} from '../kernel/contracts/invocation';

export interface InvocationView {
    id: string;
    status: InvocationStatus;
    caller?: InvocationCaller;
    target?: InvocationTarget;
    context?: InvocationContext;
    reason?: string;
    policyRef?: string;
    agents?: AgentRef[];
    sessionRef?: ExecutionTarget;
    rejectionReason?: string;
    updatedAt: number;
}

export interface InvocationLogEntry {
    at: number;
    event: string;
    invocationId: string;
    detail?: string;
}

export interface ExecutionFeedEntry {
    at: number;
    kind: 'turn-start' | 'turn-complete' | 'turn-error';
    text: string;
    /** Session the turn belongs to, so the UI can scope the feed per invocation. */
    sessionId?: string;
}

/** Cap live output + audit log so the singleton store cannot grow without bound (FA-05). */
const MAX_FEED = 300;
const MAX_LOG = 500;

/** Append an item and cap the array to `max` most-recent entries. */
function appendCapped<T>(arr: T[], item: T, max: number): T[] {
    const next = [...arr, item];
    return next.length > max ? next.slice(next.length - max) : next;
}

const EMPTY_STATE = {
    invocations: {} as Record<string, InvocationView>,
    order: [] as string[],
    log: [] as InvocationLogEntry[],
    feed: [] as ExecutionFeedEntry[],
    costs: {} as Record<string, number>,
    selectedId: null as string | null,
};

// Subscription handles are retained (FA-04) so the store can be torn down and
// re-subscribed instead of leaking an always-on event-bus subscription.
let _unsubs: Array<() => void> = [];
let _subscribed = false;

function subscribeInvocationStore(): void {
    if (_subscribed) return;

    const upsert = (id: string, patch: Partial<InvocationView>) =>
        useInvocationStore.setState((s) => {
            const existing = s.invocations[id];
            const next: InvocationView = {
                id,
                status: 'requested',
                ...existing,
                ...patch,
                updatedAt: Date.now(),
            };
            const order = s.order.includes(id) ? s.order : [...s.order, id];
            return { invocations: { ...s.invocations, [id]: next }, order };
        });

    const pushLog = (invocationId: string, event: string, detail?: string) =>
        useInvocationStore.setState((s) => ({
            log: appendCapped(s.log, { at: Date.now(), event, invocationId, detail }, MAX_LOG),
        }));

    const pushFeed = (entry: ExecutionFeedEntry) =>
        useInvocationStore.setState((s) => ({
            feed: appendCapped(s.feed, entry, MAX_FEED),
        }));

    _unsubs = [
        eventBus.onSafe(
            EVENTS.INVOCATION_REQUESTED,
            (d: {
                invocationId: string;
                caller: InvocationCaller;
                target: InvocationTarget;
                context: InvocationContext;
            }) => {
                upsert(d.invocationId, {
                    status: 'requested',
                    caller: d.caller,
                    target: d.target,
                    context: d.context,
                });
                pushLog(d.invocationId, 'requested');
            },
        ),
        eventBus.onSafe(
            EVENTS.INVOCATION_ACCEPTED,
            (d: { invocationId: string; policyRef: string; agents: AgentRef[] }) => {
                upsert(d.invocationId, {
                    status: 'accepted',
                    policyRef: d.policyRef,
                    agents: d.agents,
                });
                pushLog(d.invocationId, 'accepted');
            },
        ),
        eventBus.onSafe(
            EVENTS.INVOCATION_REJECTED,
            (d: { invocationId: string; reason: string }) => {
                upsert(d.invocationId, { status: 'rejected', rejectionReason: d.reason });
                pushLog(d.invocationId, 'rejected', d.reason);
            },
        ),
        eventBus.onSafe(
            EVENTS.INVOCATION_EXECUTING,
            (d: { invocationId: string; sessionRef: ExecutionTarget }) => {
                upsert(d.invocationId, { status: 'executing', sessionRef: d.sessionRef });
                pushLog(d.invocationId, 'executing', d.sessionRef.ref);
            },
        ),
        eventBus.onSafe(
            EVENTS.INVOCATION_DONE,
            (d: { invocationId: string; resultRef?: string }) => {
                upsert(d.invocationId, { status: 'done' });
                pushLog(d.invocationId, 'done', d.resultRef);
                // Reload accumulated cost now that the invocation's turns have
                // streamed and populated the cost-attribution table.
                void useInvocationStore.getState().loadCosts();
            },
        ),
        eventBus.onSafe(
            EVENTS.CONVERSATION_TURN_START,
            (d: { sessionId: string; participantId: string }) => {
                pushFeed({
                    at: Date.now(),
                    kind: 'turn-start',
                    text: `▶ ${d.participantId}`,
                    sessionId: d.sessionId,
                });
            },
        ),
        eventBus.onSafe(
            EVENTS.CONVERSATION_TURN_COMPLETE,
            (d: { sessionId: string; participantId: string; content?: string }) => {
                pushFeed({
                    at: Date.now(),
                    kind: 'turn-complete',
                    text: `${d.participantId}: ${d.content ?? ''}`,
                    sessionId: d.sessionId,
                });
            },
        ),
        eventBus.onSafe(
            EVENTS.CONVERSATION_TURN_ERROR,
            (d: { sessionId: string; participantId: string; error: string }) => {
                pushFeed({
                    at: Date.now(),
                    kind: 'turn-error',
                    text: `✖ ${d.participantId}: ${d.error}`,
                    sessionId: d.sessionId,
                });
            },
        ),
    ];
    _subscribed = true;
}

function unsubscribeInvocationStore(): void {
    _unsubs.forEach((u) => u());
    _unsubs = [];
    _subscribed = false;
}

export interface InvocationStoreState {
    invocations: Record<string, InvocationView>;
    order: string[];
    log: InvocationLogEntry[];
    feed: ExecutionFeedEntry[];
    /** Per-invocation accumulated cost (USD) from the cost-attribution table. */
    costs: Record<string, number>;
    /** Currently selected invocation whose session feed is shown (scoped view). */
    selectedId: string | null;
    loadHistory: () => Promise<void>;
    loadCosts: () => Promise<void>;
    select: (id: string | null) => void;
    /** Clears only the live output view (feed + log), keeps history. */
    clearView: () => void;
    /** Clears the persisted invocation history (history list + view). */
    clearHistory: () => void;
    /** Ensures the event-bus subscriptions are active (idempotent, FA-04). */
    ensureSubscribed: () => void;
    /** Tears down event-bus subscriptions + resets state (FA-04). */
    destroy: () => void;
    /** Full reset (retained for tests / emergency). */
    clear: () => void;
}

/**
 * Application-layer observer for the Invocation Engine's `invocation:*` intent
 * lifecycle (D7) plus the `conversation:*` events emitted by the execution
 * subsystem. It is intentionally OUTSIDE the kernel: the Engine only emits
 * observable events; this store decides how to present them. The Room UI is a
 * pure consumer — it never writes the `Invocation` aggregate.
 */
export const useInvocationStore = create<InvocationStoreState>((set) => {
    // Subscribe at module load (retained behaviour) but keep the handles so the
    // store can be torn down and re-subscribed by its consuming panel (FA-04).
    subscribeInvocationStore();

    return {
        ...EMPTY_STATE,
        loadHistory: async () => {
            let all: Invocation[] = [];
            try {
                all = await invocationRepository.list();
            } catch {
                return;
            }
            set((s) => {
                const invocations: Record<string, InvocationView> = { ...s.invocations };
                for (const inv of all) {
                    invocations[inv.id] = {
                        id: inv.id,
                        status: inv.status,
                        caller: inv.caller,
                        target: inv.target,
                        context: inv.context,
                        reason: inv.reason,
                        policyRef: inv.policyRef,
                        agents: inv.resolvedAgents,
                        sessionRef: inv.sessionRef,
                        rejectionReason: inv.rejectionReason,
                        updatedAt: inv.updatedAt,
                    };
                }
                const order = Object.values(invocations)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((v) => v.id);
                return { invocations, order };
            });
        },
        loadCosts: async () => {
            let costs: Record<string, number> = {};
            try {
                costs = await invocationCostTracker.getAllCosts();
            } catch {
                return;
            }
            set({ costs });
        },
        clear: () => set({ ...EMPTY_STATE }),
        select: (id) => set({ selectedId: id }),
        clearView: () => set({ feed: [], log: [] }),
        clearHistory: () => set({ invocations: {}, order: [], costs: {}, feed: [], log: [] }),
        ensureSubscribed: () => subscribeInvocationStore(),
        destroy: () => {
            unsubscribeInvocationStore();
            set({ ...EMPTY_STATE });
        },
    };
});
