import { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    MarkerType,
} from '@xyflow/react';
import type { Edge, Node, NodeProps, EdgeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { stableHash, hashHue } from '../../kernel/utils/hash';

export interface GraphViewNode {
    id: string;
    label: string;
    type?: string;
    degree?: number;
    meta?: unknown;
}

export interface GraphViewEdge {
    source: string;
    target: string;
    kind?: string;
    weight?: number;
}

export interface GraphViewData {
    nodes: GraphViewNode[];
    edges: GraphViewEdge[];
}

type KnowledgeNodeData = { label: string; type?: string; degree?: number };
type KnowledgeNodeType = Node<KnowledgeNodeData>;

const NODE_COLORS: Record<string, string> = {
    user: '#22d3ee',
    fact: '#facc15',
    observation: '#a78bfa',
    note: '#c084fc',
    diary: '#4ade80',
    doc: '#60a5fa',
    task: '#f472b6',
    skill: '#e879f9',
    entity: '#fb923c',
    tag: '#94a3b8',
    knowledge: '#34d399',
    memory: '#2dd4bf',
    debate: '#f472b6',
    economics: '#facc15',
    tools: '#fb923c',
    agents: '#a78bfa',
    llm: '#60a5fa',
    core: '#e879f9',
    service: '#94a3b8',
};

function colorFor(type?: string): string {
    if (type && NODE_COLORS[type]) return NODE_COLORS[type]!;
    return `hsl(${hashHue(type ?? 'unknown')}, 72%, 55%)`;
}

function nodeDiameter(degree: number): number {
    return Math.min(64, 20 + degree * 2);
}

function KnowledgeNode({ data }: NodeProps<KnowledgeNodeType>) {
    const degree = data.degree ?? 0;
    const d = nodeDiameter(degree);
    const bg = colorFor(data.type);
    return (
        <div
            title={`${data.type ?? ''} · links: ${degree}\n${data.label}`}
            style={{
                width: d,
                height: d,
                borderRadius: '50%',
                background: bg,
                border: '2px solid rgba(255, 255, 255, 0.35)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
            <span
                style={{
                    fontSize: Math.max(8, d / 5),
                    color: '#0f172a',
                    fontWeight: 700,
                    textAlign: 'center',
                    lineHeight: 1.05,
                    padding: 2,
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                }}
            >
                {data.label}
            </span>
        </div>
    );
}

function CurvyEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerEnd,
}: EdgeProps) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(80, len * 0.18);
    const mx = (sourceX + targetX) / 2 + (-dy / len) * bend;
    const my = (sourceY + targetY) / 2 + (dx / len) * bend;
    const path = `M ${sourceX},${sourceY} Q ${mx},${my} ${targetX},${targetY}`;
    return <path d={path} fill="none" style={style} markerEnd={markerEnd} />;
}

const nodeTypes = { knowledge: KnowledgeNode };
const edgeTypes = { curvy: CurvyEdge };

function computeLayout(
    nodes: GraphViewNode[],
    _edges: GraphViewEdge[],
    _degree: Map<string, number>,
): Map<string, { x: number; y: number }> {
    const groups = new Map<string, string[]>();
    for (const n of nodes) {
        const type = n.type ?? 'knowledge';
        const list = groups.get(type) ?? [];
        list.push(n.id);
        groups.set(type, list);
    }

    const types = [...groups.keys()].sort();
    const nTypes = types.length || 1;
    const outerR = 340;
    const pos = new Map<string, { x: number; y: number }>();

    types.forEach((type, ti) => {
        const ids = groups.get(type)!;
        const centerAngle = (ti / nTypes) * 2 * Math.PI;
        const cx = Math.cos(centerAngle) * outerR;
        const cy = Math.sin(centerAngle) * outerR;
        const innerR = 44 + ids.length * 6;
        ids.forEach((id, k) => {
            const a = (k / ids.length) * 2 * Math.PI + stableHash(id) * 0.4;
            pos.set(id, { x: cx + Math.cos(a) * innerR, y: cy + Math.sin(a) * innerR });
        });
    });

    const unplaced = nodes.filter((n) => !pos.has(n.id));
    unplaced.forEach((n, i) => {
        pos.set(n.id, { x: (i % 20) * 60, y: Math.floor(i / 20) * 60 });
    });

    return pos;
}

function buildNodesEdges(data: GraphViewData): { nodes: KnowledgeNodeType[]; edges: Edge[] } {
    const degree = new Map<string, number>();
    const bump = (id: string) => degree.set(id, (degree.get(id) ?? 0) + 1);
    for (const e of data.edges) {
        bump(e.source);
        bump(e.target);
    }

    const positions = computeLayout(data.nodes, data.edges, degree);

    const nodes: KnowledgeNodeType[] = data.nodes.map((n) => {
        const p = positions.get(n.id) ?? { x: 0, y: 0 };
        return {
            id: n.id,
            type: 'knowledge',
            position: p,
            data: {
                label: n.label,
                type: n.type ?? 'knowledge',
                degree: degree.get(n.id) ?? 0,
            },
        };
    });

    const edges: Edge[] = data.edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        type: 'curvy',
        style: {
            stroke: 'rgba(148, 163, 184, 0.5)',
            strokeWidth: Math.max(1, Math.min(3, e.weight ?? 1)),
        },
    }));

    return { nodes, edges };
}

export function KnowledgeGraphView({
    data,
    height = 420,
}: {
    data: GraphViewData;
    height?: number;
}) {
    const { nodes, edges } = useMemo(() => buildNodesEdges(data), [data]);

    return (
        <div style={{ height, width: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.08}
                maxZoom={2.5}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    type: 'curvy',
                    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
                }}
            >
                <Background color="rgba(148, 163, 184, 0.14)" gap={24} />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
