import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Database, Brain, ShieldCheck } from 'lucide-react';
import { eventBus } from '../../kernel/instances';
import type { ISTopology } from '../../kernel/contracts/topology';

interface GraphNode {
    id: string;
    type: string;
    label: string;
    icon: React.ReactNode;
    x: number;
    y: number;
    status: 'idle' | 'active' | 'error';
}

interface GraphEdge {
    id: string;
    from: string;
    to: string;
    type: 'call' | 'flow' | 'dependency';
    active: boolean;
}

const NODE_ICONS: Record<string, React.ReactNode> = {
    router: <Brain size={16} />,
    agent: <Bot size={18} />,
    tool: <Database size={14} />,
    guardrail: <ShieldCheck size={14} />,
    aggregator: <Bot size={18} />,
};

function layoutTopology(topo: ISTopology): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = topo.nodes || [];
    const edges = topo.edges || [];
    const adj: Record<string, string[]> = {};
    const inDeg: Record<string, number> = {};
    nodes.forEach((n) => {
        adj[n.id] = [];
        inDeg[n.id] = 0;
    });
    edges.forEach((e) => {
        if (adj[e.from]) adj[e.from]!.push(e.to);
        if (inDeg[e.to] !== undefined) inDeg[e.to]!++;
    });

    const layer: Record<string, number> = {};
    let queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);
    if (queue.length === 0 && nodes.length > 0) queue = [nodes[0]!.id];

    const visited = new Set(queue);
    let ptr = 0;
    while (ptr < queue.length) {
        const cur = queue[ptr++]!;
        const cl = layer[cur] ?? 0;
        for (const next of adj[cur] || []) {
            if (!visited.has(next)) {
                visited.add(next);
                layer[next] = cl + 1;
                queue.push(next);
            } else if (layer[next] !== undefined) {
                layer[next] = Math.max(layer[next], cl + 1);
                queue.push(next);
            }
        }
    }
    nodes.forEach((n) => {
        if (layer[n.id] === undefined) layer[n.id] = 0;
    });

    const layerCounts: Record<number, number> = {};
    nodes.forEach((n) => {
        const l = layer[n.id] ?? 0;
        layerCounts[l] = (layerCounts[l] ?? 0) + 1;
    });

    const perLayerIdx: Record<number, number> = {};
    const graphNodes: GraphNode[] = nodes.map((n) => {
        const l = layer[n.id] ?? 0;
        const idx = perLayerIdx[l] ?? 0;
        perLayerIdx[l] = idx + 1;
        const count = layerCounts[l] ?? 1;
        const totalHeight = count * 70;
        const startY = (320 - totalHeight) / 2;

        const icon =
            n.id === 'entry' ? <Bot size={16} /> : (NODE_ICONS[n.type] ?? <Brain size={16} />);

        if (n.position) {
            return {
                id: n.id,
                type: n.type,
                label: n.label,
                icon,
                x: n.position.x,
                y: n.position.y,
                status: 'idle',
            };
        }

        return {
            id: n.id,
            type: n.type,
            label: n.label,
            icon,
            x: 50 + l * 180,
            y: startY + idx * 70 + 35,
            status: 'idle',
        };
    });

    const graphEdges: GraphEdge[] = edges.map((e, i) => ({
        id: e.id || `edge-${i}`,
        from: e.from,
        to: e.to,
        type: e.trigger === 'on_error' ? 'dependency' : 'flow',
        active: false,
    }));

    return { nodes: graphNodes, edges: graphEdges };
}

