import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sliders, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    debateEngine,
    debateService,
    cognitiveIntelligenceService,
    orchestrator,
    sessionManager,
} from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import { DebateRuntimeEvents } from '../../kernel/events/debate-runtime-events';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import type {
    DebateSessionSnapshot,
    TopologyType,
    TopologyNode,
    DebateTopology,
} from '../../kernel/instances';
import type {
    CognitiveMetricsSnapshot,
    CognitivePressure,
    CognitiveIssue,
} from '../../kernel/instances';
import type { DebateArgument } from '../../kernel/instances';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import { useChatStore } from '../../stores/chat/store';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import CreateSessionForm from './CreateSessionForm';
import SessionListPanel from './SessionListPanel';
import SessionDetailHeader from './SessionDetailHeader';
import SessionViewTabs from './SessionViewTabs';
import { CognitiveMetricsCard } from './CognitiveMetricsCard';
import { CognitivePressureCard } from './CognitivePressureCard';
import { DiagnosticIssuesPanel } from './DiagnosticIssuesPanel';
import { TOPOLOGY_ROLES } from './debate-runtime-constants';
import {
    debateRuntimeGrid,
    debateRuntimeOverlay,
    debateRuntimeOverlayDesc,
    debateRuntimeOverlayTitle,
    debateRuntimeRoot,
    debateRuntimeSubtitle,
    debateRuntimeTitle,
    errorContainer,
    flexBetween,
    grid2,
    purpleBorderSection,
} from '../../styles/common';

