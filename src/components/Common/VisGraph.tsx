import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';

export interface VisGraphNode {
    id: string;
    label: string;
    type?: string;
    color?: string;
    size?: number;
    title?: string;
    openTarget?: string;
    [key: string]: unknown;
}

export interface VisGraphEdge {
    id: string;
    from: string;
    to: string;
    color?: string;
    width?: number;
    title?: string;
}

interface Props {
    nodes: VisGraphNode[];
    edges: VisGraphEdge[];
    onClickNode: (node: VisGraphNode) => void;
    height?: number;
    physics?: boolean;
    hierarchical?: boolean;
}

/** Универсальный интерактивный граф на vis-network: зум, панорамирование,
 *  тултипы и клик по узлам. */
const VisGraph: React.FC<Props> = ({
    nodes,
    edges,
    onClickNode,
    height = 420,
    physics = true,
    hierarchical = false,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const netRef = useRef<Network | null>(null);
    const onClickNodeRef = useRef(onClickNode);
    onClickNodeRef.current = onClickNode;

    useEffect(() => {
        if (!containerRef.current) return;

        const netNodes = nodes.map((n) => ({
            id: n.id,
            label: n.label,
            title: n.title ?? n.label,
            shape: 'dot' as const,
            size: n.size ?? 14,
            color: { background: n.color ?? '#8b5cf6', border: '#0f172a', highlight: { background: n.color ?? '#8b5cf6', border: '#fff' } },
            font: { color: '#cbd5e1', size: 12 },
            borderWidth: 2,
            shadow: true,
        }));

        const netEdges = edges.map((e) => ({
            id: e.id,
            from: e.from,
            to: e.to,
            color: { color: e.color ?? '#64748b', opacity: 0.5 },
            width: e.width ?? 1.2,
            title: e.title,
            smooth: { enabled: true, type: 'continuous' as const, roundness: 0.35 },
        }));

        const net = new Network(
            containerRef.current,
            { nodes: netNodes, edges: netEdges },
            {
                nodes: { chosen: true },
                edges: { arrowStrikethrough: false },
                layout: { hierarchical: { enabled: hierarchical } },
                physics: physics
                    ? { stabilization: { iterations: 200 }, barnesHut: { gravitationalConstant: -3500, centralGravity: 0.25, springLength: 160, springConstant: 0.04, damping: 0.09 } }
                    : { enabled: false },
                interaction: { hover: true, tooltipDelay: 150, dragView: true, zoomView: true },
            },
        );

        netRef.current = net;
        net.on('click', (params: any) => {
            if (params.nodes && params.nodes.length > 0) {
                const node = nodes.find((n) => n.id === params.nodes[0]);
                if (node) onClickNodeRef.current(node);
            }
        });

        return () => {
            net.destroy();
            netRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, hierarchical, physics]);

    return <div ref={containerRef} style={{ width: '100%', height, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,0,0,0.2)' }} />;
};

export default VisGraph;
