import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    Panel,
    MarkerType,
    type Node,
    type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type {
    GovernorState,
    Claim,
} from '../../kernel/services/debate-runtime/debate-governor/types';
import {
    flexBetween,
    panel,
    textMuted,
    textMutedXs,
    label,
    iconBtn,
    emptyState,
    flexCenterGap8,
    flexCenterGap12,
    flex1RelativeMargin075,
} from '../../styles/common';
import { Button } from '../Common';

const SPEAKER_COLORS: Record<string, string> = {
    pro: '#3b82f6',
    con: '#ef4444',
    neutral: '#10b981',
};
const DEFAULT_COLOR = '#8b5cf6';

const STATUS_COLORS: Record<string, string> = {
    active: '#f59e0b',
    challenged: '#ef4444',
    resolved: '#10b981',
    disputed: '#8b5cf6',
};

const EDGE_COLORS: Record<string, string> = {
    supports: '#10b981',
    challenges: '#ef4444',
    refines: '#3b82f6',
};

function mapGovStateToNodes(state: GovernorState, _roundLayout: Map<number, string[]>): Node[] {
    const claims = Object.values(state.graph.claims);
    if (claims.length === 0) return [];

    const speakers = [...new Set(claims.map((c) => c.speaker))];
    const speakerIndex = new Map(speakers.map((s, i) => [s, i]));

    const nodes: Node[] = [];
    for (const c of claims) {
        const speakerPos = speakerIndex.get(c.speaker) ?? 0;
        const y = c.round * 180 + 60;
        const x = speakerPos * 320 + 60;
        const color = SPEAKER_COLORS[c.role] ?? DEFAULT_COLOR;
        const statusColor = STATUS_COLORS[c.status ?? ''] ?? '#64748b';
        const shortText = c.text.length > 100 ? c.text.slice(0, 97) + '...' : c.text;

        nodes.push({
            id: c.id,
            data: {
                label: (
                    <div style={{ maxWidth: 260, fontSize: 11, lineHeight: 1.4, color: 'var(--slate-200)' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 6,
                            }}
                        >
                            <span
                                style={{
                                    background: statusColor,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                }}
                            />
                            <span style={{ fontWeight: 600, fontSize: 10, color }}>
                                {c.speaker}
                            </span>
                            <span style={{ color: 'var(--slate-500)', fontSize: 9 }}>r{c.round}</span>
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: 9,
                                    padding: '1px 6px',
                                    borderRadius: 999,
                                    background: `${statusColor}22`,
                                    color: statusColor,
                                    border: `1px solid ${statusColor}44`,
                                }}
                            >
                                {c.status}
                            </span>
                        </div>
                        <div>{shortText}</div>
                        <div
                            style={{
                                marginTop: 4,
                                display: 'flex',
                                gap: 8,
                                fontSize: 9,
                                color: 'var(--slate-500)',
                            }}
                        >
                            <span>↑{c.supportCount}</span>
                            <span>↓{c.challengeCount}</span>
                        </div>
                    </div>
                ),
            },
            position: { x, y },
            style: {
                background: 'var(--slate-900)',
                border: `1px solid ${color}44`,
                borderRadius: 10,
                padding: '8px 12px',
                minWidth: 220,
                maxWidth: 280,
                boxShadow: `0 2px 8px ${color}11`,
            },
        });
    }

    return nodes;
}

function computeInfluence(
    state: GovernorState,
): Map<string, { outgoing: number; incoming: number; score: number }> {
    const influence = new Map<string, { outgoing: number; incoming: number; score: number }>();
    const claims = Object.values(state.graph.claims);
    for (const c of claims) {
        if (!influence.has(c.speaker))
            influence.set(c.speaker, { outgoing: 0, incoming: 0, score: 0 });
    }
    for (const e of state.graph.edges) {
        const fromClaim = claims.find((c) => c.id === e.from);
        const toClaim = claims.find((c) => c.id === e.to);
        if (fromClaim && toClaim && fromClaim.speaker !== toClaim.speaker) {
            const fromInf = influence.get(fromClaim.speaker);
            const toInf = influence.get(toClaim.speaker);
            if (fromInf) fromInf.outgoing += 1;
            if (toInf) toInf.incoming += 1;
        }
    }
    const maxOut = Math.max(1, ...Array.from(influence.values()).map((v) => v.outgoing));
    for (const [, v] of influence) v.score = v.outgoing / maxOut;
    return influence;
}

