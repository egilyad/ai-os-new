/**
 * Live debate streaming state вЂ” real-time debate session UI state
 * (emotion tracking, live arguments, active round).
 * Separate from activeDebateStore (session metadata) and debate-session-store (DB persistence).
 */
import { create } from 'zustand';
import { eventBus } from '../kernel/events/event-bus';
import { EVENTS } from '../kernel/events/event-names';
import type { DebateEmotion } from '../kernel/contracts/debate-emotion';

const MAX_AGENT_EVENTS = 500;
const MAX_ROUND_EVENTS = 200;
const MAX_EMOTIONS = 200;
const METRICS_INTERVAL_MS = 30_000;
import type { IDebateLiveStore } from '../kernel/contracts/debate-store';

export type { IDebateLiveStore };

export function createDebateLiveStoreAdapter(): IDebateLiveStore {
    return {
        get streamingContent() {
            return useDebateLiveStore.getState().streamingContent;
        },
        get emotions() {
            return useDebateLiveStore.getState().emotions;
        },
        get agentCountdowns() {
            return useDebateLiveStore.getState().agentCountdowns;
        },
        get agentAddressing() {
            return useDebateLiveStore.getState().agentAddressing;
        },
        get memoryBubbles() {
            return useDebateLiveStore.getState().memoryBubbles;
        },
        get currentThinking() {
            return useDebateLiveStore.getState().currentThinking;
        },
        get agentEvents() {
            return useDebateLiveStore.getState().agentEvents;
        },
        get roundEvents() {
            return useDebateLiveStore.getState().roundEvents;
        },
        clearSession: (sessionId) => useDebateLiveStore.getState().clearSession(sessionId),
        clearAll: () => useDebateLiveStore.getState().clearAll(),
    };
}

export interface DebateAgentEvent {
    sessionId: string;
    agentId: string;
    status: 'thinking' | 'responded' | 'error' | 'timeout' | 'fallback';
    timestamp: number;
    content?: string;
    error?: string;
    timeoutMs?: number;
    fromProvider?: string;
    toProvider?: string;
}

export interface DebateRoundEvent {
    sessionId: string;
    round: number;
    nodes?: string[];
    status: 'started' | 'ended';
}

export interface DebateLiveState {
    agentEvents: DebateAgentEvent[];
    roundEvents: DebateRoundEvent[];
    currentThinking: Map<string, string>;
    streamingContent: Map<string, string>;
    emotions: Map<string, DebateEmotion>;
    agentCountdowns: Map<string, { secondsLeft: number; secondsTotal: number }>;
    agentAddressing: Map<string, string>;
    memoryBubbles: Map<
        string,
        {
            debateLabel: string;
            similarity: number;
            relation: 'supports' | 'refutes' | 'extends' | 'contradicts';
        }
    >;
    judgeWeights: { pro: number; con: number; neutral: number };
    agentTimeoutSeconds: number;
    // Quality impact real-time indicators
    agentQualityActivations: Map<string, number>;
    recentQualityEvents: Array<{
        techniqueId: string;
        eventType: string;
        timestamp: number;
    }>;
    setAgentTimeout: (seconds: number) => void;
    addAgentEvent: (event: DebateAgentEvent) => void;
    addRoundEvent: (event: DebateRoundEvent) => void;
    clearSession: (sessionId: string) => void;
    clearAll: () => void;
    setAgentAddressing: (key: string, targetId: string | null) => void;
    addMemoryBubble: (
        key: string,
        bubble: {
            debateLabel: string;
            similarity: number;
            relation: 'supports' | 'refutes' | 'extends' | 'contradicts';
        },
    ) => void;
    setJudgeWeights: (weights: { pro: number; con: number; neutral: number }) => void;
    // B10-114: Cleanup event subscriptions on unmount
    destroy: () => void;
}

function setEmotion(
    emotions: Map<string, DebateEmotion>,
    key: string,
    value: DebateEmotion,
): Map<string, DebateEmotion> {
    const m = new Map(emotions).set(key, value);
    if (m.size > MAX_EMOTIONS) {
        const oldest = m.keys().next().value;
        if (oldest) m.delete(oldest);
    }
    return m;
}

