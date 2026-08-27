import React, { useState } from 'react';
import { PanelSkeleton } from '../Common/Skeleton';
import DebateSetupWizard from './DebateSetupWizard';
import DebateHistoryPanel from './DebateHistoryPanel';
import DebateAnalytics from './DebateAnalytics';
import CollabDebatePanel from './CollabDebatePanel';
import { TournamentBracketView } from './TournamentBracketView';
import { DebateVerdictPanel } from './DebateVerdictPanel';
import { DebateMemoryPanel } from './DebateMemoryPanel';
import DebateSidebar from './DebateSidebar';
import DebateChat from './DebateChat';
import ErrorBoundary from '../Common/ErrorBoundary';
import { TabBarSection } from './TabBarSection';
import { InjectBarSection } from './InjectBarSection';
import VotePanelSection from './VotePanelSection';
import VerdictActionButtons from './VerdictActionButtons';
import type { DebateSession, DebateVerdict, HumanVote } from '../../kernel/contracts';
import type { ProbeResult } from '../../kernel/contracts/probe';
import type { AutoDebateResult, ProviderWinRate } from '../../kernel/contracts/auto-debate';
import { probeService, autoDebateService as autoDebate } from '../../kernel/instances';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import { debateArenaPanel, debateLoadingState, debateLogArea } from '../../styles/common';