function mapGovStateToEdges(state: GovernorState): Edge[] {
    const edges: Edge[] = [];

    for (const e of state.graph.edges) {
        const color = EDGE_COLORS[e.type] ?? '#64748b';
        edges.push({
            id: `edge-${e.from}-${e.to}-${e.type}`,
            source: e.from,
            target: e.to,
            label: e.type,
            animated: e.type === 'challenges',
            style: {
                stroke: color,
                strokeWidth: e.type === 'challenges' ? 2 : 1,
                strokeDasharray: e.type === 'refines' ? '4 2' : undefined,
            },
            labelStyle: { fill: color, fontSize: 9, fontWeight: 600 },
            labelBgStyle: { fill: 'var(--slate-900)', stroke: `${color}33`, strokeWidth: 1 },
            labelBgPadding: [3, 3],
            labelBgBorderRadius: 4,
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 12, height: 12 },
        });
    }

    return edges;
}

function buildRoundLayout(claims: Claim[]): Map<number, string[]> {
    const byRound = new Map<number, string[]>();
    for (const c of claims) {
        const list = byRound.get(c.round) ?? [];
        if (!list.includes(c.speaker)) list.push(c.speaker);
        byRound.set(c.round, list);
    }
    return byRound;
}

const ArgumentGraphPanel: React.FC = () => {
    // Source of truth: useActiveDebateStore.governorState (Zustand).
    // debateService.getDebateGovernorState() returned a stale `this._governorState`
    // that was never written — fixes Argument Graph always empty.
    const storeGovernorState = useActiveDebateStore((s) => s.governorState);
    const [govState, setGovState] = useState<GovernorState | null>(storeGovernorState);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [showContradictions, setShowContradictions] = useState(true);
    const [showResolved, setShowResolved] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [influenceMode, setInfluenceMode] = useState(false);
    const isMountedRef = useRef(true);

    // Sync local state when Zustand state changes
    useEffect(() => {
        if (!isMountedRef.current) return;
        setGovState(storeGovernorState);
    }, [storeGovernorState]);

    useEffect(() => {
        isMountedRef.current = true;

        const handler = () => {
            if (!isMountedRef.current) return;
            // Re-read from store (may have updated during async events)
            setGovState(useActiveDebateStore.getState().governorState);
        };

        const unsubs = [
            eventBus.on(EVENTS.DEBATE_UPDATED, handler),
            eventBus.on(EVENTS.DEBATE_ARGUMENT, handler),
            eventBus.on(EVENTS.DEBATE_CONSENSUS, handler),
            eventBus.on(EVENTS.DEBATE_STARTED, handler),
        ];

        return () => {
            isMountedRef.current = false;
            unsubs.forEach((u) => u());
        };
    }, []);

    const filteredState = useMemo(() => {
        if (!govState) return null;
        if (showResolved) return govState;

        const claims = Object.values(govState.graph.claims).filter((c) => c.status !== 'resolved');
        const claimIds = new Set(claims.map((c) => c.id));
        const edges = govState.graph.edges.filter(
            (e) => claimIds.has(e.from) && claimIds.has(e.to),
        );
        const contradictions = showContradictions ? govState.contradictions : [];

        return {
            ...govState,
            graph: { claims: Object.fromEntries(claims.map((c) => [c.id, c])), edges },
            contradictions,
        };
    }, [govState, showResolved, showContradictions]);

    const influence = useMemo(() => {
        if (!filteredState) return new Map();
        return computeInfluence(filteredState);
    }, [filteredState]);

    const speakerRoleMap = useMemo(() => {
        if (!filteredState) return new Map<string, string>();
        const map = new Map<string, string>();
        for (const c of Object.values(filteredState.graph.claims)) {
            if (!map.has(c.speaker)) map.set(c.speaker, c.role);
        }
        return map;
    }, [filteredState]);

    const roundLayout = useMemo(() => {
        if (!filteredState) return new Map();
        return buildRoundLayout(Object.values(filteredState.graph.claims));
    }, [filteredState]);

    const nodes = useMemo(() => {
        if (!filteredState) return [];
        const base = mapGovStateToNodes(filteredState, roundLayout);
        if (!influenceMode) return base;
        const claims = Object.values(filteredState.graph.claims);
        return base.map((n) => {
            const c = claims.find((cl) => cl.id === n.id);
            if (!c) return n;
            const inf = influence.get(c.speaker);
            const scale = inf ? 0.5 + inf.score * 1.5 : 1;
            return {
                ...n,
                style: {
                    ...(n.style as Record<string, unknown>),
                    transform: `scale(${scale})`,
                } as Record<string, unknown>,
            } as Node;
        });
    }, [filteredState, roundLayout, influenceMode, influence]);

    const edges = useMemo(() => {
        if (!filteredState) return [];
        const claimEdges = mapGovStateToEdges(filteredState);

        const contradictionEdges: Edge[] = [];
        if (showContradictions) {
            for (const c of filteredState.contradictions) {
                const color = c.status === 'resolved' ? '#10b981' : '#ef4444';
                contradictionEdges.push({
                    id: `contra-${c.id}`,
                    source: c.claimA,
                    target: c.claimB,
                    label: `x${c.severity.toFixed(2)}`,
                    animated: c.status === 'open',
                    style: { stroke: color, strokeWidth: 2, strokeDasharray: '6 3' },
                    labelStyle: { fill: color, fontSize: 8 },
                    labelBgStyle: { fill: 'var(--slate-900)' },
                    labelBgPadding: [2, 2],
                    labelBgBorderRadius: 4,
                    markerEnd: { type: MarkerType.ArrowClosed, color },
                });
            }
        }

        const influenceEdges = influenceMode
            ? claimEdges.map((e) => {
                  const orig = filteredState?.graph.edges.find(
                      (ce) => `edge-${ce.from}-${ce.to}-${ce.type}` === e.id,
                  );
                  const w = orig?.weight ?? 1;
                  return {
                      ...e,
                      style: { ...e.style, strokeWidth: Math.max(1, w * 4) } as React.CSSProperties,
                  };
              })
            : claimEdges;

        return [...influenceEdges, ...contradictionEdges];
    }, [filteredState, showContradictions, influenceMode]);

    const onNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (!govState) return;
            const claim = Object.values(govState.graph.claims).find((c) => c.id === node.id);
            if (claim) {
                setSelectedClaim(claim);
                setShowDetail(true);
            }
        },
        [govState],
    );

    if (!govState || Object.keys(govState.graph.claims).length === 0) {
        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: 'var(--slate-900)',
                    color: 'var(--slate-100)',
                }}
            >
                <div
                    style={{
                        ...flexBetween,
                        ...panel,
                        margin: '0.75rem',
                        borderRadius: 8,
                        background: 'var(--slate-800)',
                    }}
                >
                    <span style={{ ...label }}>Argument Graph</span>
                    <span style={{ ...textMutedXs }}>
                        {govState ? 'No claims yet' : 'No active debate'}
                    </span>
                </div>
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...emptyState,
                    }}
                >
                    <div style={{ textAlign: 'center', maxWidth: 400 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>
                            ◈
                        </div>
                        <div style={{ ...textMuted }}>
                            No debate claims to visualize. Start a debate in the Debate Panel first.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const allClaims = Object.values(govState.graph.claims);
    const proCount = allClaims.filter((c) => c.role === 'pro').length;
    const conCount = allClaims.filter((c) => c.role === 'con').length;
    const neutralCount = allClaims.filter((c) => c.role === 'neutral').length;

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'var(--slate-900)',
                color: 'var(--slate-100)',
                position: 'relative',
            }}
        >
            {/* Top bar */}
            <div
                style={{
                    ...flexBetween,
                    ...panel,
                    margin: '0.75rem 0.75rem 0',
                    borderRadius: 8,
                    background: 'var(--slate-800)',
                }}
            >
                <div style={flexCenterGap12}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>◈ Argument Graph</span>
                    <span style={{ ...textMutedXs }}>
                        Round {govState.round} · {allClaims.length} claims
                    </span>
                    <div style={{ display: 'flex', gap: 4, fontSize: 10 }}>
                        {proCount > 0 && <span style={{ color: 'var(--accent)' }}>pro {proCount}</span>}
                        {conCount > 0 && <span style={{ color: 'var(--error)' }}>con {conCount}</span>}
                        {neutralCount > 0 && (
                            <span style={{ color: 'var(--success)' }}>neutral {neutralCount}</span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowContradictions((v) => !v)}
                        style={{
                            fontSize: 10,
                            background: showContradictions ? 'rgba(239,68,68,0.1)' : undefined,
                        }}
                    >
                        {showContradictions ? 'Hide' : 'Show'} conflicts
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResolved((v) => !v)}
                        style={{
                            fontSize: 10,
                            background: showResolved ? 'rgba(16,185,129,0.1)' : undefined,
                        }}
                    >
                        {showResolved ? 'Hide' : 'Show'} resolved
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInfluenceMode((v) => !v)}
                        style={{
                            fontSize: 10,
                            background: influenceMode ? 'rgba(139,92,246,0.1)' : undefined,
                            color: influenceMode ? '#a78bfa' : undefined,
                        }}
                    >
                        {influenceMode ? '◈' : '○'} Influence
                    </Button>
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            color: 'var(--slate-500)',
                        }}
                    >
                        convergence {Math.round(govState.convergenceScore)}%
                    </span>
                </div>
                {influenceMode && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            fontSize: 10,
                            color: 'var(--slate-500)',
                            alignItems: 'center',
                        }}
                    >
                        {Array.from(influence.entries()).map(([speaker, inf]) => (
                            <span
                                key={speaker}
                                style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background:
                                            SPEAKER_COLORS[speakerRoleMap.get(speaker) ?? ''] ??
                                            DEFAULT_COLOR,
                                    }}
                                />
                                {speaker}
                                <span style={{ color: 'var(--success)' }}>↑{inf.outgoing}</span>
                                <span style={{ color: 'var(--error)' }}>↓{inf.incoming}</span>
                                <span style={{ color: 'var(--purple-muted)', fontWeight: 600 }}>
                                    {(inf.score * 100).toFixed(0)}%
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Graph canvas */}
            <div style={flex1RelativeMargin075}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodeClick={onNodeClick}
                    fitView
                    minZoom={0.3}
                    maxZoom={2.5}
                    attributionPosition="bottom-right"
                >
                    <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
                    <Controls
                        style={{
                            background: 'rgba(15,23,42,0.8)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: 4,
                            fill: '#fff',
                        }}
                    />
                    <Panel
                        position="bottom-left"
                        style={{
                            background: 'rgba(15,23,42,0.85)',
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: 10,
                            display: 'flex',
                            gap: 10,
                        }}
                    >
                        <span style={{ color: 'var(--accent)' }}>● pro</span>
                        <span style={{ color: 'var(--error)' }}>● con</span>
                        <span style={{ color: 'var(--success)' }}>● neutral</span>
                        <span style={{ color: 'var(--slate-500)' }}>|</span>
                        <span style={{ color: 'var(--success)' }}>━ supports</span>
                        <span style={{ color: 'var(--error)' }}>━ challenges</span>
                        <span style={{ color: 'var(--accent)' }}>┅ refines</span>
                        <span style={{ color: 'var(--error)' }}>╌ contradiction</span>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Detail modal */}
            {showDetail && selectedClaim && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                    }}
                    onClick={() => setShowDetail(false)}
                >
                    <div
                        style={{ ...panel, maxWidth: 560, width: '90%', background: 'var(--slate-800)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ ...flexBetween, marginBottom: 12 }}>
                            <div style={flexCenterGap8}>
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background:
                                            STATUS_COLORS[selectedClaim.status ?? ''] ?? '#64748b',
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color:
                                            SPEAKER_COLORS[selectedClaim.role ?? ''] ??
                                            DEFAULT_COLOR,
                                    }}
                                >
                                    {selectedClaim.speaker}
                                </span>
                                <span style={{ ...textMutedXs }}>round {selectedClaim.round}</span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        padding: '1px 6px',
                                        borderRadius: 999,
                                        background: `${STATUS_COLORS[selectedClaim.status ?? '']}22`,
                                        color:
                                            STATUS_COLORS[selectedClaim.status ?? ''] ?? '#64748b',
                                    }}
                                >
                                    {selectedClaim.status}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowDetail(false)}
                                style={{ ...iconBtn, color: 'var(--slate-400)' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                lineHeight: 1.6,
                                color: 'var(--slate-200)',
                                marginBottom: 12,
                            }}
                        >
                            {selectedClaim.text}
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--slate-500)' }}>
                            <span>supports {selectedClaim.supportCount}</span>
                            <span>challenges {selectedClaim.challengeCount}</span>
                            <span>ID: {selectedClaim.id}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArgumentGraphPanel;
