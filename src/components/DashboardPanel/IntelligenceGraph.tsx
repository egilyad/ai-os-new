import React, { useMemo, useState, useEffect } from 'react';
import { eventBus } from '../../kernel/instances';
import type { ISTopology } from '../../kernel/contracts/topology';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';

const TYPE_COLOR: Record<string, string> = {
    router: '#3b82f6',
    agent: '#a855f7',
    tool: '#f59e0b',
    guardrail: '#10b981',
    aggregator: '#06b6d4',
};

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
        const unsubActive = eventBus.onSafe<Record<string, unknown>>('cognitive:step:active', (d) => {
            if (d?.nodeId) {
                setActiveNodeIds((prev) => new Set(prev).add(d.nodeId as string));
                setErrorNodeIds((prev) => {
                    const n = new Set(prev);
                    n.delete(d.nodeId as string);
                    return n;
                });
            }
        });
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

    const { nodes, edges } = useMemo(() => {
        if (!topology) return { nodes: [], edges: [] };
        const visNodes: VisGraphNode[] = (topology.nodes || []).map((n) => {
            const color = TYPE_COLOR[n.type] || '#64748b';
            const isError = errorNodeIds.has(n.id);
            const isActive = activeNodeIds.has(n.id);
            return {
                id: n.id,
                label: n.label,
                color: isError ? '#ef4444' : isActive ? color : color,
                borderColor: isError ? '#ef4444' : isActive ? '#fff' : '#0f172a',
                size: isActive ? 26 : 18,
                title: `${n.type} · ${n.label ?? ''}\nстатус: ${isError ? 'error' : isActive ? 'active' : 'idle'}`,
            };
        });
        const visEdges: VisGraphEdge[] = (topology.edges || []).map((e, i) => ({
            id: e.id || `edge-${i}`,
            from: e.from,
            to: e.to,
            width: 1.5,
            color: e.trigger === 'on_error' ? '#ef4444' : '#94a3b8',
        }));
        return { nodes: visNodes, edges: visEdges };
    }, [topology, activeNodeIds, errorNodeIds]);

    if (!topology || nodes.length === 0) {
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
        <div style={{ width: '100%', height: 320, position: 'relative' }}>
            <VisGraph nodes={nodes} edges={edges} onClickNode={() => {}} height={320} />
            <div
                style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: 10,
                    zIndex: 5,
                    background: 'rgba(0,0,0,0.5)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: 8,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} /> Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Error
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 2, background: '#ef4444' }} /> Error Edge
                </div>
            </div>
        </div>
    );
};

export default IntelligenceGraph;
