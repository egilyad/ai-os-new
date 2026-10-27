import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useActiveDebateStore } from '../../stores/activeDebateStore';
import type { GovernorState, Claim } from '../../kernel/services/debate-runtime/debate-governor/types';
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
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';

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

function buildGraphNodes(state: GovernorState): VisGraphNode[] {
    const claims = Object.values(state.graph.claims);
    if (claims.length === 0) return [];

    return claims.map((c) => {
        const color = SPEAKER_COLORS[c.role] ?? DEFAULT_COLOR;
        const statusColor = STATUS_COLORS[c.status ?? ''] ?? '#64748b';
        const shortText = c.text.length > 60 ? c.text.slice(0, 57) + '…' : c.text;

        return {
            id: c.id,
            label: `${c.speaker} [r${c.round} ${c.status ?? ''}]\n${shortText}`,
            color,
            borderColor: statusColor,
            size: 20,
            title: `${c.speaker} · ${c.role} · r${c.round} · ${c.status ?? ''}\n↑${c.supportCount} ↓${c.challengeCount}\n\n${c.text}`,
        };
    });
}

function buildGraphEdges(state: GovernorState): VisGraphEdge[] {
    const edges: VisGraphEdge[] = [];

    for (const e of state.graph.edges) {
        const color = EDGE_COLORS[e.type] ?? '#64748b';
        edges.push({
            id: `edge-${e.from}-${e.to}-${e.type}`,
            from: e.from,
            to: e.to,
            color,
            width: e.type === 'challenges' ? 2.2 : 1.2,
            title: e.type,
        });
    }

    for (const c of state.contradictions) {
        const color = c.status === 'resolved' ? '#10b981' : '#ef4444';
        edges.push({
            id: `contra-${c.id}`,
            from: c.claimA,
            to: c.claimB,
            color,
            width: 2,
            title: `conflict x${c.severity.toFixed(2)}`,
        });
    }

    return edges;
}

function computeInfluence(state: GovernorState): Map<string, { outgoing: number; incoming: number; score: number }> {
    const influence = new Map<string, { outgoing: number; incoming: number; score: number }>();
    const claims = Object.values(state.graph.claims);
    for (const c of claims) {
        if (!influence.has(c.speaker)) influence.set(c.speaker, { outgoing: 0, incoming: 0, score: 0 });
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

const ArgumentGraphPanel: React.FC = () => {
    const storeGovernorState = useActiveDebateStore((s) => s.governorState);
    const [govState, setGovState] = useState<GovernorState | null>(storeGovernorState);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [showContradictions, setShowContradictions] = useState(true);
    const [showResolved, setShowResolved] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        if (!isMountedRef.current) return;
        setGovState(storeGovernorState);
    }, [storeGovernorState]);

    useEffect(() => {
        isMountedRef.current = true;
        const handler = () => {
            if (!isMountedRef.current) return;
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
        const edges = govState.graph.edges.filter((e) => claimIds.has(e.from) && claimIds.has(e.to));
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

    const nodes = useMemo(() => {
        if (!filteredState) return [];
        return buildGraphNodes(filteredState);
    }, [filteredState]);

    const edges = useMemo(() => {
        if (!filteredState) return [];
        return buildGraphEdges(filteredState);
    }, [filteredState]);

    const onNodeClick = useCallback(
        (node: VisGraphNode) => {
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-100)' }}>
                <div style={{ ...flexBetween, ...panel, margin: '0.75rem', borderRadius: 8, background: 'var(--slate-800)' }}>
                    <span style={{ ...label }}>Argument Graph</span>
                    <span style={{ ...textMutedXs }}>
                        {govState ? 'No claims yet' : 'No active debate'}
                    </span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', ...emptyState }}>
                    <div style={{ textAlign: 'center', maxWidth: 400 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>◈</div>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-100)', position: 'relative' }}>
            <div style={{ ...flexBetween, ...panel, margin: '0.75rem 0.75rem 0', borderRadius: 8, background: 'var(--slate-800)' }}>
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
                    <Button variant="ghost" size="sm" onClick={() => setShowContradictions((v) => !v)} style={{ fontSize: 10, background: showContradictions ? 'rgba(239,68,68,0.1)' : undefined }}>
                        {showContradictions ? 'Hide' : 'Show'} conflicts
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowResolved((v) => !v)} style={{ fontSize: 10, background: showResolved ? 'rgba(16,185,129,0.1)' : undefined }}>
                        {showResolved ? 'Hide' : 'Show'} resolved
                    </Button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--slate-500)' }}>
                        convergence {Math.round(govState.convergenceScore)}%
                    </span>
                </div>
            </div>

            <div style={flex1RelativeMargin075}>
                <VisGraph nodes={nodes} edges={edges} onClickNode={onNodeClick} height={520} />
                <div
                    style={{
                        position: 'absolute',
                        bottom: 15,
                        left: 15,
                        background: 'rgba(15,23,42,0.85)',
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: 10,
                        display: 'flex',
                        gap: 10,
                        zIndex: 5,
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
                </div>
            </div>

            {showDetail && selectedClaim && (
                <div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setShowDetail(false)}
                >
                    <div style={{ ...panel, maxWidth: 560, width: '90%', background: 'var(--slate-800)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ ...flexBetween, marginBottom: 12 }}>
                            <div style={flexCenterGap8}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[selectedClaim.status ?? ''] ?? '#64748b' }} />
                                <span style={{ fontWeight: 600, color: SPEAKER_COLORS[selectedClaim.role ?? ''] ?? DEFAULT_COLOR }}>
                                    {selectedClaim.speaker}
                                </span>
                                <span style={{ ...textMutedXs }}>round {selectedClaim.round}</span>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: `${STATUS_COLORS[selectedClaim.status ?? '']}22`, color: STATUS_COLORS[selectedClaim.status ?? ''] ?? '#64748b' }}>
                                    {selectedClaim.status}
                                </span>
                            </div>
                            <button onClick={() => setShowDetail(false)} style={{ ...iconBtn, color: 'var(--slate-400)' }}>✕</button>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--slate-200)', marginBottom: 12 }}>
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
