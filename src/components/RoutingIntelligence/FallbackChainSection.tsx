import { Shield, ChevronDown, Trash2, Plus, Save } from 'lucide-react';
import type { FallbackLink } from '../../kernel/instances';
import { providerColor } from './routing-utils';
import {
    flexBetweenGapMd,
    flexColGap2,
    flexColGap4,
    glassPanel,
    inputDarkSm,
    sectionHeader,
} from '../../styles/common';

interface Props {
    fallbackChains: Record<string, FallbackLink[]>;
    onSave: (strategy: string, chain: FallbackLink[]) => void;
    onAdd: (strategy: string) => void;
    onRemove: (strategy: string, idx: number) => void;
    onMove: (strategy: string, idx: number, direction: -1 | 1) => void;
    onUpdate: (strategy: string, idx: number, patch: Partial<FallbackLink>) => void;
}

const FallbackChainSection: React.FC<Props> = ({
    fallbackChains,
    onSave,
    onAdd,
    onRemove,
    onMove,
    onUpdate,
}) => (
    <div className="glass-panel" style={glassPanel}>
        <h3 style={sectionHeader}>
            <Shield size={18} color="#10b981" /> Fallback Chains
        </h3>
        <div style={flexColGap4}>
            {Object.entries(fallbackChains).map(([strategy, chain]) => (
                <div
                    key={strategy}
                    style={{
                        padding: '0.9rem',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={flexBetweenGapMd}>
                        <div
                            style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                textTransform: 'capitalize',
                            }}
                        >
                            {strategy} Strategy
                        </div>
                        <button
                            onClick={() => onSave(strategy, chain)}
                            title="Save fallback chain"
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                border: '1px solid rgba(16,185,129,0.25)',
                                background: 'var(--success-tint)',
                                color: 'var(--success)',
                                cursor: 'pointer',
                                display: 'grid',
                                placeItems: 'center',
                            }}
                        >
                            <Save size={14} />
                        </button>
                    </div>
                    <div style={flexColGap2}>
                        {chain.map((link, idx) => (
                            <div
                                key={`${link.provider}-${link.model}-${idx}`}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        '24px minmax(90px, 1fr) minmax(90px, 1fr) 72px',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '0.5rem',
                                    borderRadius: 8,
                                }}
                            >
                                <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                    {idx + 1}.
                                </span>
                                <input
                                    value={link.provider}
                                    onChange={(e) =>
                                        onUpdate(strategy, idx, { provider: e.target.value })
                                    }
                                    placeholder="provider"
                                    style={{
                                        ...inputDarkSm,
                                        color: providerColor(link.provider),
                                        fontWeight: 700,
                                    }}
                                />
                                <input
                                    value={link.model || ''}
                                    onChange={(e) =>
                                        onUpdate(strategy, idx, { model: e.target.value })
                                    }
                                    placeholder="model"
                                    style={{ ...inputDarkSm, color: 'var(--slate-300)' }}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.25rem',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <button
                                        onClick={() => onMove(strategy, idx, -1)}
                                        title="Move up"
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 6,
                                            color: 'var(--slate-400)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'grid',
                                            placeItems: 'center',
                                            transform: 'rotate(180deg)',
                                        }}
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    <button
                                        onClick={() => onMove(strategy, idx, 1)}
                                        title="Move down"
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 6,
                                            color: 'var(--slate-400)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    <button
                                        onClick={() => onRemove(strategy, idx)}
                                        title="Remove provider"
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 6,
                                            color: 'var(--error)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => onAdd(strategy)}
                            style={{
                                marginTop: '0.25rem',
                                padding: '0.5rem',
                                borderRadius: 8,
                                background: 'var(--success-tint)',
                                color: 'var(--success)',
                                border: '1px dashed rgba(16,185,129,0.3)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus
                                size={14}
                                style={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            />{' '}
                            ADD PROVIDER
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default FallbackChainSection;
