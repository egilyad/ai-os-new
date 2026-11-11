import React, { useEffect, useMemo, useRef } from 'react';
import { Network } from 'vis-network/standalone';

export interface VisGraphNode {
    id: string;
    label: string;
    type?: string;
    color?: string;
    borderColor?: string;
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

    // P1-17: пред-вычисленные наборы и индекс узлов — сеть пересоздаётся
    // только при смене опций, данные обновляются через setData (без destroy).
    const netNodes = useMemo(
        () =>
            nodes.map((n) => ({
                id: n.id,
                label: n.label,
                title: n.title ?? n.label,
                shape: 'dot' as const,
                size: n.size ?? 14,
                color: {
                    background: n.color ?? '#8b5cf6',
                    border: n.borderColor ?? '#0f172a',
                    highlight: { background: n.color ?? '#8b5cf6', border: '#fff' },
                },
                font: { color: 'var(--slate-300)', size: 12 },
                borderWidth: n.borderColor ? 3 : 2,
                shadow: true,
            })),
        [nodes],
    );

    const netEdges = useMemo(
        () =>
            edges.map((e) => ({
                id: e.id,
                from: e.from,
                to: e.to,
                color: { color: e.color ?? '#64748b', opacity: 0.5 },
                width: e.width ?? 1.2,
                title: e.title,
                smooth: { enabled: true, type: 'continuous' as const, roundness: 0.35 },
            })),
        [edges],
    );

    const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n] as const)), [nodes]);

    const nodeByIdRef = useRef(nodeById);
    nodeByIdRef.current = nodeById;
    const dataRef = useRef({ nodes: netNodes, edges: netEdges });
    dataRef.current = { nodes: netNodes, edges: netEdges };

    useEffect(() => {
        if (!containerRef.current) return;
        const net = new Network(
            containerRef.current,
            { nodes: [], edges: [] },
            {
                nodes: { chosen: true },
                edges: { arrowStrikethrough: false },
                layout: { hierarchical: { enabled: hierarchical } },
                physics: physics
                    ? {
                          stabilization: { iterations: 200 },
                          barnesHut: {
                              gravitationalConstant: -3500,
                              centralGravity: 0.25,
                              springLength: 160,
                              springConstant: 0.04,
                              damping: 0.09,
                          },
                      }
                    : { enabled: false },
                interaction: { hover: true, tooltipDelay: 150, dragView: true, zoomView: true },
            },
        );

        netRef.current = net;
        net.setData(dataRef.current);
        net.on('click', (params: { nodes?: string[] }) => {
            const nodeIds = params.nodes;
            if (nodeIds && nodeIds.length > 0) {
                const node = nodeByIdRef.current.get(nodeIds[0]!);
                if (node) onClickNodeRef.current(node);
            }
        });

        return () => {
            net.destroy();
            netRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hierarchical, physics]);

    useEffect(() => {
        netRef.current?.setData({ nodes: netNodes, edges: netEdges });
    }, [netNodes, netEdges]);

    return (
        <div
            ref={containerRef}
            data-visgraph
            style={{
                width: '100%',
                height,
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                background: 'var(--bg-main)',
            }}
        />
    );
};

export default VisGraph;
