import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, AlertTriangle, X } from 'lucide-react';
import {
    debateService,
    debateHumanService,
    sessionManager,
    hypothesisService,
    debateWorkspace,
    getAllSettings,
} from '../../kernel/instances';
import type {
    DebateSession,
    DebateParticipant,
    DebateConstraint,
    ArgumentStrategy,
    HumanVote,
} from '../../kernel/instances';
import type { DebateVerdict, DebateSessionStrategy } from '../../kernel/contracts/debate-types';
import type { ProviderWinRate } from '../../kernel/contracts/auto-debate';
import type { ProbeResult } from '../../kernel/contracts/probe';
import {
    getArchetypePrompt,
    getArchetypeName,
    getArchetypesForRole,
    getRecommendedArchetypes,
} from '../../kernel/instances';
import { orchestrator } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';

import ModuleInfo from '../ModuleInfo';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import { autoDebateService as autoDebate } from '../../kernel/instances';
import { DebateTabContent } from './DebateTabContent';
import { useChatStore } from '../../stores/chat/store';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useNow } from '../../hooks/useNow';
import { useDebatePanelSubscriptions } from './useDebatePanelSubscriptions';
import { HistoricalFiguresPicker } from './HistoricalFiguresPicker';
import { DebateSessionHeader } from './DebateSessionHeader';
import { getHistoricalFigure } from '../../kernel/instances';
import {
    debatePanelRoot,
    dismissBtn,
    errorBanner,
    pageSubtitleMuted,
    pageTitleLarge,
    sectionHeaderBottom,
} from '../../styles/common';

