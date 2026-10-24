import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import 'vis-network/styles/vis-network.css';
import { stableHash } from '../../kernel/utils/hash';

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

function buildOptions() {
    const groups: Record<string, { color: { background: string; border: string; highlight: { background: string; border: string } } }> = {};
    for (const type of Object.keys(NODE_COLORS)) {
        const background = NODE_COLORS[type]!;
        groups[type] = {
            color: {
                background,
                border: '#0f172a',
                highlight: { background, border: '#ffffff' },
            },
        };
    }
    return {
        autoResize: true,
        nodes: {
            shape: 'dot' as const,
            borderWidth: 1,
            font: { color: '#cbd5e1', size: 12 },
            shadow: { enabled: true, color: 'rgba(0,0,0,0.45)', size: 12, x: 0, y: 0 },
        },
        edges: {
            color: { color: 'rgba(148,163,184,0.35)', highlight: '#22d3ee' },
            width: 1,
            selectionWidth: 2,
        },
        groups,
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -3000,
                centralGravity: 0.3,
                springLength: 120,
                springConstant: 0.04,
                damping: 0.09,
            },
        },
        interaction: { hover: true, tooltipDelay: 80 },
    };
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function KnowledgeGraphView({
    data,
    height = 420,
}: {
    data: GraphViewData;
    height?: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const nodes = data.nodes.map((node) => {
            const angle = 2 * Math.PI * stableHash(node.id);
            const radius = 110 + stableHash(`${node.id}:r`) * 200;
            const degree = node.degree ?? 0;
            const type = node.type ?? 'knowledge';
            return {
                id: node.id,
                label: node.label,
                group: type,
                value: Math.max(1, degree),
                size: 10 + Math.min(22, degree * 2),
                title: `${type} · links: ${degree}<br/>${escapeHtml(node.label)}`,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
            };
        });
        const edges = data.edges.map((edge, index) => ({
            from: edge.source,
            to: edge.target,
            title: edge.kind,
            width: Math.max(0.5, edge.weight ?? 1),
            smooth: {
                enabled: true,
                type: 'continuous' as const,
                roundness: 0.1 + stableHash(`${edge.source}|${edge.target}|${index}`) * 0.5,
            },
        }));

        const network = new Network(container, { nodes, edges }, buildOptions());
        return () => network.destroy();
    }, [data]);

    return <div ref={containerRef} style={{ height, width: '100%' }} />;
}
