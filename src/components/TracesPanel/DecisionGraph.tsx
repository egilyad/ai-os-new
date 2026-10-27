import React, { useMemo } from 'react';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';
import type { CognitiveStep } from '../../kernel/instances';
import { flexAlignCenterGap5 } from '../../styles/common';

interface DecisionGraphProps {
    steps: CognitiveStep[];
    edges: { from: string; to: string; type: string }[];
    selectedId?: string | null;
    onSelectNode?: (id: string) => void;
}

const TYPE_COLOR: Record<string, string> = {
    routing: '#3b82f6',
    reasoning: '#a855f7',
    action: '#f59e0b',
    verification: '#10b981',
};

/**
 * DecisionGraph — интерактивный DAG когнитивных шагов. Зум, панорамирование,
 * тултипы, клик по узлу выделяет его.
 */
const DecisionGraph: React.FC<DecisionGraphProps> = ({ steps, edges, selectedId, onSelectNode }) => {
    const { nodes, visEdges } = useMemo(() => {
        const nodes: VisGraphNode[] = steps.map((s) => {
            const color = TYPE_COLOR[s.type] || '#64748b';
            const isSelected = selectedId === s.id;
            return {
                id: s.id,
                label: (s.label || s.type).toUpperCase(),
                type: s.type,
                color: isSelected ? '#fff' : color,
                size: isSelected ? 26 : 18,
                title: `${s.type} · ${s.label}\n${(s.observations ?? s.thoughts?.join(' ') ?? '').slice(0, 160)}`,
                borderColor: color,
            };
        });
        const visEdges: VisGraphEdge[] = edges.map((e) => ({
            id: `${e.from}-${e.to}-${e.type}`,
            from: e.from,
            to: e.to,
            color: e.type === 'causal' ? '#3b82f6' : '#a855f7',
            width: 2,
            title: e.type,
        }));
        return { nodes, visEdges };
    }, [steps, edges, selectedId]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <VisGraph
                nodes={nodes}
                edges={visEdges}
                onClickNode={(n) => onSelectNode?.(n.id as string)}
                height={420}
            />
            <div
                style={{ position: 'absolute', bottom: 15, right: 15, display: 'flex', gap: 15, fontSize: '0.6rem', color: 'var(--slate-400)', zIndex: 5, background: 'rgba(0,0,0,0.5)', padding: '0.4rem 0.7rem', borderRadius: 8 }}
                aria-label="Graph legend"
            >
                <div style={flexAlignCenterGap5}>
                    <div style={{ width: 10, height: 2, background: '#3b82f6' }} aria-hidden="true" /> Causal
                </div>
                <div style={flexAlignCenterGap5}>
                    <div style={{ width: 10, height: 2, background: '#a855f7' }} aria-hidden="true" /> Data Flow
                </div>
            </div>
        </div>
    );
};

export default DecisionGraph;