function computeEmotion(
    key: string,
    eventType: string,
    agentEvents: DebateAgentEvent[],
): DebateEmotion {
    switch (eventType) {
        case 'thinking':
            return 'curiosity';
        case 'responded': {
            const lastEvent = agentEvents
                .slice()
                .reverse()
                .find((e) => `${e.sessionId}:${e.agentId}` === key);
            if (lastEvent?.status === 'error' || lastEvent?.status === 'timeout') return 'triumph';
            return 'confidence';
        }
        case 'error':
            return 'anger';
        case 'timeout':
            return 'fear';
        case 'fallback':
            return 'surprise';
        default:
            return 'neutral';
    }
}

export const useDebateLiveStore = create<DebateLiveState>((set, get) => {
    // FA-06: the metrics (30s) and countdown (1s) intervals are NOT always-on.
    // They start lazily when a live debate event arrives and stop once the store
    // holds no live data (clearSession/clearAll), so the module singleton leaks
    // no timers while idle (previously they ran forever for the whole app lifetime).
    let metricsInterval: ReturnType<typeof setInterval> | null = null;
    let countdownInterval: ReturnType<typeof setInterval> | null = null;

    const hasLiveData = (): boolean =>
        get().agentEvents.length > 0 ||
        get().roundEvents.length > 0 ||
        get().agentCountdowns.size > 0;

    const stopIntervals = (): void => {
        if (metricsInterval !== null) {
            clearInterval(metricsInterval);
            metricsInterval = null;
        }
        if (countdownInterval !== null) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    };

    const startIntervals = (): void => {
        if (metricsInterval !== null || countdownInterval !== null) return;
        metricsInterval = setInterval(() => {
            const s = get();
            // skip when no data вЂ” no component is observing a live debate
            if (s.agentEvents.length === 0 && s.roundEvents.length === 0) return;
            const errorCount = s.agentEvents.filter((e) => e.status === 'error').length;
            const timeoutCount = s.agentEvents.filter((e) => e.status === 'timeout').length;
            const fallbackCount = s.agentEvents.filter((e) => e.status === 'fallback').length;
            eventBus.emit(EVENTS.DEBATE_UPDATED, {
                sessionId: '',
                type: 'store_metrics',
                agentEventCount: s.agentEvents.length,
                errorCount,
                timeoutCount,
                fallbackCount,
                roundCount: s.roundEvents.length,
            });
        }, METRICS_INTERVAL_MS);

        countdownInterval = setInterval(() => {
            const s = get();
            if (
                s.agentCountdowns.size === 0 &&
                s.agentEvents.length === 0 &&
                s.roundEvents.length === 0
            ) {
                return;
            }
            set((st) => {
                const cd = new Map(st.agentCountdowns);
                let changed = false;
                for (const [k, v] of cd) {
                    if (v.secondsLeft <= 0) {
                        cd.delete(k);
                        changed = true;
                    } else {
                        cd.set(k, { ...v, secondsLeft: v.secondsLeft - 1 });
                        changed = true;
                    }
                }
                return changed ? { agentCountdowns: cd } : {};
            });
        }, 1000);
    };

    // Subscribe wrapper that boots the lazy intervals on the first live event.
    const on = <T>(event: string, cb: (d: T) => void): (() => void) =>
        eventBus.onSafe<T>(event, (d) => {
            startIntervals();
            cb(d);
        });

    const subs = [
        on<{ sessionId: string; agentId: string; chunk: string }>(
            EVENTS.DEBATE_AGENT_CHUNK,
            (d) => {
                const key = `${d.sessionId}:${d.agentId}`;
                set((s) => {
                    const m = new Map(s.streamingContent);
                    // H-27: Limit Map size to prevent unbounded growth from stuck streams
                    if (m.size >= 100) {
                        const oldest = m.keys().next().value;
                        if (oldest) m.delete(oldest);
                    }
                    const existing = m.get(key) || '';
                    const updated = existing + d.chunk;
                    m.set(key, updated.length > 10240 ? updated.slice(-10240) : updated);
                    return { streamingContent: m };
                });
            },
        ),
        on<{ sessionId: string; agentId: string }>(EVENTS.DEBATE_AGENT_THINKING, (d) => {
            const event: DebateAgentEvent = {
                sessionId: d.sessionId,
                agentId: d.agentId,
                status: 'thinking',
                timestamp: Date.now(),
            };
            set((s) => {
                const m = new Map(s.currentThinking);
                if (m.size >= 50) {
                    const oldest = m.keys().next().value;
                    if (oldest) m.delete(oldest);
                }
                const ek = `${d.sessionId}:${d.agentId}`;
                m.set(ek, d.agentId);
                const em = setEmotion(
                    s.emotions,
                    ek,
                    computeEmotion(ek, 'thinking', s.agentEvents),
                );
                const cd = new Map(s.agentCountdowns);
                cd.set(ek, {
                    secondsLeft: get().agentTimeoutSeconds,
                    secondsTotal: get().agentTimeoutSeconds,
                });
                return {
                    agentEvents: [...s.agentEvents, event].slice(-MAX_AGENT_EVENTS),
                    currentThinking: m,
                    emotions: em,
                    agentCountdowns: cd,
                };
            });
        }),
        on<{ sessionId: string; agentId: string; content: string }>(
            EVENTS.DEBATE_AGENT_RESPONDED,
            (d) => {
                const event: DebateAgentEvent = {
                    sessionId: d.sessionId,
                    agentId: d.agentId,
                    status: 'responded',
                    timestamp: Date.now(),
                    // Cap stored content вЂ” agentEvents[].content is not rendered anywhere
                    // (DebateLivePanel only reads the array length), and full LLM responses
                    // retained in up to MAX_AGENT_EVENTS events would waste memory during
                    // long multi-round debates.
                    content: d.content.length > 2000 ? d.content.slice(0, 2000) : d.content,
                };
                set((s) => {
                    const m = new Map(s.currentThinking);
                    const ek = `${d.sessionId}:${d.agentId}`;
                    if (m.get(ek) === d.agentId) m.delete(ek);
                    const sc = new Map(s.streamingContent);
                    sc.delete(ek);
                    const em = setEmotion(
                        s.emotions,
                        ek,
                        computeEmotion(ek, 'responded', s.agentEvents),
                    );
                    const cd = new Map(s.agentCountdowns);
                    cd.delete(ek);
                    return {
                        agentEvents: [...s.agentEvents, event].slice(-MAX_AGENT_EVENTS),
                        currentThinking: m,
                        streamingContent: sc,
                        emotions: em,
                        agentCountdowns: cd,
                    };
                });
            },
        ),
        on<{ sessionId: string; agentId: string; error: string }>(
            EVENTS.DEBATE_AGENT_ERROR,
            (d) => {
                const event: DebateAgentEvent = {
                    sessionId: d.sessionId,
                    agentId: d.agentId,
                    status: 'error',
                    timestamp: Date.now(),
                    error: d.error,
                };
                set((s) => {
                    const m = new Map(s.currentThinking);
                    const ek = `${d.sessionId}:${d.agentId}`;
                    if (m.get(ek) === d.agentId) m.delete(ek);
                    const sc = new Map(s.streamingContent);
                    sc.delete(ek);
                    const em = setEmotion(
                        s.emotions,
                        ek,
                        computeEmotion(ek, 'error', s.agentEvents),
                    );
                    const cd = new Map(s.agentCountdowns);
                    cd.delete(ek);
                    return {
                        agentEvents: [...s.agentEvents, event].slice(-MAX_AGENT_EVENTS),
                        currentThinking: m,
                        streamingContent: sc,
                        emotions: em,
                        agentCountdowns: cd,
                    };
                });
            },
        ),
        on<{ sessionId: string; agentId: string; timeoutMs: number }>(
            EVENTS.DEBATE_AGENT_TIMEOUT,
            (d) => {
                const event: DebateAgentEvent = {
                    sessionId: d.sessionId,
                    agentId: d.agentId,
                    status: 'timeout',
                    timestamp: Date.now(),
                    timeoutMs: d.timeoutMs,
                };
                set((s) => {
                    const ek = `${d.sessionId}:${d.agentId}`;
                    const sc = new Map(s.streamingContent);
                    sc.delete(ek);
                    const ct = new Map(s.currentThinking);
                    ct.delete(ek);
                    const em = setEmotion(
                        s.emotions,
                        ek,
                        computeEmotion(ek, 'timeout', s.agentEvents),
                    );
                    const cdd = new Map(s.agentCountdowns);
                    cdd.delete(ek);
                    return {
                        agentEvents: [...s.agentEvents, event].slice(-MAX_AGENT_EVENTS),
                        streamingContent: sc,
                        currentThinking: ct,
                        emotions: em,
                        agentCountdowns: cdd,
                    };
                });
            },
        ),
        on<{
            sessionId: string;
            agentId: string;
            fromProvider: string;
            toProvider: string;
        }>(EVENTS.DEBATE_AGENT_FALLBACK, (d) => {
            const event: DebateAgentEvent = {
                sessionId: d.sessionId,
                agentId: d.agentId,
                status: 'fallback',
                timestamp: Date.now(),
                fromProvider: d.fromProvider,
                toProvider: d.toProvider,
            };
            set((s) => {
                const ek = `${d.sessionId}:${d.agentId}`;
                const sc = new Map(s.streamingContent);
                sc.delete(ek);
                const ct = new Map(s.currentThinking);
                ct.delete(ek);
                const em = setEmotion(
                    s.emotions,
                    ek,
                    computeEmotion(ek, 'fallback', s.agentEvents),
                );
                const cdd = new Map(s.agentCountdowns);
                cdd.delete(ek);
                return {
                    agentEvents: [...s.agentEvents, event].slice(-MAX_AGENT_EVENTS),
                    streamingContent: sc,
                    currentThinking: ct,
                    emotions: em,
                    agentCountdowns: cdd,
                };
            });
        }),
        on<{ sessionId: string; round: number; nodes: string[] }>(
            EVENTS.DEBATE_ROUND_STARTED,
            (d) => {
                set((s) => ({
                    roundEvents: [
                        ...s.roundEvents,
                        {
                            sessionId: d.sessionId,
                            round: d.round,
                            nodes: d.nodes,
                            status: 'started' as const,
                        },
                    ].slice(-MAX_ROUND_EVENTS),
                }));
            },
        ),
        on<{ sessionId: string; round: number }>(EVENTS.DEBATE_ROUND_ENDED, (d) => {
            set((s) => ({
                roundEvents: [
                    ...s.roundEvents,
                    { sessionId: d.sessionId, round: d.round, status: 'ended' as const },
                ].slice(-MAX_ROUND_EVENTS),
            }));
        }),
        on<{ sessionId: string; agentId: string; claim: string }>(
            EVENTS.DEBATE_MEMORY_CLAIM,
            (d) => {
                set((s) => {
                    const ek = `${d.sessionId}:${d.agentId}`;
                    const mb = new Map(s.memoryBubbles);
                    if (mb.size < 50) {
                        mb.set(ek, {
                            debateLabel:
                                d.claim.length > 30 ? d.claim.slice(0, 30) + '...' : d.claim,
                            similarity: 0.85,
                            relation: 'supports' as const,
                        });
                    }
                    return { memoryBubbles: mb };
                });
            },
        ),
        on<{
            sessionId: string;
            confidence: number;
            agreements: number;
            conflicts: number;
        }>(EVENTS.DEBATE_CONSENSUS_REACHED, (d) => {
            set({
                judgeWeights: {
                    pro: d.agreements,
                    con: d.conflicts,
                    neutral: Math.max(0, 10 - d.agreements - d.conflicts),
                },
            });
        }),
        // Quality impact live events
        on<{
            sessionId: string;
            techniqueId: string;
            eventType: string;
            round: number;
            agentId?: string;
            timestamp: number;
        }>(EVENTS.DEBATE_QUALITY_TECHNIQUE_APPLIED, (d) => {
            set((s) => {
                const aqa = new Map(s.agentQualityActivations);
                if (d.agentId) {
                    const ak = `${d.sessionId}:${d.agentId}`;
                    aqa.set(ak, (aqa.get(ak) ?? 0) + 1);
                }
                const rqe = [
                    { techniqueId: d.techniqueId, eventType: d.eventType, timestamp: d.timestamp },
                    ...s.recentQualityEvents,
                ].slice(0, 20);
                return { agentQualityActivations: aqa, recentQualityEvents: rqe };
            });
        }),
        on<{
            sessionId: string;
            techniqueCount: number;
            techniqueDelta?: number;
            timestamp: number;
        }>(EVENTS.DEBATE_QUALITY_IMPACT_COMPUTED, (d) => {
            set((s) => {
                const rqe = [
                    {
                        techniqueId: 'impact-computed',
                        eventType: 'FINAL_IMPACT',
                        timestamp: d.timestamp,
                    },
                    ...s.recentQualityEvents,
                ].slice(0, 20);
                return { recentQualityEvents: rqe };
            });
        }),
    ];

    // D-H-12: Transient UI state — no persist needed (zustand middleware not used;
    // data is live-only). The metrics/countdown intervals are created lazily by
    // `startIntervals()` on the first live event and cleared by `stopIntervals()`
    // (see clearSession/clearAll/destroy) — they are NOT always-on (FA-06).

    return {
        agentEvents: [],
        roundEvents: [],
        currentThinking: new Map(),
        streamingContent: new Map(),
        emotions: new Map(),
        agentCountdowns: new Map(),
        agentAddressing: new Map(),
        memoryBubbles: new Map(),
        judgeWeights: { pro: 0, con: 0, neutral: 0 },
        agentQualityActivations: new Map(),
        recentQualityEvents: [],
        agentTimeoutSeconds: 30,
        setAgentTimeout: (seconds) => set({ agentTimeoutSeconds: seconds }),
        addAgentEvent: (event) => {
            set((s) => ({ agentEvents: [...s.agentEvents, event].slice(-MAX_AGENT_EVENTS) }));
        },
        addRoundEvent: (event) => {
            set((s) => ({ roundEvents: [...s.roundEvents, event].slice(-MAX_ROUND_EVENTS) }));
        },
        clearSession: (sessionId) => {
            set((s) => {
                const prefix = `${sessionId}:`;
                const filterByPrefix = (m: Map<string, unknown>) => {
                    for (const k of m.keys()) {
                        if (k.startsWith(prefix)) m.delete(k);
                    }
                };
                const sc = new Map(s.streamingContent);
                const em = new Map(s.emotions);
                const cd = new Map(s.agentCountdowns);
                const aa = new Map(s.agentAddressing);
                const mb = new Map(s.memoryBubbles);
                const ct = new Map(s.currentThinking);
                const aqa = new Map(s.agentQualityActivations);
                filterByPrefix(sc);
                filterByPrefix(em);
                filterByPrefix(cd);
                filterByPrefix(aa);
                filterByPrefix(mb);
                filterByPrefix(ct);
                filterByPrefix(aqa);
                return {
                    agentEvents: s.agentEvents.filter((e) => e.sessionId !== sessionId),
                    roundEvents: s.roundEvents.filter((e) => e.sessionId !== sessionId),
                    streamingContent: sc,
                    emotions: em,
                    agentCountdowns: cd,
                    agentAddressing: aa,
                    memoryBubbles: mb,
                    currentThinking: ct,
                    agentQualityActivations: aqa,
                };
            });
            // FA-06: no other session has live data left → stop the lazy intervals.
            if (!hasLiveData()) stopIntervals();
        },
        clearAll: () => {
            set({
                agentEvents: [],
                roundEvents: [],
                currentThinking: new Map(),
                streamingContent: new Map(),
                emotions: new Map(),
                agentCountdowns: new Map(),
                agentAddressing: new Map(),
                memoryBubbles: new Map(),
                judgeWeights: { pro: 0, con: 0, neutral: 0 },
                agentQualityActivations: new Map(),
                recentQualityEvents: [],
            });
            // FA-06: store is empty → stop the lazy intervals.
            stopIntervals();
        },
        setAgentAddressing: (key, targetId) => {
            set((s) => {
                const m = new Map(s.agentAddressing);
                if (targetId === null) m.delete(key);
                else m.set(key, targetId);
                return { agentAddressing: m };
            });
        },
        addMemoryBubble: (key, bubble) => {
            set((s) => {
                const m = new Map(s.memoryBubbles);
                m.set(key, bubble);
                return { memoryBubbles: m };
            });
        },
        setJudgeWeights: (weights) => {
            set({ judgeWeights: weights });
        },
        // B10-114: Cleanup all event subscriptions to prevent memory leaks
        destroy: () => {
            subs.forEach((u) => u());
            // FA-06: also stop the lazy intervals (guards against HMR re-init leaks)
            stopIntervals();
        },
    };
});

// HMR cleanup: prevent duplicate event subscriptions on hot reload
let hmrDestroyed = false;
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        if (!hmrDestroyed) {
            hmrDestroyed = true;
            useDebateLiveStore.getState().destroy();
        }
    });
}
