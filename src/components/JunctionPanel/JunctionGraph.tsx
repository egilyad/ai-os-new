import React, { useMemo } from 'react';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';
import type { Junction } from '../../kernel/types/junction-types';

interface Props {
    junction: Junction;
    width?: number;
    height?: number;
}

const TYPE_COLORS: Record<string, string> = {
    structural_analogy: '#8b5cf6',
    contradiction: '#ef4444',
    abstraction: '#10b981',
    pattern_completion: '#f59e0b',
};

/**
 * JunctionGraph — интерактивный граф «моста между доменами»: источники слева/
 * справа, соединённые с центральным узлом junction. Зум, панорамирование,
 * тултипы.
 */
const JunctionGraph: React.FC<Props> = ({ junction, height = 220 }) => {
    const { nodes, edges } = useMemo(() => {
        const color = TYPE_COLORS[junction.synthesisType] ?? '#64748b';
        const nodes: VisGraphNode[] = [];
        const edges: VisGraphEdge[] = [];

        const centerId = `junction:${junction.id}`;
        nodes.push({
            id: centerId,
            label: junction.synthesisType.replace('_', ' '),
            color,
            size: 26,
            title: `Junction · ${Math.round((junction.confidence ?? 0) * 100)}% · ${junction.status ?? ''}\n${(junction.content ?? '').slice(0, 160)}`,
        });

        for (const src of junction.inputs ?? []) {
            const id = `src:${src.id}`;
            nodes.push({
                id,
                label: src.domain || src.kind,
                color: '#38bdf8',
                size: 16,
                title: `${src.kind} · ${src.label}\n${(src.statement ?? '').slice(0, 160)}`,
            });
            edges.push({ id: `e:${src.id}`, from: id, to: centerId, color, width: 1.8 });
        }

        return { nodes, edges };
    }, [junction]);

    return <VisGraph nodes={nodes} edges={edges} onClickNode={() => {}} height={height} />;
};

export default JunctionGraph;
