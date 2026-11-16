import React, { useCallback, useEffect, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { KnowledgeGraphView, type GraphViewData } from '../viz/KnowledgeGraphView';
import { getBrain } from './use-wiki-brain';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

export default function BrainGraph() {
    const [graph, setGraph] = useState<GraphViewData>({ nodes: [], edges: [] });

    const load = useCallback(async () => {
        try {
            const g = await getBrain().graph.toFlowGraph();
            const deg = new Map<string, number>();
            const bump = (id: string) => deg.set(id, (deg.get(id) ?? 0) + 1);
            for (const edge of g.edges) {
                bump(edge.source);
                bump(edge.target);
            }
            setGraph({
                nodes: g.nodes.map((n) => ({
                    id: n.id,
                    label: n.label,
                    type: 'knowledge',
                    degree: deg.get(n.id) ?? 0,
                })),
                edges: g.edges.map((e) => ({ source: e.source, target: e.target, kind: 'link', weight: 1 })),
            });
        } catch {
            setGraph({ nodes: [], edges: [] });
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    return (
        <div>
            <div style={label}>Граф знаний</div>
            <div style={{ background: tokens.surface, border: `1px solid ${tokens.borderSubtle}`, borderRadius: 10, overflow: 'hidden' }}>
                <KnowledgeGraphView data={graph} height={480} />
            </div>
        </div>
    );
}