// FIX (audit): extracted from duplicate mobile/desktop JSX in DebatePanel.tsx
// Reduces ~553 lines of duplication. Mobile uses containerStyle=mobileFlex, showSidebar=false.
// Desktop uses containerStyle=desktopFlex, showSidebar=true.
export function DebateTabContent({
    containerStyle,
    showSidebar,
    session,
    viewTab,
    setViewTab,
    history,
    expandedHistory,
    setExpandedHistory,
    refreshHistory,
    getAgentLabel,
    availableAgents,
    selectedAgents,
    toggleAgent,
    onSelectAll,
    onDeselectAll,
    topic,
    onTopicChange,
    strategy,
    onStrategyChange,
    maxRounds,
    onMaxRoundsChange,
    debateTemperature,
    onTemperatureChange,
    agentArchetypes,
    onArchetypeChange,
    agentConstraints,
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
    autoResults,
    autoWinRates,
    refreshAuto,
    onConstraintChange,
    onStart,
    replay,
}: {
    containerStyle: React.CSSProperties;
    showSidebar?: boolean;
    session: DebateSession | null;
    viewTab: string;
    setViewTab: (tab: string) => void;
    history: DebateSession[];
    expandedHistory: Set<string>;
    setExpandedHistory: React.Dispatch<React.SetStateAction<Set<string>>>;
    refreshHistory: () => void;
    getAgentLabel: (id: string) => string;
    availableAgents: Array<{ id: string; label: string; config?: Record<string, unknown> }>;
    selectedAgents: string[];
    toggleAgent: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    topic: string;
    onTopicChange: (t: string) => void;
    // CRIT-9 fix: use DebateSessionStrategy instead of string to preserve all valid values
    strategy: import('../../kernel/contracts/debate-types').DebateSessionStrategy;
    onStrategyChange: (
        v: import('../../kernel/contracts/debate-types').DebateSessionStrategy,
    ) => void;
    maxRounds: number;
    onMaxRoundsChange: (r: number) => void;
    debateTemperature: number;
    onTemperatureChange: (t: number) => void;
    agentArchetypes: Record<string, string>;
    onArchetypeChange: (key: string) => void;
    agentConstraints: Record<string, string>;
    selectedHistoricalIds: string[];
    setShowHistoricalPicker: (v: boolean) => void;
    humanVotes: HumanVote[];
    showVotePanel: number | null;
    setShowVotePanel: (r: number | null) => void;
    setHumanVotes: (v: HumanVote[]) => void;
    getRoundParticipants: (round: number) => string[];
    streamingArgIds: Set<string>;
    verdict: DebateVerdict | null;
    userInjection: string;
    setUserInjection: (s: string) => void;
    actionLoading: 'start' | 'inject' | null;
    handleInject: () => void;
    isLoading: boolean;
    t: (k: string) => string;
    probeResults: Map<string, ProbeResult> | null;
    expandedProbe: string | null;
    setExpandedProbe: (id: string | null) => void;
    setProbeResults: (r: Map<string, ProbeResult> | null) => void;
    showAuto: boolean;
    setShowAuto: (v: boolean) => void;
    autoResults: AutoDebateResult[] | null;
    autoWinRates: ProviderWinRate[];
    refreshAuto: () => void;
    onConstraintChange: (id: string, constraint: string) => void;
    onStart: () => void;
    replay?: () => void;
}) {
    const flexColumn: React.CSSProperties = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
    };
    const [internalProbeLoading, setInternalProbeLoading] = useState(false);
    const combinedProbeLoading = internalProbeLoading;
    const debateLiveAgentEvents = useDebateLiveStore((s) => s.agentEvents);
    const sessionErrors = React.useMemo(() => {
        if (!session?.id) return [];
        return debateLiveAgentEvents
            .filter(
                (e) =>
                    e.sessionId === session.id &&
                    (e.status === 'error' || e.status === 'timeout') &&
                    e.error,
            )
            .map((e) => ({
                agentId: e.agentId,
                error: e.error ?? '',
                timestamp: e.timestamp,
                isTimeout: e.status === 'timeout',
            }));
    }, [debateLiveAgentEvents, session]);

    return (
        <div style={containerStyle}>
            {showSidebar && <DebateSidebar />}
            <div style={flexColumn}>
                {session && (
                    <TabBarSection
                        viewTab={viewTab}
                        setViewTab={setViewTab}
                        historyLength={history.length}
                        sessionStatus={session?.status}
                        refreshHistory={refreshHistory}
                    />
                )}

                {viewTab === 'tournament' ? (
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <TournamentBracketView />
                    </div>
                ) : viewTab === 'memory' ? (
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <DebateMemoryPanel />
                    </div>
                ) : viewTab === 'history' ? (
                    <DebateHistoryPanel
                        history={history}
                        expandedHistory={expandedHistory}
                        onToggleExpand={(id) =>
                            setExpandedHistory((prev) => {
                                const next = new Set<string>(prev);
                                if (next.has(id)) next.delete(id);
                                else next.add(id);
                                return next;
                            })
                        }
                        onRefresh={refreshHistory}
                        t={t}
                    />
                ) : viewTab === 'verdict' && verdict ? (
                    <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                        <DebateVerdictPanel verdict={verdict} sessionId={session?.id ?? ''} />
                        <VerdictActionButtons
                            session={session}
                            t={t}
                            onViewAnalysis={() => setViewTab('active')}
                            onReplay={replay}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            flex: 1,
                            display: 'grid',
                            gridTemplateColumns: session ? '1fr 380px' : '1fr',
                            gap: '1.5rem',
                            minHeight: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {isLoading && !session && (
                            <div aria-live="polite" aria-busy="true" style={debateLoadingState}>
                                <PanelSkeleton />
                            </div>
                        )}
                        <div className="glass-panel" style={debateArenaPanel}>
                            {!session ? (
                                <DebateSetupWizard
                                    topic={topic}
                                    onTopicChange={onTopicChange}
                                    strategy={strategy}
                                    onStrategyChange={onStrategyChange}
                                    maxRounds={maxRounds}
                                    onMaxRoundsChange={onMaxRoundsChange}
                                    debateTemperature={debateTemperature}
                                    onTemperatureChange={onTemperatureChange}
                                    agentArchetypes={agentArchetypes}
                                    onArchetypeChange={onArchetypeChange}
                                    selectedAgents={selectedAgents}
                                    onToggleAgent={toggleAgent}
                                    onSelectAll={onSelectAll}
                                    onDeselectAll={onDeselectAll}
                                    availableAgents={availableAgents}
                                    agentConstraints={agentConstraints}
                                    onConstraintChange={onConstraintChange}
                                    probeResults={probeResults}
                                    probeLoading={combinedProbeLoading}
                                    onProbe={async () => {
                                        setExpandedProbe(null);
                                        setInternalProbeLoading(true);
                                        setProbeResults(null);
                                        try {
                                            const targets =
                                                selectedAgents.length >= 2
                                                    ? selectedAgents
                                                    : availableAgents.map((a) => a.id);
                                            const participants = targets.map((id) => {
                                                const node = availableAgents.find(
                                                    (a) => a.id === id,
                                                );
                                                return {
                                                    id,
                                                    provider:
                                                        (node?.config?.provider as string) ||
                                                        undefined,
                                                    modelId:
                                                        (node?.config?.model as string) !== 'auto'
                                                            ? (node?.config?.model as string)
                                                            : undefined,
                                                };
                                            });
                                            const results =
                                                await probeService.probeForDebate(participants);
                                            setProbeResults(results);
                                        } catch {
                                            /* silently fail */
                                        } finally {
                                            setInternalProbeLoading(false);
                                        }
                                    }}
                                    expandedProbe={expandedProbe}
                                    onToggleProbe={setExpandedProbe}
                                    actionLoading={actionLoading}
                                    onStart={onStart}
                                    showAuto={showAuto}
                                    onToggleAuto={() => setShowAuto(!showAuto)}
                                    autoResults={autoResults ?? []}
                                    autoWinRates={autoWinRates}
                                    onAutoDebate={async (opts: unknown) => {
                                        const r = await autoDebate.runAutoDebate(
                                            opts as Parameters<typeof autoDebate.runAutoDebate>[0],
                                        );
                                        refreshAuto();
                                        return r;
                                    }}
                                    onStressTest={async (c: unknown) => {
                                        const r = await autoDebate.stressTest(
                                            c as Parameters<typeof autoDebate.stressTest>[0],
                                        );
                                        refreshAuto();
                                        return r;
                                    }}
                                    onBatchTest={async (topic: string, runs?: number) => {
                                        const r = await autoDebate.batchTest(topic, runs ?? 1);
                                        refreshAuto();
                                        return r;
                                    }}
                                    onClearAuto={() => {
                                        autoDebate.clearResults();
                                        refreshAuto();
                                    }}
                                    t={t}
                                    selectedHistoricalCount={selectedHistoricalIds.length}
                                    onOpenHistoricalFigures={() => setShowHistoricalPicker(true)}
                                />
                            ) : (
                                <>
                                    {/* Active thesis */}
                                    <div className="debate-active-thesis">
                                        <div className="debate-header-label">
                                            {t('debate.active_thesis')}
                                        </div>
                                        <div className="debate-topic-text">{session.topic}</div>
                                    </div>

                                    <div
                                        role="log"
                                        aria-live="polite"
                                        aria-label="Debate arguments"
                                        style={debateLogArea}
                                    >
                                        <ErrorBoundary name="DebateChat" variant="panel">
                                            <DebateChat
                                                arguments={session.arguments ?? []}
                                                isActive={session.status === 'active'}
                                                t={t}
                                                agentLabel={getAgentLabel}
                                                streamingArgIds={streamingArgIds}
                                                agentErrors={sessionErrors}
                                            />
                                        </ErrorBoundary>
                                    </div>

                                    <VotePanelSection
                                        showVotePanel={showVotePanel}
                                        sessionStatus={session.status}
                                        getRoundParticipants={getRoundParticipants}
                                        getAgentLabel={getAgentLabel}
                                        humanVotes={humanVotes}
                                        setHumanVotes={setHumanVotes}
                                        setShowVotePanel={setShowVotePanel}
                                    />

                                    {session.status !== 'completed' && (
                                        <ErrorBoundary name="CollabDebatePanel" variant="panel">
                                            <CollabDebatePanel
                                                session={session}
                                                getAgentLabel={getAgentLabel}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {session.status !== 'completed' && (
                                        <InjectBarSection
                                            userInjection={userInjection}
                                            setUserInjection={setUserInjection}
                                            actionLoading={actionLoading}
                                            handleInject={handleInject}
                                            t={t}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                        {session && (
                            <ErrorBoundary name="DebateAnalytics" variant="panel">
                                <DebateAnalytics
                                    session={session}
                                    getAgentLabel={getAgentLabel}
                                    t={t}
                                />
                            </ErrorBoundary>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
