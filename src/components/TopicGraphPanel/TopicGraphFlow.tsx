import React, { useCallback, useMemo, useState } from 'react';
import {
    Background,
    Controls,
    Handle,
    MiniMap,
    Position,
    ReactFlow,
    useEdgesState,
    useNodesState,
    type Edge,
    type Node,
    type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
    TopicClaim,
    TopicConcept,
    TopicRelation,
    TopicSource,
    TopicRelationType,
} from '../../kernel/contracts/topic-graph/types';
import { relationStyle, RELATION_STYLES } from './relation-styles';

type FlowNodeData = {
    label: string;
    kind: 'concept' | 'claim';
    claimIds?: number;
};

type FlowNode = Node<FlowNodeData, 'flow'>;

type TopicGraphFlowProps = {
    concepts: TopicConcept[];
    claims: TopicClaim[];
    relations: TopicRelation[];
    sources: TopicSource[];
    height?: number;
};

const CONCEPT_COLOR = '#2dd4bf';
const CLAIM_COLOR = '#3b82f6';
const CONFLICT_COLOR = '#f87171';
const DEFAULT_REL_COLOR = 'var(--slate-500)';

function FlowNode({ data }: NodeProps<FlowNode>) {
    const isConcept = data.kind === 'concept';
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minWidth: isConcept ? 68 : 130,
                maxWidth: 190,
                minHeight: isConcept ? 68 : 42,
                borderRadius: isConcept ? '50%' : 10,
                padding: isConcept ? 0 : '6px 10px',
                background: isConcept ? 'rgba(45,212,191,0.14)' : 'rgba(59,130,246,0.14)',
                border: `1.5px solid ${isConcept ? CONCEPT_COLOR : CLAIM_COLOR}`,
                color: 'var(--slate-100)',
                fontSize: isConcept ? 13 : 11,
                fontWeight: isConcept ? 700 : 500,
                boxShadow: '0 2px 14px rgba(0,0,0,0.35)',
                lineHeight: 1.2,
            }}
        >
            <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
            <div>{data.label}</div>
            <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
        </div>
    );
}

const nodeTypes = { flow: FlowNode };

