import { useEffect } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { DebateSession, DebateVerdict } from '../../kernel/contracts/debate-types';
import type { HumanVote } from '../../kernel/contracts/debate-types';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import { eventBus, EVENTS } from '../../kernel/instances';
import { orchestrator } from '../../kernel/instances';

export interface UseDebatePanelSubscriptionsArgs {
    session: DebateSession | null;
    setSession: (s: DebateSession | null) => void;
    setStreamingArgIds: (ids: Set<string>) => void;
    setVerdict: (v: DebateVerdict | null) => void;
    setIsLoading: (v: boolean) => void;
    setError: (e: string | null) => void;
    setActionLoading: (v: 'start' | 'inject' | null) => void;
    setViewTab: Dispatch<
        SetStateAction<'active' | 'history' | 'tournament' | 'verdict' | 'memory'>
    >;
    setShowVotePanel: (round: number | null) => void;
    setSelectedAgents: (agents: string[]) => void;
    syncHumanVotesFromSession: (data: DebateSession) => void;
    refreshHistory: () => void;
    prevRoundRef: MutableRefObject<number>;
    sessionRef: MutableRefObject<DebateSession | null>;
    scrollRef: MutableRefObject<HTMLDivElement | null>;
    timersRef: MutableRefObject<Set<ReturnType<typeof setTimeout>>>;
    isMountedRef: MutableRefObject<boolean>;
    selectedAgentsRef: MutableRefObject<string[]>;
    t: (key: string) => string;
    getCachedVerdict?: (sessionId: string) => DebateVerdict | null | undefined;
}

// Encapsulates all EventBus/live-store subscriptions for DebatePanel,
// plus the searchParams initialization side-effects. Returns nothing —
// state lives in the parent component, this hook wires the subscriptions.
export function useDebatePanelSubscriptions(args: UseDebatePanelSubscriptionsArgs): void {
    const {
        session,
        setSession,
        setStreamingArgIds,
        setVerdict,
        setIsLoading,
        setError,
        setActionLoading,
        setViewTab,
        setShowVotePanel,
        setSelectedAgents,
        syncHumanVotesFromSession,
        refreshHistory,
        prevRoundRef,
        sessionRef,
        scrollRef,
        timersRef,
        isMountedRef,
        selectedAgentsRef,
        t,
        getCachedVerdict,
    } = args;

    // Live streaming content → Set of actively streaming arg ids
    useEffect(() => {
        const unsub = useDebateLiveStore.subscribe((state) => {
            queueMicrotask(() => {
                setStreamingArgIds(new Set(state.streamingContent.keys()));
            });
        });
        return () => {
            unsub();
        };
    }, [setStreamingArgIds]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, [isMountedRef]);

    // Main session update subscription
    useEffect(() => {
        const unsub = eventBus.onSafe<DebateSession>('debate:updated', (data) => {
            if (!isMountedRef.current) return;
            if (!data.topic || !data.status) return;
            if (data.id && sessionRef.current?.id && data.id !== sessionRef.current?.id) return;
            queueMicrotask(() => {
                if (!isMountedRef.current) return;
                try {
                    const prevRound = prevRoundRef.current;
                    if (
                        data.currentRound > prevRound &&
                        prevRound > 0 &&
                        data.status === 'active'
                    ) {
                        setShowVotePanel(data.currentRound - 1);
                    }
                    prevRoundRef.current = data.currentRound;
                    syncHumanVotesFromSession(data);
                    setSession({ ...data });
                    if (data.status === 'active') {
                        setViewTab((prev) => (prev === 'verdict' ? 'active' : prev));
                    }
                    if (data.status === 'completed') {
                        setViewTab((prev) => (prev === 'active' ? 'verdict' : prev));
                    }
                    setIsLoading(false);
                    setError(null);
                    setActionLoading(null);
                    const scrollTimer = setTimeout(() => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                        }
                    }, 100);
                    timersRef.current.add(scrollTimer);
                } catch {
                    if (isMountedRef.current) setError(t('debate.error_process_update'));
                }
            });
        });
        const timer = setTimeout(() => {
            if (isMountedRef.current) setIsLoading(false);
        }, 3000);

        refreshHistory();
        const top = orchestrator.getActiveTopology();
        if (top && selectedAgentsRef.current.length === 0) {
            const agents = top.nodes.filter((n) => n.type === 'agent').map((n) => n.id);
            setSelectedAgents(agents.slice(0, 10));
        }

        const timers = timersRef.current;
        return () => {
            unsub();
            clearTimeout(timer);
            timers.forEach(clearTimeout);
            timers.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncHumanVotesFromSession, refreshHistory]);

    // Verdict subscription + cached verdict restore
    useEffect(() => {
        const unsubVerdict = eventBus.on(EVENTS.DEBATE_VERDICT_GENERATED, (data) => {
            const payload = data as { sessionId: string; verdict: DebateVerdict };
            if (payload.sessionId && session?.id && payload.sessionId !== session?.id) return;
            setVerdict(payload.verdict);
        });
        if (session?.id && session.status === 'completed' && getCachedVerdict) {
            const cached = getCachedVerdict(session.id);
            if (cached) setVerdict(cached);
        }
        return () => {
            unsubVerdict();
        };
    }, [session?.id, session?.status, setVerdict, getCachedVerdict]);

    // Terminal events (cancelled/failed) → clear session state
    useEffect(() => {
        const unsubCancel = eventBus.on(EVENTS.DEBATE_SESSION_CANCELLED, (payload) => {
            if (!isMountedRef.current) return;
            const p = payload as { sessionId: string };
            if (sessionRef.current?.id && p.sessionId !== sessionRef.current.id) return;
            setSession(null);
            setIsLoading(false);
            setError(null);
            setActionLoading(null);
        });
        const unsubFail = eventBus.on(EVENTS.DEBATE_SESSION_FAILED, (payload) => {
            if (!isMountedRef.current) return;
            const p = payload as { sessionId: string };
            if (sessionRef.current?.id && p.sessionId !== sessionRef.current.id) return;
            setSession(null);
            setIsLoading(false);
            setError(null);
            setActionLoading(null);
        });
        return () => {
            unsubCancel();
            unsubFail();
        };
    }, [isMountedRef, sessionRef, setSession, setIsLoading, setError, setActionLoading]);
}

export type { DebateVerdict, HumanVote };
