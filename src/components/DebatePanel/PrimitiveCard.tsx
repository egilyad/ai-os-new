import { ArrowUp, ArrowDown, Copy, X } from 'lucide-react';
import type {
    StrategyPrimitive,
    SequencePrimitive,
    DebateGraphPrimitive,
    CriticLoopPrimitive,
    VotingPrimitive,
    PeerReviewPrimitive,
} from '../../kernel/contracts/debate-strategy-dsl';
import { s } from './debate-strategy-styles';
import { PRIMITIVE_META } from './debate-strategy-utils';

interface PrimitiveCardProps {
    primitive: StrategyPrimitive;
    index: number;
    total: number;
    isSelected: boolean;
    onSelect: (index: number) => void;
    onMove: (index: number, dir: -1 | 1) => void;
    onDuplicate: (index: number) => void;
    onRemove: (index: number) => void;
}

export const PrimitiveCard: React.FC<PrimitiveCardProps> = ({
    primitive: p,
    index,
    total,
    isSelected,
    onSelect,
    onMove,
    onDuplicate,
    onRemove,
}) => {
    const meta = PRIMITIVE_META[p.type]!;
    return (
        <div
            key={p.id}
            style={s.primitiveCard(meta.color, isSelected)}
            onClick={() => onSelect(index)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(index);
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div style={s.primitiveHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={s.paletteDot(meta.color)} />
                    <span style={s.primitiveType(meta.color)}>{meta.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        style={{ ...s.iconBtn, opacity: index === 0 ? 0.3 : 1 }}
                    >
                        <ArrowUp size={12} />
                    </button>
                    <button
                        onClick={() => onMove(index, 1)}
                        disabled={index === total - 1}
                        style={{ ...s.iconBtn, opacity: index === total - 1 ? 0.3 : 1 }}
                    >
                        <ArrowDown size={12} />
                    </button>
                    <button onClick={() => onDuplicate(index)} style={s.iconBtn}>
                        <Copy size={12} />
                    </button>
                    <button
                        onClick={() => onRemove(index)}
                        style={{ ...s.iconBtn, color: 'var(--error)' }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
            <div style={s.primitiveLabel}>{p.label || p.id}</div>
            {p.type === 'debate_graph' && (
                <div style={{ fontSize: 9, color: 'var(--slate-400)', marginTop: 2 }}>
                    {(p as DebateGraphPrimitive).agents?.length ?? 0} agents ·{' '}
                    {(p as DebateGraphPrimitive).edges?.length ?? 0} edges ·{' '}
                    {(p as DebateGraphPrimitive).maxRounds ?? 4} rounds
                </div>
            )}
            {p.type === 'critic_loop' && (
                <div style={{ fontSize: 9, color: 'var(--slate-400)', marginTop: 2 }}>
                    {(p as CriticLoopPrimitive).maxIterations} iterations ·{' '}
                    {(p as CriticLoopPrimitive).stopWhen}
                </div>
            )}
            {p.type === 'voting' && (
                <div style={{ fontSize: 9, color: 'var(--slate-400)', marginTop: 2 }}>
                    {(p as VotingPrimitive).mechanism} ·{' '}
                    {(p as VotingPrimitive).voters?.length ?? 0} voters
                </div>
            )}
            {p.type === 'peer_review' && (
                <div style={{ fontSize: 9, color: 'var(--slate-400)', marginTop: 2 }}>
                    {(p as PeerReviewPrimitive).criteria?.join(', ') ?? ''}
                </div>
            )}
            {p.type === 'sequence' && (
                <div style={{ fontSize: 9, color: 'var(--slate-400)', marginTop: 2 }}>
                    {(p as SequencePrimitive).steps?.length ?? 0} steps
                </div>
            )}
        </div>
    );
};
