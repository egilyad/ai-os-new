import { useMemo } from 'react';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';
import type { DebateTopology } from '../../kernel/instances';
import { ROLE_COLORS } from './debate-runtime-constants';

export function TopologyDiagram({ topology }: { topology: DebateTopology }) {
    const { nodes, edges } = useMemo(() => {
        const nodes: VisGraphNode[] = topology.nodes.map((n) => ({
            id: n.id,
            label: n.label,
            color: ROLE_COLORS[n.role] || '#64748b',
            size: 16,
            title: `${n.label} · роль: ${n.role}`,
        }));
        const edges: VisGraphEdge[] = topology.edges.map((e) => ({
            id: `${e.from}-${e.to}`,
            from: e.from,
            to: e.to,
            width: 1.8,
        }));
        return { nodes, edges };
    }, [topology]);

    if (topology.nodes.length === 0) return null;

    return <VisGraph nodes={nodes} edges={edges} onClickNode={() => {}} height={220} />;
}
