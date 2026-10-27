import { useMemo } from 'react';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';
import { hashHue } from '../../kernel/utils/hash';

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

/**
 * KnowledgeGraphView — интерактивный граф знаний на vis-network (как в Memory
 * Center): зум, панорамирование, физика, узлы можно двигать, тултипы.
 */
export function KnowledgeGraphView({
    data,
    height = 420,
    onNodeClick,
}: {
    data: GraphViewData;
    height?: number;
    onNodeClick?: (node: GraphViewNode) => void;
}) {
    const { nodes, edges } = useMemo(() => {
        const degree = new Map<string, number>();
        const bump = (id: string) => degree.set(id, (degree.get(id) ?? 0) + 1);
        for (const e of data.edges) {
            bump(e.source);
            bump(e.target);
        }

        const visNodes: VisGraphNode[] = data.nodes.map((n) => {
            const deg = degree.get(n.id) ?? 0;
            const color = colorFor(n.type);
            return {
                id: n.id,
                label: n.label,
                color,
                size: Math.min(30, 12 + deg * 2),
                title: `${n.type ?? 'knowledge'} · связи: ${deg}\n${n.label}`,
            };
        });

        const visEdges: VisGraphEdge[] = data.edges.map((e, i) => ({
            id: `e-${i}`,
            from: e.source,
            to: e.target,
            width: Math.max(1, Math.min(3, e.weight ?? 1)),
            color: 'rgba(148, 163, 184, 0.5)',
        }));

        return { nodes: visNodes, edges: visEdges };
    }, [data]);

    return (
        <VisGraph
            nodes={nodes}
            edges={edges}
            onClickNode={(n) => {
                const meta = data.nodes.find((dn) => dn.id === n.id);
                if (meta && onNodeClick) onNodeClick(meta);
            }}
            height={height}
        />
    );
}
