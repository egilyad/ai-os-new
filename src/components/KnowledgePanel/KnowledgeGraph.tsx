import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';
import type { GraphNodeData, EdgeData } from './graph-utils';
import { getNodeColor, LEGEND_ITEMS } from './graph-utils';

interface KnowledgeGraphProps {
    nodes: GraphNodeData[];
    edges: EdgeData[];
    isLoading: boolean;
    selectedNodeId: string | null;
    entityCount: number;
    totalMemories: number;
    density: number;
    onNodeClick: (node: GraphNodeData) => void;
    onNodeKeyDown: (e: React.KeyboardEvent, node: GraphNodeData) => void;
    t: (key: string) => string;
    searchQuery: string;
    typeFilter: string | null;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
    nodes,
    edges,
    isLoading,
    selectedNodeId,
    entityCount,
    totalMemories,
    density,
    onNodeClick,
    t,
    searchQuery,
    typeFilter,
}) => {
    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: 400,
                    color: 'var(--slate-500)',
                    fontSize: '0.85rem',
                }}
            >
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    {t('knowledge.loading')}
                </motion.div>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: 400,
                    color: 'var(--slate-500)',
                    gap: '0.75rem',
                }}
            >
                <Network size={40} style={{ opacity: 0.3 }} aria-hidden="true" />
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {searchQuery || typeFilter
                        ? t('knowledge.empty_filter')
                        : t('knowledge.empty_none')}
                </p>
                <p
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--slate-600)',
                        textAlign: 'center',
                        maxWidth: 300,
                    }}
                >
                    {searchQuery || typeFilter
                        ? t('knowledge.empty_filter_hint')
                        : t('knowledge.empty_none_hint')}
                </p>
            </div>
        );
    }

    const visNodes: VisGraphNode[] = nodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        color: getNodeColor(node.type),
        size: Math.max(10, Math.min(28, Math.round(node.importance * 26))),
        title: `${node.type} · важность ${node.importance.toFixed(2)}\n${node.fullContent.slice(0, 120)}`,
    }));

    const visEdges: VisGraphEdge[] = edges.map((edge) => ({
        id: edge.id,
        from: edge.source.id,
        to: edge.target.id,
        width: Math.max(0.5, edge.strength * 2.5),
    }));

    return (
        <>
            <div style={{ position: 'absolute', inset: 0 }}>
                <VisGraph
                    nodes={visNodes}
                    edges={visEdges}
                    onClickNode={(n) => {
                        const node = nodes.find((x) => x.id === n.id);
                        if (node) onNodeClick(node);
                    }}
                    height={500}
                />
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    display: 'flex',
                    gap: '1rem',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                {LEGEND_ITEMS.map((item) => (
                    <div
                        key={item.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--slate-300)',
                            textTransform: 'uppercase',
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: item.color,
                                boxShadow: `0 0 5px ${item.color}`,
                            }}
                        />{' '}
                        {item.label}
                    </div>
                ))}
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    width: 240,
                    background: 'rgba(0,0,0,0.5)',
                    padding: '1.25rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div
                    style={{
                        fontSize: '0.7rem',
                        color: '#a855f7',
                        fontWeight: 800,
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em',
                    }}
                >
                    GRAPH TOPOLOGY
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                        color: 'var(--slate-200)',
                    }}
                >
                    <span>Connection Density</span>
                    <span style={{ color: '#a855f7', fontWeight: 700 }}>{density}%</span>
                </div>
                <div
                    style={{
                        height: 4,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        marginBottom: '1rem',
                    }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${density}%` }}
                        style={{ height: '100%', background: '#a855f7', borderRadius: 2 }}
                    />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>
                    Mapped <strong style={{ color: 'white' }}>{entityCount}</strong> cognitive
                    entities with <strong style={{ color: 'white' }}>{edges.length}</strong>{' '}
                    connections
                    {entityCount < totalMemories &&
                        ` (${totalMemories - entityCount} filtered out)`}
                    {nodes.length < entityCount && ` (showing first ${nodes.length})`}.
                </div>
            </div>
        </>
    );
};

export default KnowledgeGraph;
