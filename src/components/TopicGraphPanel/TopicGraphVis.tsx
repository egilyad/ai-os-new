import { useMemo, useState } from 'react';
import VisGraph, { type VisGraphEdge, type VisGraphNode } from '../Common/VisGraph';
import type { TopicClaim, TopicConcept, TopicRelation, TopicSource } from '../../kernel/contracts/topic-graph/types';

type TopicGraphVisProps = {
    concepts: TopicConcept[];
    claims: TopicClaim[];
    relations: TopicRelation[];
    sources: TopicSource[];
    height?: number;
};

const CONCEPT_COLOR = '#2dd4bf';
const CLAIM_COLOR = '#3b82f6';
const CONFLICT_COLOR = '#f87171';

export default function TopicGraphVis(props: TopicGraphVisProps) {
    const { concepts, claims, relations, sources, height = 560 } = props;
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const nodes: VisGraphNode[] = useMemo(() => {
        const conceptNodes: VisGraphNode[] = concepts.slice(0, 20).map((c) => ({
            id: c.id,
            label: c.name,
            color: CONCEPT_COLOR,
            size: 12 + Math.min(10, c.claimIds.length),
            title: `Концепт: ${c.name}\nУтверждений: ${c.claimIds.length}\nАлиасы: ${c.aliases.join(', ') || '—'}`,
        }));
        const claimNodes: VisGraphNode[] = claims.slice(0, 60).map((c) => ({
            id: c.id,
            label: c.text.length > 40 ? c.text.slice(0, 40) + '…' : c.text,
            color: CLAIM_COLOR,
            size: 10,
            title: c.text,
        }));
        return [...conceptNodes, ...claimNodes];
    }, [concepts, claims]);

    const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

    const edges: VisGraphEdge[] = useMemo(
        () =>
            relations
                .filter((r) => nodeIds.has(r.fromId) && nodeIds.has(r.toId))
                .slice(0, 120)
                .map((r) => {
                    const isConflict = r.relation === 'contradicts';
                    return {
                        id: r.id,
                        from: r.fromId,
                        to: r.toId,
                        color: isConflict ? CONFLICT_COLOR : '#64748b',
                        width: isConflict ? 2.5 : 0.8 + r.weight * 1.5,
                        title: r.relation,
                    };
                }),
        [relations, nodeIds],
    );

    const selected = useMemo(() => {
        if (!selectedId) return null;
        const concept = concepts.find((c) => c.id === selectedId);
        if (concept) {
            return {
                kind: 'concept' as const,
                title: concept.name,
                lines: [`Утверждений: ${concept.claimIds.length}`, `Алиасы: ${concept.aliases.length ? concept.aliases.join(', ') : '—'}`],
            };
        }
        const claim = claims.find((c) => c.id === selectedId);
        if (claim) {
            const sourceTitles = claim.sourceIds
                .map((sid) => sources.find((s) => s.id === sid))
                .filter((s): s is TopicSource => Boolean(s))
                .map((s) => s.title);
            return {
                kind: 'claim' as const,
                title: claim.text,
                lines: [`conf: ${claim.confidence.toFixed(2)} · статус: ${claim.status}`],
                sourceLine: `Источники: ${sourceTitles.length ? sourceTitles.join('; ') : claim.sourceIds.join(', ')}`,
            };
        }
        return null;
    }, [selectedId, concepts, claims, sources]);

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
                <VisGraph
                    nodes={nodes}
                    edges={edges}
                    height={height}
                    physics
                    onClickNode={(n) => setSelectedId(String(n.id))}
                    interactionOptions={{ hover: true, dragNodes: true, dragView: true, zoomView: true }}
                />
            </div>
            {selected && (
                <div
                    style={{
                        width: 260,
                        flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        padding: 12,
                        fontSize: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxHeight: height,
                        overflowY: 'auto',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: 13, color: selected.kind === 'concept' ? CONCEPT_COLOR : CLAIM_COLOR }}>
                        {selected.kind === 'concept' ? 'Концепт' : 'Утверждение'}
                    </div>
                    <div style={{ color: 'var(--slate-100)', wordBreak: 'break-word' }}>{selected.title}</div>
                    {selected.lines.map((l, i) => (
                        <div key={i} style={{ color: 'var(--slate-400)' }}>{l}</div>
                    ))}
                    {'sourceLine' in selected && (
                        <div style={{ color: 'var(--slate-400)' }}>{selected.sourceLine}</div>
                    )}
                </div>
            )}
        </div>
    );
}
