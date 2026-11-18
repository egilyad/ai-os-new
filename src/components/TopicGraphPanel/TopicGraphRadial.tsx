import { useMemo, useState } from 'react';
import type {
    TopicClaim,
    TopicConcept,
    TopicSource,
} from '../../kernel/contracts/topic-graph/types';

type TopicGraphRadialProps = {
    concepts: TopicConcept[];
    claims: TopicClaim[];
    sources: TopicSource[];
    height?: number;
};

const CONCEPT_COLOR = '#2dd4bf';
const CLAIM_COLOR = '#3b82f6';
const SOURCE_COLOR = '#64748b';
const CONTRADICTED_COLOR = '#f87171';

type Arc = { start: number; end: number };
type Segment = {
    arc: Arc;
    level: 0 | 1 | 2;
    color: string;
    label: string;
    detail: string;
    claimIds: string[];
};

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = polar(cx, cy, r1, a0);
    const [x1, y1] = polar(cx, cy, r1, a1);
    const [x2, y2] = polar(cx, cy, r0, a1);
    const [x3, y3] = polar(cx, cy, r0, a0);
    return [
        `M ${x0} ${y0}`,
        `A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1}`,
        `L ${x2} ${y2}`,
        `A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3}`,
        'Z',
    ].join(' ');
}

function divideCircle(total: number, counts: number[], start = -Math.PI / 2): Arc[] {
    const usable = Math.max(1, total);
    const arcs: Arc[] = [];
    let cursor = start;
    for (const count of counts) {
        const span = (2 * Math.PI * Math.max(0, count)) / usable;
        arcs.push({ start: cursor, end: cursor + span });
        cursor += span;
    }
    return arcs;
}

export default function TopicGraphRadial(props: TopicGraphRadialProps) {
    const { concepts, claims, sources, height = 560 } = props;
    const [selected, setSelected] = useState<Segment | null>(null);

    const { segments } = useMemo(() => {
        const top = concepts.slice(0, 16);
        const conceptCounts = top.map((c) => Math.max(1, c.claimIds.length));
        const conceptArcs = divideCircle(
            conceptCounts.reduce((a, b) => a + b, 0) || 1,
            conceptCounts,
        );

        const segments: Segment[] = [];
        top.forEach((concept, ci) => {
            const cArcs = conceptArcs[ci]!;
            const claimList = claims.filter((c) => concept.claimIds.includes(c.id)).slice(0, 40);
            const claimCounts = claimList.map((c) => Math.max(1, c.sourceIds.length));
            const claimArcs = divideCircle(
                claimCounts.reduce((a, b) => a + b, 0) || 1,
                claimCounts,
                cArcs.start,
            );
            const conceptSpan = cArcs.end - cArcs.start;
            if (conceptSpan >= 0.12) {
                segments.push({
                    arc: cArcs,
                    level: 0,
                    color: CONCEPT_COLOR,
                    label: concept.name,
                    detail: `Концепт: ${concept.name}\nУтверждений: ${concept.claimIds.length}`,
                    claimIds: concept.claimIds,
                });
            }
            claimList.forEach((claim, i) => {
                const a = claimArcs[i]!;
                const sourceList = claim.sourceIds
                    .map((sid) => sources.find((s) => s.id === sid))
                    .filter((s): s is TopicSource => Boolean(s));
                const isContradicted = claim.status === 'contradicted';
                const claimSpan = a.end - a.start;
                if (claimSpan >= 0.02) {
                    segments.push({
                        arc: a,
                        level: 1,
                        color: isContradicted ? CONTRADICTED_COLOR : CLAIM_COLOR,
                        label: claim.text.length > 48 ? claim.text.slice(0, 48) + '…' : claim.text,
                        detail: `Утверждение: ${claim.text}\nconf: ${claim.confidence.toFixed(2)} · статус: ${claim.status}\nИсточников: ${sourceList.length}`,
                        claimIds: [claim.id],
                    });
                }
                const sourceArcs = divideCircle(
                    Math.max(1, sourceList.length),
                    sourceList.map(() => 1),
                    a.start,
                );
                sourceList.forEach((source, si) => {
                    const sa = sourceArcs[si]!;
                    if (sa.end - sa.start >= 0.008) {
                        segments.push({
                            arc: sa,
                            level: 2,
                            color: SOURCE_COLOR,
                            label:
                                source.title.length > 30
                                    ? source.title.slice(0, 30) + '…'
                                    : source.title,
                            detail: `Источник: ${source.title}\nтип: ${source.kind}\n${source.ref}`,
                            claimIds: [claim.id],
                        });
                    }
                });
            });
        });
        return { segments };
    }, [concepts, claims, sources]);

    const W = 800;
    const H = height > 500 ? 720 : 560;
    const cx = W / 2;
    const cy = H / 2;
    const R0 = 70;
    const R1 = 180;
    const R2 = 280;

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            <div
                style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    height,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
                    {segments.map((seg) => {
                        const r0 = seg.level === 0 ? R1 : seg.level === 1 ? R0 : 12;
                        const r1 = seg.level === 0 ? R2 : seg.level === 1 ? R1 : R0;
                        const d = arcPath(cx, cy, r0, r1, seg.arc.start, seg.arc.end);
                        return (
                            <path
                                key={`${seg.level}-${seg.arc.start.toFixed(3)}-${seg.arc.end.toFixed(3)}-${seg.label}`}
                                d={d}
                                fill={seg.color}
                                fillOpacity={seg.level === 0 ? 0.32 : seg.level === 1 ? 0.55 : 0.75}
                                stroke="rgba(0,0,0,0.35)"
                                strokeWidth={0.75}
                                style={{ cursor: 'pointer', transition: 'fill-opacity 120ms' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.fillOpacity = '0.9';
                                    setSelected(seg);
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.fillOpacity = String(
                                        seg.level === 0 ? 0.32 : seg.level === 1 ? 0.55 : 0.75,
                                    );
                                    setSelected(null);
                                }}
                            >
                                <title>{seg.detail}</title>
                            </path>
                        );
                    })}
                    {/* Центральное ядро */}
                    <circle cx={cx} cy={cy} r={12} fill={CONCEPT_COLOR} fillOpacity={0.5} />
                    <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill="var(--slate-300)"
                    >
                        {concepts.length} концептов
                    </text>
                </svg>
                <div
                    style={{
                        position: 'absolute',
                        left: 10,
                        top: 10,
                        fontSize: 11,
                        color: 'var(--slate-500)',
                        pointerEvents: 'none',
                    }}
                >
                    Sunburst: концепты → утверждения → источники
                </div>
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
                        maxHeight: height,
                        overflowY: 'auto',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                        {selected.level === 0
                            ? 'Концепт'
                            : selected.level === 1
                              ? 'Утверждение'
                              : 'Источник'}
                    </div>
                    <div
                        style={{
                            color: 'var(--slate-100)',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {selected.detail}
                    </div>
                </div>
            )}
        </div>
    );
}
