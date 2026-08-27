import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    type Connection,
    type Edge,
    type Node,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface DslCanvasProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onChange?: (nodes: Node[], edges: Edge[]) => void;
    height?: number;
    readonly?: boolean;
}

const NODE_TYPES_CONFIG = [
    { type: 'agent', label: 'Agent', color: 'var(--accent)' },
    { type: 'router', label: 'Router', color: 'var(--purple)' },
    { type: 'aggregator', label: 'Aggregator', color: 'var(--success)' },
    { type: 'judge', label: 'Judge', color: 'var(--warning)' },
    { type: 'tool', label: 'Tool', color: 'var(--error)' },
    { type: 'memory', label: 'Memory', color: '#ec4899' },
];

const DEFAULT_NODES: Node[] = [
    {
        id: '1',
        type: 'default',
        position: { x: 250, y: 50 },
        data: { label: 'Router' },
        style: {
            background: 'var(--purple)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
        },
    },
    {
        id: '2',
        type: 'default',
        position: { x: 100, y: 200 },
        data: { label: 'Agent A' },
        style: {
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
        },
    },
    {
        id: '3',
        type: 'default',
        position: { x: 400, y: 200 },
        data: { label: 'Agent B' },
        style: {
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
        },
    },
    {
        id: '4',
        type: 'default',
        position: { x: 250, y: 350 },
        data: { label: 'Aggregator' },
        style: {
            background: 'var(--success)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
        },
    },
];

const DEFAULT_EDGES: Edge[] = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
    },
    {
        id: 'e1-3',
        source: '1',
        target: '3',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
    },
    {
        id: 'e2-4',
        source: '2',
        target: '4',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
        style: { stroke: 'var(--success)', strokeWidth: 2 },
    },
    {
        id: 'e3-4',
        source: '3',
        target: '4',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
        style: { stroke: 'var(--success)', strokeWidth: 2 },
    },
];

export const DslCanvas: React.FC<DslCanvasProps> = ({
    initialNodes,
    initialEdges,
    onChange,
    height = 500,
    readonly,
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || DEFAULT_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || DEFAULT_EDGES);
    const [nodeCount, setNodeCount] = useState(5);

    const onConnect = useCallback(
        (params: Connection) => {
            const newEdge = {
                ...params,
                markerEnd: { type: MarkerType.ArrowClosed },
                animated: true,
                style: { stroke: '#6366f1', strokeWidth: 2 },
            };
            setEdges((eds) => addEdge(newEdge, eds));
            onChange?.(nodes, [...edges, newEdge as Edge]);
        },
        [nodes, edges, onChange, setEdges],
    );

    const addNode = useCallback(
        (type: string) => {
            const colors: Record<string, string> = {
                agent: '#3b82f6',
                router: '#8b5cf6',
                aggregator: '#22c55e',
                judge: '#f59e0b',
                tool: '#ef4444',
                memory: '#ec4899',
            };
            const labels: Record<string, string> = {
                agent: 'Agent',
                router: 'Router',
                aggregator: 'Agg',
                judge: 'Judge',
                tool: 'Tool',
                memory: 'Mem',
            };
            const id = `${nodeCount}`;
            const newNode: Node = {
                id,
                type: 'default',
                position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
                data: { label: `${labels[type] || 'Node'} ${id}` },
                style: {
                    background: colors[type] || '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                },
            };
            setNodes((nds) => [...nds, newNode]);
            onChange?.(nodes, edges);
            setNodeCount((c) => c + 1);
        },
        [nodeCount, nodes, edges, onChange, setNodes],
    );

    const clearCanvas = useCallback(() => {
        setNodes([]);
        setEdges([]);
        onChange?.([], []);
    }, [setNodes, setEdges, onChange]);

    return (
        <div
            style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        >
            {!readonly && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.3rem',
                        padding: '0.3rem 0.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginRight: '0.3rem',
                        }}
                    >
                        Add:
                    </span>
                    {NODE_TYPES_CONFIG.map((c) => (
                        <button
                            key={c.type}
                            onClick={() => addNode(c.type)}
                            style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                background: `${c.color}30`,
                                color: c.color,
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                            }}
                        >
                            +{c.label}
                        </button>
                    ))}
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={clearCanvas}
                        style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'rgba(239,68,68,0.2)',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        Clear
                    </button>
                </div>
            )}
            <div style={{ height }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    attributionPosition="bottom-left"
                    style={{ background: 'rgba(0,0,0,0.15)' }}
                >
                    <Background color="rgba(255,255,255,0.05)" />
                    <Controls
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    />
                    <MiniMap
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

export default DslCanvas;
