import { motion } from 'framer-motion';
import { Network, Brain } from 'lucide-react';
import type { GraphNodeData, EdgeData } from './graph-utils';
import { getNodeColor, GLOW_COLORS, LEGEND_ITEMS } from './graph-utils';

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
    onNodeKeyDown,
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

    return (
        <>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                    {GLOW_COLORS.map((c) => (
                        <radialGradient key={c} id={`glow-${c.replace('#', '')}`}>
                            <stop offset="0%" stopColor={c} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={c} stopOpacity="0" />
                        </radialGradient>
                    ))}
                </defs>

                {edges.map((edge, i) => (
                    <motion.line
                        key={edge.id}
                        x1={edge.source.x}
                        y1={edge.source.y}
                        x2={edge.target.x}
                        y2={edge.target.y}
                        stroke={
                            selectedNodeId
                                ? selectedNodeId === edge.source.id ||
                                  selectedNodeId === edge.target.id
                                    ? 'rgba(255,255,255,0.4)'
                                    : 'rgba(255,255,255,0.02)'
                                : 'rgba(168,85,247,0.15)'
                        }
                        strokeWidth={edge.strength * 2}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: i * 0.02 }}
                    />
                ))}
            </svg>

            {nodes.map((node, i) => {
                const isSelected = selectedNodeId === node.id;
                const isDimmed = selectedNodeId && !isSelected;
                const color = getNodeColor(node.type);

                return (
                    <motion.div
                        key={node.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Node ${node.type}: ${node.label}`}
                        aria-selected={isSelected}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: isSelected ? 1.2 : 1,
                            opacity: isDimmed ? 0.3 : 1,
                        }}
                        transition={{ type: 'spring', damping: 20, delay: i * 0.05 }}
                        onClick={() => onNodeClick(node)}
                        onKeyDown={(e) => onNodeKeyDown(e, node)}
                        style={{
                            position: 'absolute',
                            left: node.x - 30,
                            top: node.y - 30,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: `2px solid ${isSelected ? 'white' : color}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            boxShadow: isSelected ? `0 0 30px ${color}` : `0 0 15px ${color}40`,
                            zIndex: isSelected ? 10 : 1,
                        }}
                    >
                        {node.importance > 0.8 && !isSelected && (
                            <motion.div
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 0, 0.5],
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{
                                    position: 'absolute',
                                    inset: -4,
                                    border: `1px solid ${color}`,
                                    borderRadius: '50%',
                                }}
                            />
                        )}
                        <Brain
                            size={18}
                            color={isSelected ? 'white' : color}
                            style={{ marginBottom: 2 }}
                            aria-hidden="true"
                        />
                        <div
                            style={{
                                fontSize: '0.5rem',
                                fontWeight: 700,
                                color: 'var(--slate-200)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                padding: '0 4px',
                            }}
                        >
                            {node.type.toUpperCase()}
                        </div>
                    </motion.div>
                );
            })}

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
                    semantic relationships
                    {entityCount < totalMemories &&
                        ` (${totalMemories - entityCount} filtered out)`}
                    .
                </div>
            </div>
        </>
    );
};

export default KnowledgeGraph;