const DebateRuntimePanel: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [sessions, setSessions] = useState<DebateSessionSnapshot[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [topic, setTopic] = useState('');
    const [topologyType, setTopologyType] = useState<TopologyType>('roundtable');
    const [error, setError] = useState<string | null>(null);
    const [actionLoading] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const isMountedRef = useRef(true);

    const currentThinking = useDebateLiveStore((s) => s.currentThinking);
    const thinkingAgentId = selectedId ? currentThinking.get(selectedId) : undefined;
    const [cognitiveMetrics, setCognitiveMetrics] = useState<CognitiveMetricsSnapshot | null>(null);
    const [cognitivePressure, setCognitivePressure] = useState<CognitivePressure | null>(null);
    const [diagnosticIssues, setDiagnosticIssues] = useState<CognitiveIssue[]>([]);
    const [linkedChatIds, setLinkedChatIds] = useState<string[]>([]);
    const [availableNodes, setAvailableNodes] = useState<
        Array<{ id: string; label: string; provider?: string; model?: string; prompt?: string }>
    >([]);
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
    const [agentRoles, setAgentRoles] = useState<Record<string, string>>({});
    const [sessionArgs, setSessionArgs] = useState<Map<string, DebateArgument[]>>(new Map());
    const [sessionViewTab, setSessionViewTab] = useState<'overview' | 'arguments' | 'controls'>(
        'overview',
    );
    const argsRef = useRef(sessionArgs);

    const refreshCognitive = useCallback(() => {
        try {
            setCognitiveMetrics(cognitiveIntelligenceService.getMetrics());
            setCognitivePressure(cognitiveIntelligenceService.getPressure());
            setDiagnosticIssues(cognitiveIntelligenceService.getActiveIssues());
        } catch {
            /* container not ready */
        }
    }, []);

    const refreshSessions = useCallback(() => {
        try {
            const active = debateEngine.getActiveSessions() || [];
            setSessions([...active]);
        } catch {
            /* container not ready */
        }
    }, []);

    useEffect(() => {
        try {
            const top = orchestrator.getActiveTopology();
            const nodes = (top?.nodes || [])
                .filter((n: { type: string }) => n.type === 'agent')
                .map((n: { id: string; label: string; config: Record<string, unknown> }) => ({
                    id: n.id,
                    label: n.label,
                    provider: n.config?.provider as string | undefined,
                    model: n.config?.model as string | undefined,
                    prompt: n.config?.prompt as string | undefined,
                }));
            queueMicrotask(() => {
                setAvailableNodes(nodes);
                if (nodes.length > 0) setSelectedAgentIds(nodes.map((n) => n.id));
            });
        } catch {
            /* container not ready */
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        queueMicrotask(() => {
            refreshSessions();
            refreshCognitive();
        });
        const intTimer = setInterval(() => {
            if (isMountedRef.current) refreshCognitive();
        }, 5000);
        const unsubs = [
            eventBus.on(EVENTS.DEBATE_SESSION_CREATED, refreshSessions),
            eventBus.on(EVENTS.DEBATE_SESSION_STARTED, refreshSessions),
            eventBus.on(EVENTS.DEBATE_SESSION_COMPLETED, () => {
                refreshSessions();
                refreshCognitive();
            }),
            eventBus.on(EVENTS.DEBATE_SESSION_FAILED, () => {
                refreshSessions();
                refreshCognitive();
            }),
            eventBus.on(EVENTS.DEBATE_SESSION_CANCELLED, () => {
                setCancelling(false);
                refreshSessions();
            }),
            eventBus.on(EVENTS.DEBATE_PHASE_CHANGED, refreshSessions),
            eventBus.onSafe<{ sessionId: string; agentId: string; chunk: string }>(
                DebateRuntimeEvents.AGENT_CHUNK,
                (d) => {
                    const existing = argsRef.current.get(d.sessionId) || [];
                    // H-29: Skip chunk if AGENT_RESPONDED already fired for this agent (out-of-order delivery)
                    if (
                        existing.some(
                            (a) => a.agentId === d.agentId && !a.id.startsWith('streaming-'),
                        )
                    ) {
                        return;
                    }
                    const streamKey = `streaming-${d.agentId}`;
                    // D-H-16: Resolve real round and position from session snapshot
                    const snap = debateEngine.getSession(d.sessionId);
                    const agentNode = snap?.topology.nodes.find(
                        (n: { id: string }) => n.id === d.agentId,
                    );
                    const realAgentName = agentNode?.label ?? d.agentId;
                    const realRound = snap?.round ?? 1;
                    const realPosition = (snap?.participants?.find(
                        (p: { agentId?: string; nodeId?: string; role?: string }) =>
                            p.agentId === d.agentId || p.nodeId === d.agentId,
                    )?.role ?? 'neutral') as DebateArgument['position'];
                    const partial: DebateArgument = {
                        id: streamKey,
                        agentId: d.agentId,
                        agentName: realAgentName,
                        content: d.chunk,
                        confidence: 0.5,
                        timestamp: Date.now(),
                        round: realRound,
                        position: realPosition,
                        source: 'llm',
                    };
                    // audit2#4: deduplicate — remove previous streaming entry for this agent before appending
                    const deduped = existing.filter((a) => a.id !== streamKey);
                    const next = new Map(argsRef.current);
                    next.set(d.sessionId, [...deduped, partial]);
                    argsRef.current = next;
                    setSessionArgs(next);
                },
            ),
            eventBus.onSafe<{ sessionId: string; agentId: string; content: string }>(
                DebateRuntimeEvents.AGENT_RESPONDED,
                (d) => {
                    const existing = argsRef.current.get(d.sessionId) || [];
                    const streamKey = `streaming-${d.agentId}`;
                    const clean = existing.filter((a) => a.id !== streamKey);
                    // D-H-16: Resolve real round and position from session snapshot
                    const snap = debateEngine.getSession(d.sessionId);
                    const realRound = snap?.round ?? 1;
                    const agentNode = snap?.topology.nodes.find(
                        (n: { id: string }) => n.id === d.agentId,
                    );
                    const realAgentName = agentNode?.label ?? d.agentId;
                    const realPosition = (snap?.participants?.find(
                        (p: { agentId?: string; nodeId?: string; role?: string }) =>
                            p.agentId === d.agentId || p.nodeId === d.agentId,
                    )?.role ?? 'neutral') as DebateArgument['position'];
                    const arg: DebateArgument = {
                        id: `runtime-${Date.now()}-${clean.length}`,
                        agentId: d.agentId,
                        agentName: realAgentName,
                        content: d.content,
                        confidence: 0.7,
                        timestamp: Date.now(),
                        round: realRound,
                        position: realPosition,
                        source: 'llm',
                    };
                    const next = new Map(argsRef.current);
                    next.set(d.sessionId, [...clean, arg]);
                    argsRef.current = next;
                    setSessionArgs(next);
                },
            ),
        ];
        return () => {
            clearInterval(intTimer);
            unsubs.forEach((u) => u());
        };
    }, [refreshSessions, refreshCognitive]);

    const handleCreate = async () => {
        if (!topic.trim()) {
            setError(t('debate_runtime.error_topic_required'));
            return;
        }
        if (selectedAgentIds.length < 2) {
            setError(t('debate_runtime.error_agents_required'));
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const selected = availableNodes.filter((n) => selectedAgentIds.includes(n.id));
            const availableRoles = TOPOLOGY_ROLES[topologyType];
            const topology: DebateTopology = {
                id: `top-${Date.now()}`,
                type: topologyType,
                nodes: selected.map((n, i) => ({
                    id: n.id,
                    label: n.label,
                    role: (agentRoles[n.id] ||
                        availableRoles[i % availableRoles.length]) as TopologyNode['role'],
                    modelId: n.model,
                    provider: n.provider,
                })),
                edges:
                    topologyType === 'linear'
                        ? selected.slice(0, -1).map((n, i) => ({
                              from: n.id,
                              to: selected[i + 1]!.id,
                              type: 'sequential' as const,
                          }))
                        : topologyType === 'judge'
                          ? selected
                                .filter((n) => (agentRoles[n.id] || 'pro') !== 'judge')
                                .map((p) => ({
                                    from: p.id,
                                    to:
                                        selected.find((q) => (agentRoles[q.id] || '') === 'judge')
                                            ?.id || selected[selected.length - 1]!.id,
                                    type: 'sequential' as const,
                                }))
                          : topologyType === 'red-blue'
                            ? [
                                  {
                                      from: selected[0]!.id,
                                      to: selected[selected.length - 1]!.id,
                                      type: 'sequential' as const,
                                  },
                              ]
                            : [],
            };
            const debateParticipants = selected.map((n, i) => ({
                id: n.id,
                name: n.label,
                role: (agentRoles[n.id] ||
                    availableRoles[
                        i % availableRoles.length
                    ]) as import('../../kernel/contracts/debate-types').DebateRole,
                provider: n.provider,
                modelId: n.model,
                systemPrompt: n.prompt,
            }));
            const activeChatId = useChatStore.getState().activeSessionId;
            const session = await debateService.startTopologyDebate(
                topology,
                topic.trim(),
                debateParticipants,
                undefined,
                activeChatId || undefined,
            );
            setTopic('');
            setCreating(false);
            setSelectedId(session.id);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Debate started: ${topic}`,
                type: 'success',
            });
        } catch (e) {
            setError(String(e));
            setCreating(false);
        }
    };

    const selected = sessions.find((s) => s.id === selectedId) || null;

    useEffect(() => {
        if (!selectedId) {
            queueMicrotask(() => setLinkedChatIds([]));
            return;
        }
        let cancelled = false;
        sessionManager
            .getLinked(selectedId)
            .then((links) => {
                if (!cancelled)
                    queueMicrotask(() =>
                        setLinkedChatIds(
                            links.map((l) => (l.fromId === selectedId ? l.toId : l.fromId)),
                        ),
                    );
            })
            .catch(() => {
                if (!cancelled) queueMicrotask(() => setLinkedChatIds([]));
            });
        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    return (
        <div style={debateRuntimeRoot}>
            {(creating || cancelling) && (
                <div style={debateRuntimeOverlay}>
                    <Loader2 size={40} className="animate-spin" color="#a855f7" />
                    <div style={debateRuntimeOverlayTitle}>
                        {t(cancelling ? 'debate_runtime.cancelling' : 'debate_runtime.creating')}
                    </div>
                    <div style={debateRuntimeOverlayDesc}>
                        {t(
                            cancelling
                                ? 'debate_runtime.cancelling_desc'
                                : 'debate_runtime.creating_desc',
                        )}
                    </div>
                </div>
            )}
            <div style={flexBetween}>
                <div>
                    <h2 style={debateRuntimeTitle}>
                        <Sliders
                            size={20}
                            style={{ verticalAlign: 'middle', marginRight: 8, color: '#a855f7' }}
                        />
                        {t('debate_runtime.title')}
                    </h2>
                    <p style={debateRuntimeSubtitle}>{t('debate_runtime.subtitle')}</p>
                </div>
            </div>

            {error && (
                <div role="alert" style={errorContainer}>
                    <AlertTriangle size={16} />
                    {error}
                    <button
                        onClick={() => setError(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: '#fca5a5',
                            cursor: 'pointer',
                        }}
                    >
                        x
                    </button>
                </div>
            )}

            <div
                style={{
                    ...debateRuntimeGrid,
                    gridTemplateColumns: isMobile ? '1fr' : debateRuntimeGrid.gridTemplateColumns,
                }}
            >
                <CreateSessionForm
                    topic={topic}
                    setTopic={setTopic}
                    topologyType={topologyType}
                    setTopologyType={setTopologyType}
                    availableNodes={availableNodes}
                    selectedAgentIds={selectedAgentIds}
                    setSelectedAgentIds={setSelectedAgentIds}
                    agentRoles={agentRoles}
                    setAgentRoles={setAgentRoles}
                    creating={creating}
                    handleCreate={handleCreate}
                    t={t}
                />
                <SessionListPanel
                    sessions={sessions}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    t={t}
                />
            </div>

            {selected && (
                <div style={purpleBorderSection}>
                    <SessionDetailHeader
                        selected={selected}
                        linkedChatIds={linkedChatIds}
                        actionLoading={actionLoading}
                        onPause={() => {
                            debateEngine.pauseSession(selected.id);
                            refreshSessions();
                        }}
                        onStart={() => {
                            debateEngine.startSession(selected.id).catch((e) => {
                                console.error('[DebateRuntimePanel] startSession failed', e);
                            });
                            refreshSessions();
                        }}
                        onCancel={() => {
                            setCancelling(true);
                            debateEngine.cancelSession(selected.id);
                            refreshSessions();
                        }}
                        onChatNavigate={(chatId) => navigate(`/chat?session=${chatId}`)}
                        t={t}
                    />
                    <SessionViewTabs
                        selected={selected}
                        sessionViewTab={sessionViewTab}
                        setSessionViewTab={setSessionViewTab}
                        sessionArgs={sessionArgs}
                        thinkingAgentId={thinkingAgentId}
                        cognitiveMetrics={cognitiveMetrics}
                        cognitivePressure={cognitivePressure}
                        t={t}
                    />
                </div>
            )}

            <DiagnosticIssuesPanel issues={diagnosticIssues} />
            <div style={grid2}>
                <CognitiveMetricsCard metrics={cognitiveMetrics} />
                <CognitivePressureCard pressure={cognitivePressure} />
            </div>
            <ModuleInfo moduleKey="debate_runtime" relatedModules={['debate', 'agents']} />
        </div>
    );
};

export default DebateRuntimePanel;
