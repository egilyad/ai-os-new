import { useMemo, useState } from 'react';
import type { TopicConcept, TopicRelation } from '../../kernel/contracts/topic-graph/types';

type TopicGraphMatrixProps = {
    concepts: TopicConcept[];
    relations: TopicRelation[];
    height?: number;
};

const CONCEPT_COLOR = '#2dd4bf';
const CONFLICT_COLOR = '#f87171';

export default function TopicGraphMatrix(props: TopicGraphMatrixProps) {
    const { concepts, relations, height = 560 } = props;
    const [selected, setSelected] = useState<{ i: number; j: number } | null>(null);

    const model = useMemo(() => {
        const top = concepts.slice(0, 18);
        const claimToIndex = new Map<string, number>();
        top.forEach((c, idx) => {
            for (const id of c.claimIds) claimToIndex.set(id, idx);
        });

        const weight = Array.from({ length: top.length }, () =>
            new Array<number>(top.length).fill(0),
        );
        const conflicts = Array.from({ length: top.length }, () =>
            new Array<boolean>(top.length).fill(false),
        );
        const diag = top.map((c) => c.claimIds.length);

        for (const r of relations) {
            const i = claimToIndex.get(r.fromId);
            const j = claimToIndex.get(r.toId);
            if (i === undefined || j === undefined) continue;
            if (r.relation === 'contradicts') {
                conflicts[i]![j] = true;
                conflicts[j]![i] = true;
            } else {
                weight[i]![j] += r.weight;
                if (i !== j) weight[j]![i] += r.weight;
            }
        }

        const maxWeight = Math.max(1, ...weight.flat());
        return { top, weight, conflicts, diag, maxWeight };
    }, [concepts, relations]);

    const { top, weight, conflicts, diag, maxWeight } = model;
    const cell = 30;
    const side = 90;
    const W = side + cell * top.length + 10;
    const H = side + cell * top.length + 10;

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            <div
                style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    padding: 10,
                    overflow: 'auto',
                    maxHeight: height,
                }}
            >
                <svg width={W} height={H} style={{ display: 'block' }}>
                    <text x={6} y={16} fontSize={11} fill="var(--slate-500)">
                        Концепт × концепт: плотность связей (тёплое = больше), красный = конфликт
                    </text>
                    {top.map((c, i) => (
                        <g key={`col-${c.id}`}>
                            <text
                                x={side + i * cell + cell / 2}
                                y={side - 8}
                                textAnchor="middle"
                                fontSize={9}
                                fill={CONCEPT_COLOR}
                                style={{
                                    transform: `rotate(-35deg)`,
                                    transformOrigin: `${side + i * cell + cell / 2}px ${side - 8}px`,
                                }}
                            >
                                {c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name}
                            </text>
                            <text
                                x={side - 8}
                                y={side + i * cell + cell / 2 + 3}
                                textAnchor="end"
                                fontSize={9}
                                fill={CONCEPT_COLOR}
                            >
                                {c.name.length > 18 ? c.name.slice(0, 18) + '…' : c.name}
                            </text>
                        </g>
                    ))}
                    {top.map((c, i) =>
                        top.map((_, j) => {
                            const isDiag = i === j;
                            const isConflict = conflicts[i]![j] && !isDiag;
                            const w = isDiag ? diag[i]! : weight[i]![j];
                            const intensity = isDiag
                                ? Math.min(1, w / 12)
                                : Math.min(1, w / maxWeight);
                            const bg = isDiag
                                ? `rgba(45,212,191,${0.15 + intensity * 0.5})`
                                : isConflict
                                  ? `rgba(248,113,113,${0.35 + intensity * 0.5})`
                                  : `rgba(59,130,246,${0.06 + intensity * 0.6})`;
                            const x = side + j * cell;
                            const y = side + i * cell;
                            return (
                                <rect
                                    key={`${i}-${j}`}
                                    x={x}
                                    y={y}
                                    width={cell - 2}
                                    height={cell - 2}
                                    rx={3}
                                    fill={bg}
                                    stroke={
                                        selected && selected.i === i && selected.j === j
                                            ? '#fff'
                                            : 'rgba(255,255,255,0.08)'
                                    }
                                    strokeWidth={
                                        selected && selected.i === i && selected.j === j ? 1.5 : 0.5
                                    }
                                    style={{ cursor: 'pointer' }}
                                    onClick={() =>
                                        setSelected(
                                            selected && selected.i === i && selected.j === j
                                                ? null
                                                : { i, j },
                                        )
                                    }
                                >
                                    <title>
                                        {isDiag
                                            ? `${c.name}: ${w} утверждений`
                                            : isConflict
                                              ? `${top[i]!.name} ↔ ${top[j]!.name}: конфликт (вес ${w.toFixed(2)})`
                                              : `${top[i]!.name} ↔ ${top[j]!.name}: вес ${w.toFixed(2)}`}
                                    </title>
                                </rect>
                            );
                        }),
                    )}
                </svg>
            </div>
            {selected && (
                <div
                    style={{
                        width: 240,
                        flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        padding: 12,
                        fontSize: 12,
                        alignSelf: 'flex-start',
                    }}
                >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Связь</div>
                    {selected.i === selected.j ? (
                        <div style={{ color: 'var(--slate-100)' }}>
                            {top[selected.i]!.name}
                            <div style={{ color: 'var(--slate-400)', marginTop: 4 }}>
                                Утверждений: {diag[selected.i]!}
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--slate-100)' }}>
                            {top[selected.i]!.name} ↔ {top[selected.j]!.name}
                            <div style={{ color: 'var(--slate-400)', marginTop: 4 }}>
                                Вес: {weight[selected.i]![selected.j]!.toFixed(2)}
                            </div>
                            {conflicts[selected.i]![selected.j] && (
                                <div style={{ color: CONFLICT_COLOR, marginTop: 4 }}>
                                    ⚠ конфликт
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