function buildLayout(
    concepts: TopicConcept[],
    claims: TopicClaim[],
    relations: TopicRelation[],
    maxConcepts: number,
    maxClaims: number,
    showConflicts: boolean,
): { nodes: FlowNode[]; edges: Edge[] } {
    const conceptNodes = concepts.slice(0, maxConcepts).map((c) => ({
        id: c.id,
        type: 'flow' as const,
        data: { label: c.name, kind: 'concept' as const, claimIds: c.claimIds.length },
        position: { x: 0, y: 0 },
        origin: [0.5, 0.5] as [number, number],
    }));
    const claimNodes = claims.slice(0, maxClaims).map((c) => ({
        id: c.id,
        type: 'flow' as const,
        data: {
            label: c.text.length > 70 ? c.text.slice(0, 70) + '…' : c.text,
            kind: 'claim' as const,
        },
        position: { x: 0, y: 0 },
        origin: [0.5, 0.5] as [number, number],
    }));

    const nodes: FlowNode[] = [...conceptNodes, ...claimNodes];
    const ids = new Set(nodes.map((n) => n.id));

    // Круговая раскладка: концепты на внешнем кольце, claims — на внутреннем.
    const W = 1200;
    const H = 700;
    const outerR = Math.min(W, H) / 2 - 90;
    const innerR = Math.min(W, H) / 2 - 220;
    const cx = W / 2;
    const cy = H / 2;
    conceptNodes.forEach((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(1, conceptNodes.length) - Math.PI / 2;
        n.position = { x: cx + outerR * Math.cos(a), y: cy + outerR * Math.sin(a) };
    });
    claimNodes.forEach((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(1, claimNodes.length) - Math.PI / 2;
        n.position = { x: cx + innerR * Math.cos(a), y: cy + innerR * Math.sin(a) };
    });

    const edges: Edge[] = [];
    const seen = new Set<string>();
    for (const r of relations) {
        if (!ids.has(r.fromId) || !ids.has(r.toId)) continue;
        if (r.relation === 'contradicts' && !showConflicts) continue;
        const key = r.fromId < r.toId ? `${r.fromId}|${r.toId}` : `${r.toId}|${r.fromId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const isConflict = r.relation === 'contradicts';
        const vstyle = relationStyle(r.relation);
        edges.push({
            id: r.id,
            source: r.fromId,
            target: r.toId,
            animated: isConflict,
            label: vstyle.label,
            style: {
                stroke: isConflict ? CONFLICT_COLOR : (vstyle.color ?? DEFAULT_REL_COLOR),
                strokeWidth: isConflict ? 2 : 0.7 + r.weight,
                strokeDasharray: vstyle.dasharray,
                opacity: 0.7,
            },
            type: 'smoothstep',
        });
    }
    return { nodes, edges };
}

export default function TopicGraphFlow(props: TopicGraphFlowProps) {
    const { concepts, claims, relations, sources, height = 560 } = props;
    const [maxConcepts, setMaxConcepts] = useState(14);
    const [maxClaims, setMaxClaims] = useState(30);
    const [showConflicts, setShowConflicts] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [relationFilter, setRelationFilter] = useState<TopicRelationType | 'all'>('all');
    const [minWeight, setMinWeight] = useState(0);

    const filteredRelations = useMemo(
        () =>
            relations.filter(
                (r) =>
                    (relationFilter === 'all' || r.relation === relationFilter) &&
                    r.weight >= minWeight,
            ),
        [relations, relationFilter, minWeight],
    );

    const { nodes: builtNodes, edges: builtEdges } = useMemo(
        () =>
            buildLayout(concepts, claims, filteredRelations, maxConcepts, maxClaims, showConflicts),
        [concepts, claims, filteredRelations, maxConcepts, maxClaims, showConflicts],
    );
    const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(builtEdges);

    React.useEffect(() => {
        setNodes(builtNodes);
        setEdges(builtEdges);
    }, [builtNodes, builtEdges, setNodes, setEdges]);

    const applyHover = useCallback(
        (id: string | null) => {
            if (!id) {
                setEdges((prev) =>
                    prev.map((e) => ({ ...e, style: { ...e.style, opacity: 0.7 } })),
                );
                setNodes((prev) => prev.map((n) => ({ ...n, style: { opacity: 1 } })));
                return;
            }
            const neighbors = new Set<string>([id]);
            for (const e of builtEdges) {
                if (e.source === id) neighbors.add(e.target);
                if (e.target === id) neighbors.add(e.source);
            }
            setNodes((prev) =>
                prev.map((n) => ({
                    ...n,
                    style: { opacity: neighbors.has(n.id) ? 1 : 0.25, transition: 'opacity 150ms' },
                })),
            );
            setEdges((prev) =>
                prev.map((e) => ({
                    ...e,
                    style: {
                        ...e.style,
                        opacity: e.source === id || e.target === id ? 1 : 0.12,
                    },
                })),
            );
        },
        [builtEdges, setEdges, setNodes],
    );

    const selected = useMemo(() => {
        if (!selectedId) return null;
        const concept = concepts.find((c) => c.id === selectedId);
        if (concept) {
            return {
                kind: 'concept' as const,
                title: concept.name,
                lines: [
                    `Утверждений: ${concept.claimIds.length}`,
                    `Алиасы: ${concept.aliases.length ? concept.aliases.join(', ') : '—'}`,
                ],
            };
        }
        const claim = claims.find((c) => c.id === selectedId);
        if (claim) {
            const sourceTitles = claim.sourceIds
                .map((sid) => sources.find((s) => s.id === sid))
                .filter((s): s is TopicSource => Boolean(s))
                .map((s) => s.title);
            return {
                kind: 'claim' as const,
                title: claim.text,
                lines: [
                    `conf: ${claim.confidence.toFixed(2)} · статус: ${claim.status}`,
                    `Источники: ${sourceTitles.length ? sourceTitles.join('; ') : claim.sourceIds.join(', ')}`,
                ],
            };
        }
        return null;
    }, [selectedId, concepts, claims, sources]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    fontSize: 12,
                }}
            >
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    Концепты
                    <input
                        type="range"
                        min={4}
                        max={30}
                        value={maxConcepts}
                        onChange={(e) => setMaxConcepts(Number(e.target.value))}
                    />
                    {maxConcepts}
                </label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    Утверждения
                    <input
                        type="range"
                        min={5}
                        max={80}
                        value={maxClaims}
                        onChange={(e) => setMaxClaims(Number(e.target.value))}
                    />
                    {maxClaims}
                </label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={showConflicts}
                        onChange={(e) => setShowConflicts(e.target.checked)}
                    />
                    Конфликты
                </label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    Тип связи
                    <select
                        value={relationFilter}
                        onChange={(e) =>
                            setRelationFilter(e.target.value as TopicRelationType | 'all')
                        }
                        style={{
                            padding: '2px 6px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elevated)',
                            color: 'var(--slate-300)',
                        }}
                    >
                        <option value="all">все</option>
                        {Object.entries(RELATION_STYLES).map(([kind, style]) => (
                            <option key={kind} value={kind}>
                                {style.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    Мин. вес
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={minWeight}
                        onChange={(e) => setMinWeight(Number(e.target.value))}
                    />
                    {minWeight.toFixed(1)}
                </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <div
                    style={{
                        flex: 1,
                        height,
                        background: 'var(--bg-elevated)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                    }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        minZoom={0.15}
                        maxZoom={2.5}
                        nodesDraggable
                        zoomOnScroll
                        panOnDrag
                        onNodeClick={(_, n) => setSelectedId(n.id)}
                        onNodeMouseEnter={(_, n) => applyHover(n.id)}
                        onNodeMouseLeave={() => applyHover(null)}
                        onPaneClick={() => {
                            setSelectedId(null);
                            applyHover(null);
                        }}
                    >
                        <Background gap={18} size={1.2} color="var(--slate-800)" />
                        <Controls showInteractive={false} />
                        <MiniMap
                            nodeColor={(n) =>
                                n.data.kind === 'concept' ? CONCEPT_COLOR : CLAIM_COLOR
                            }
                            maskColor="rgba(11,18,32,0.7)"
                            style={{ width: 160, height: 110 }}
                        />
                    </ReactFlow>
                </div>

                {selected && (
                    <div
                        style={{
                            width: 260,
                            flexShrink: 0,
                            background: 'var(--bg-elevated)',
                            borderRadius: 12,
                            border: '1px solid var(--border)',
                            padding: 12,
                            fontSize: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            maxHeight: height,
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: selected.kind === 'concept' ? CONCEPT_COLOR : CLAIM_COLOR,
                            }}
                        >
                            {selected.kind === 'concept' ? 'Концепт' : 'Утверждение'}
                        </div>
                        <div style={{ color: 'var(--slate-100)', wordBreak: 'break-word' }}>
                            {selected.title}
                        </div>
                        {selected.lines.map((l, i) => (
                            <div key={i} style={{ color: 'var(--slate-400)' }}>
                                {l}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