const IntelligenceGraph: React.FC = () => {
    const [topology, setTopology] = useState<ISTopology | null>(null);
    const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(new Set());
    const [errorNodeIds, setErrorNodeIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsubMount = eventBus.onSafe<ISTopology>('system:topology:mounted', (topo) => {
            setTopology(topo);
            setActiveNodeIds(new Set());
            setErrorNodeIds(new Set());
        });
        const unsubActive = eventBus.onSafe<Record<string, unknown>>(
            'cognitive:step:active',
            (d) => {
                if (d?.nodeId) {
                    setActiveNodeIds((prev) => new Set(prev).add(d.nodeId as string));
                    setErrorNodeIds((prev) => {
                        const n = new Set(prev);
                        n.delete(d.nodeId as string);
                        return n;
                    });
                }
            },
        );
        const unsubComplete = eventBus.onSafe<Record<string, unknown>>(
            'cognitive:step:completed',
            (d) => {
                if (d?.nodeId) {
                    setActiveNodeIds((prev) => {
                        const n = new Set(prev);
                        n.delete(d.nodeId as string);
                        return n;
                    });
                    if (d.status === 'error') {
                        setErrorNodeIds((prev) => new Set(prev).add(d.nodeId as string));
                    }
                }
            },
        );
        return () => {
            unsubMount();
            unsubActive();
            unsubComplete();
        };
    }, []);

    const layoutData = useMemo(() => {
        if (!topology)
            return { nodes: [], nodeMap: new Map<string, GraphNode>(), edges: [] as GraphEdge[] };
        const layout = layoutTopology(topology);
        const mappedNodes: GraphNode[] = layout.nodes.map((n) => ({
            ...n,
            status: (errorNodeIds.has(n.id)
                ? 'error'
                : activeNodeIds.has(n.id)
                  ? 'active'
                  : 'idle') as GraphNode['status'],
        }));
        const map = new Map<string, GraphNode>();
        mappedNodes.forEach((n) => map.set(n.id, n));
        const edges = layout.edges.map((e) => ({
            ...e,
            active: activeNodeIds.has(e.from) || activeNodeIds.has(e.to),
        }));
        return { nodes: mappedNodes, nodeMap: map, edges };
    }, [topology, activeNodeIds, errorNodeIds]);
    const { nodes, nodeMap, edges } = layoutData;

    if (!topology) {
        return (
            <div
                style={{
                    width: '100%',
                    height: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                }}
            >
                No topology mounted
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 320, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                {edges.map((edge) => {
                    const from = nodeMap.get(edge.from);
                    const to = nodeMap.get(edge.to);
                    if (!from || !to) return null;

                    return (
                        <g key={edge.id}>
                            <motion.path
                                d={`M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y}, ${(from.x + to.x) / 2} ${to.y}, ${to.x} ${to.y}`}
                                fill="none"
                                stroke={edge.active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}
                                strokeWidth={edge.active ? 2 : 1}
                                strokeDasharray={edge.type === 'dependency' ? '4 2' : 'none'}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1 }}
                            />
                            {edge.active && (
                                <motion.circle
                                    r={3}
                                    fill="#3b82f6"
                                    initial={{ cx: from.x, cy: from.y }}
                                    animate={{ cx: [from.x, to.x], cy: [from.y, to.y] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                    style={{ filter: 'blur(1px)' }}
                                />
                            )}
                        </g>
                    );
                })}

                {nodes.map((node) => {
                    const isAgent = node.type === 'agent' || node.type === 'aggregator';
                    return (
                        <g key={node.id}>
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={isAgent ? 24 : 18}
                                fill="rgba(0,0,0,0.4)"
                                stroke={
                                    node.status === 'active'
                                        ? '#3b82f6'
                                        : node.status === 'error'
                                          ? '#ef4444'
                                          : 'rgba(255,255,255,0.1)'
                                }
                                strokeWidth={2}
                                whileHover={{ scale: 1.1 }}
                            />
                            {(node.status === 'active' || node.status === 'error') && (
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={isAgent ? 24 : 18}
                                    fill="none"
                                    stroke={node.status === 'active' ? '#3b82f6' : '#ef4444'}
                                    strokeWidth={2}
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                />
                            )}
                            <foreignObject x={node.x - 12} y={node.y - 12} width={24} height={24}>
                                <div
                                    style={{
                                        color:
                                            node.status === 'active'
                                                ? '#3b82f6'
                                                : node.status === 'error'
                                                  ? '#ef4444'
                                                  : 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {node.icon}
                                </div>
                            </foreignObject>
                            <text
                                x={node.x}
                                y={node.y + (isAgent ? 40 : 32)}
                                textAnchor="middle"
                                fill={node.status === 'active' ? 'white' : 'var(--text-muted)'}
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {node.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <div
                style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: 10,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
                    />{' '}
                    Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--error)' }}
                    />{' '}
                    Error
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 2, background: 'var(--border-default)' }} />{' '}
                    Error Edge
                </div>
            </div>
        </div>
    );
};

export default IntelligenceGraph;