const DebatePanel: React.FC = () => {
    const [searchParams] = useSearchParams();
    const pendingHypothesisId = useRef<string | null>(null);
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [session, setSession] = useState<DebateSession | null>(() => {
        try {
            return debateService.getActiveDebateSession();
        } catch {
            return null;
        }
    });
    const [topic, setTopic] = useState('');
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [strategy, setStrategy] = useState<DebateSessionStrategy>('round_robin');
    const [maxRounds, setMaxRounds] = useState(10);
    const now = useNow(1000);
    const [userInjection, setUserInjection] = useState('');
    const [isLoading, setIsLoading] = useState(() => {
        try {
            return !debateService.getActiveDebateSession();
        } catch {
            return true;
        }
    });
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const [actionLoading, setActionLoading] = useState<'start' | 'inject' | null>(null);
    const [autoResults, setAutoResults] = useState(() => {
        try {
            return autoDebate.getResults();
        } catch {
            return null;
        }
    });
    const [autoWinRates, setAutoWinRates] = useState<ProviderWinRate[]>(() => {
        try {
            return autoDebate.getWinRates();
        } catch {
            return [];
        }
    });
    const [showAuto, setShowAuto] = useState(false);
    const [probeResults, setProbeResults] = useState<Map<string, ProbeResult> | null>(null);
    const [expandedProbe, setExpandedProbe] = useState<string | null>(null);
    const [viewTab, setViewTab] = useState<
        'active' | 'history' | 'tournament' | 'verdict' | 'memory'
    >('active');
    const [streamingArgIds, setStreamingArgIds] = useState<Set<string>>(new Set());
    const [verdict, setVerdict] = useState<DebateVerdict | null>(null);
    const [agentArchetypes, setAgentArchetypes] = useState<Record<string, string>>({});
    const [agentConstraints, setAgentConstraints] = useState<Record<string, string>>({});
    const [debateTemperature, setDebateTemperature] = useState(5);
    const [factCheckLevel, setFactCheckLevel] = useState<'off' | 'sampled' | 'all'>('sampled');
    const [history, setHistory] = useState<DebateSession[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
    const [selectedHistoricalIds, setSelectedHistoricalIds] = useState<string[]>([]);
    const [showHistoricalPicker, setShowHistoricalPicker] = useState(false);

    const prevRoundRef = useRef(0);
    const lastSessionRef = useRef<DebateSession | null>(null);
    const sessionRef = useRef(session);
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);
    const [humanVotes, setHumanVotes] = useState<HumanVote[]>(() =>
        debateHumanService.getHumanVotes(debateService.getActiveDebateSession()),
    );
    const [showVotePanel, setShowVotePanel] = useState<number | null>(null);

    const syncHumanVotesFromSession = useCallback((data: DebateSession) => {
        if (!data.roundVotes) {
            setHumanVotes([]);
            return;
        }
        setHumanVotes(Object.values(data.roundVotes).flat());
    }, []);

    const getRoundParticipants = useCallback(
        (round: number): string[] => {
            if (!session) return [];
            const roundArgs = (session.arguments ?? []).filter((a) => a.round === round);
            return [...new Set(roundArgs.map((a) => a.agentId))];
        },
        [session],
    );

    const refreshHistory = useCallback(() => {
        setHistory(sessionManager.getDebateHistory());
    }, []);

    const refreshAuto = useCallback(() => {
        setAutoResults(autoDebate.getResults());
        setAutoWinRates(autoDebate.getWinRates());
    }, []);

    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedAgentsRef = useRef(selectedAgents);
    const isMountedRef = useRef(true);
    const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

    useDebatePanelSubscriptions({
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
        getCachedVerdict: (id) => debateService.getCachedVerdict(id),
    });

    useEffect(() => {
        selectedAgentsRef.current = selectedAgents;
    }, [selectedAgents]);

    useEffect(() => {
        const agents = selectedAgentsRef.current;
        if (!topic || agents.length === 0) return;
        const recommended = getRecommendedArchetypes(topic);
        if (recommended) {
            setAgentArchetypes((prev) => {
                if (Object.keys(prev).length > 0) return prev;
                const next: Record<string, string> = {};
                for (let i = 0; i < agents.length; i++) {
                    next[agents[i]!] = recommended[i % recommended.length]!;
                }
                return next;
            });
        }
    }, [topic]);

    useEffect(() => {
        const thesis = searchParams.get('thesis');
        const hypothesisId = searchParams.get('hypothesisId');
        const roomId = searchParams.get('roomId');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (thesis) setTopic(decodeURIComponent(thesis));
        if (hypothesisId) pendingHypothesisId.current = hypothesisId;
        if (roomId) {
            const room = debateWorkspace.getRoomEntry(roomId);
            if (room) setTopic(room.topic);
        }
        if (thesis || hypothesisId || roomId) {
            window.history.replaceState({}, '', '/debate');
        }
    }, [searchParams]);

    const availableAgents =
        orchestrator.getActiveTopology()?.nodes.filter((n) => n.type === 'agent') || [];

    const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        eventBus.emit(EVENTS.NOTIFICATION, { message, type });
    };

    const clearError = useAutoClearError(setError);

    const handleStart = async () => {
        if (!topic || selectedAgents.length + selectedHistoricalIds.length < 2) {
            notify('Please enter a topic and select at least 2 agents to debate.', 'warning');
            return;
        }
        setActionLoading('start');
        setError(null);
        try {
            const roleOrder: Array<'pro' | 'con' | 'neutral'> = ['pro', 'con', 'neutral'];
            const agentParticipants: DebateParticipant[] = selectedAgents.map((id, i) => {
                const node = availableAgents.find((a) => a.id === id);
                const nodeProvider = (node?.config?.provider as string) || '';
                const nodeModel = (node?.config?.model as string) || 'auto';
                const provider = nodeProvider;
                const nodeStrategy = node?.config?.strategy as string | undefined;
                const role = roleOrder[i % roleOrder.length]!;
                const archetypeId = agentArchetypes[id];
                const archetypePrompt = archetypeId ? getArchetypePrompt(archetypeId) : undefined;
                const archetypeName = archetypeId ? getArchetypeName(archetypeId) : undefined;
                const archetypesForRole = getArchetypesForRole(role);
                const systemPrompt =
                    archetypePrompt ??
                    archetypesForRole[i % archetypesForRole.length]?.systemPrompt ??
                    '';
                const constraint = agentConstraints[id] || 'none';
                return {
                    id,
                    name: archetypeName || node?.label || id,
                    role,
                    systemPrompt: systemPrompt ? `${systemPrompt}\n\n` : '',
                    provider: provider || undefined,
                    modelId: nodeModel !== 'auto' ? nodeModel : undefined,
                    strategy: nodeStrategy as ArgumentStrategy | undefined,
                    constraint:
                        strategy === 'constrained' ? (constraint as DebateConstraint) : undefined,
                };
            });
            const historicalParticipants: DebateParticipant[] = selectedHistoricalIds
                .map((figId, i) => {
                    const fig = getHistoricalFigure(figId);
                    if (!fig) return null;
                    return {
                        id: `historical:${fig.id}`,
                        name: fig.name,
                        role: roleOrder[(selectedAgents.length + i) % roleOrder.length],
                        systemPrompt: fig.systemPrompt,
                    };
                })
                .filter(Boolean) as DebateParticipant[];
            const allParticipants = [...agentParticipants, ...historicalParticipants];
            const activeChatId = useChatStore.getState().activeSessionId;
            const started = await debateService.startDebate(
                topic,
                allParticipants,
                strategy,
                maxRounds,
                { debateTemperature: debateTemperature / 10, qualitySettings: getAllSettings() },
                activeChatId || undefined,
            );
            if (pendingHypothesisId.current && started?.id) {
                void hypothesisService.linkDebate(pendingHypothesisId.current, started.id);
                pendingHypothesisId.current = null;
            }
        } catch (e) {
            if (!isMountedRef.current) return;
            const msg = e instanceof Error ? e.message : String(e);
            console.error('DEBATE START ERROR:', e); // Показать реальную ошибку в консоль
            if (
                msg.includes('402') ||
                msg.includes('credits') ||
                msg.includes('Payment Required')
            ) {
                setError(t('debate.error_insufficient_credits'));
            } else if (msg.includes('Circuit breaker is OPEN')) {
                setError(t('debate.error_provider_blocked'));
            } else {
                setError(`${t('debate.error_start')}: ${msg}`); // Показать сообщение ошибки
            }
            clearError();
        } finally {
            if (isMountedRef.current) setActionLoading(null);
        }
    };

    const handleInject = async () => {
        if (!userInjection.trim()) return;
        setActionLoading('inject');
        setError(null);
        try {
            await debateHumanService.addArgument(
                debateService.getActiveDebateSession(),
                'User (Human-in-loop)',
                userInjection,
                1.0,
            );
            if (isMountedRef.current) {
                setUserInjection('');
                setActionLoading(null);
            }
        } catch {
            if (!isMountedRef.current) return;
            setActionLoading(null);
            setError(t('debate.error_inject'));
            clearError();
        }
    };

    const handleReplay = () => {
        const s = lastSessionRef.current || session;
        if (!s) return;

        // Use existing core capability to restore the session
        sessionManager.restoreDebateSession(s.id);
        refreshHistory();
        notify(t('debate.restoring_session'), 'info');
    };

    const toggleAgent = (id: string) => {
        setSelectedAgents((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
        );
    };

                    const getAgentLabel = (id: string) => {
                        if (id === 'User (Human-in-loop)') return t('debate.human_observer');
                        return resolveAgentIdentity(id).displayName;
                    };

    return (
        <div style={debatePanelRoot}>
            {/* Top Header */}
            <div style={sectionHeaderBottom}>
                <div>
                    <h2 style={pageTitleLarge}>
                        <MessageSquare size={28} color="#a855f7" aria-hidden="true" />{' '}
                        {t('debate.title')}
                    </h2>
                    <p style={pageSubtitleMuted}>{t('debate.subtitle')}</p>
                </div>

                {session && (
                    <DebateSessionHeader
                        session={session}
                        now={now}
                        factCheckLevel={factCheckLevel}
                        onFactCheckLevelChange={(v) => {
                            setFactCheckLevel(v);
                            debateService.factCheckService.setLevel(v);
                        }}
                        isMountedRef={isMountedRef}
                        setError={setError}
                        clearError={clearError}
                        t={t}
                    />
                )}
            </div>

            {error && (
                <div role="alert" aria-live="assertive" style={errorBanner}>
                    <AlertTriangle size={14} aria-hidden="true" /> {error}
                    <button
                        onClick={() => setError(null)}
                        style={{ ...dismissBtn, padding: 0 }}
                        aria-label={t('common.dismiss_error')}
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </div>
            )}
            {(() => {
                const baseProps = {
                    session,
                    viewTab,
                    setViewTab: (tab: string) =>
                        setViewTab(
                            tab as 'active' | 'history' | 'tournament' | 'verdict' | 'memory',
                        ),
                    history,
                    expandedHistory,
                    setExpandedHistory,
                    refreshHistory,
                    getAgentLabel,
                    availableAgents,
                    selectedAgents,
                    toggleAgent,
                    onSelectAll: () => setSelectedAgents(availableAgents.map((a) => a.id)),
                    onDeselectAll: () => setSelectedAgents([]),
                    topic,
                    onTopicChange: setTopic,
                    strategy,
                    onStrategyChange: (v: DebateSessionStrategy) => setStrategy(v),
                    maxRounds,
                    onMaxRoundsChange: setMaxRounds,
                    debateTemperature,
                    onTemperatureChange: setDebateTemperature,
                    agentArchetypes,
                    onArchetypeChange: (key: string) => {
                        if (key === 'auto') {
                            setAgentArchetypes({});
                        } else {
                            const next: Record<string, string> = {};
                            for (const id of selectedAgents) next[id] = key;
                            setAgentArchetypes(next);
                        }
                    },
                    agentConstraints,
                    onConstraintChange: (id: string, constraint: string) =>
                        setAgentConstraints((prev) => ({ ...prev, [id]: constraint })),
                    selectedHistoricalIds,
                    setShowHistoricalPicker,
                    humanVotes,
                    showVotePanel,
                    setShowVotePanel,
                    setHumanVotes,
                    getRoundParticipants,
                    streamingArgIds,
                    verdict,
                    userInjection,
                    setUserInjection,
                    actionLoading,
                    handleInject,
                    isLoading,
                    t,
                    probeResults,
                    expandedProbe,
                    setExpandedProbe,
                    setProbeResults,
                    showAuto,
                    setShowAuto,
                    autoResults: autoResults ?? [],
                    autoWinRates,
                    refreshAuto,
                    onStart: handleStart,
                    replay: handleReplay,
                } as const;
                return (
                    <DebateTabContent
                        containerStyle={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            overflow: 'hidden',
                        }}
                        {...baseProps}
                    />
                );
            })()}
            <HistoricalFiguresPicker
                isOpen={showHistoricalPicker}
                onClose={() => setShowHistoricalPicker(false)}
                selectedIds={selectedHistoricalIds}
                onToggle={(id) =>
                    setSelectedHistoricalIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                    )
                }
                max={5}
            />
            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default DebatePanel;
