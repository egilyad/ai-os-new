import { TrendingUp, ArrowRight, Trash2, Plus, Save } from 'lucide-react';
import { flexBetweenGapMd, glassPanel, iconBtnBlue, inputDarkSm } from '../../styles/common';

interface Props {
    modelDowngradeChains: Record<string, string[]>;
    onSave: (model: string, chain: string[]) => void;
    onAdd: () => void;
    onRemove: (model: string) => void;
    onRename: (model: string, next: string) => void;
    onUpdateItem: (model: string, idx: number, value: string) => void;
    onRemoveItem: (model: string, idx: number) => void;
    onAddItem: (model: string) => void;
}

const DowngradeMapSection: React.FC<Props> = ({
    modelDowngradeChains,
    onSave,
    onAdd,
    onRemove,
    onRename,
    onUpdateItem,
    onRemoveItem,
    onAddItem,
}) => (
    <div className="glass-panel" style={glassPanel}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                gap: '0.75rem',
            }}
        >
            <h3
                style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--slate-50)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}
            >
                <TrendingUp size={18} color="#3b82f6" /> Model Downgrade Map
            </h3>
            <button onClick={onAdd} title="Add downgrade chain" style={iconBtnBlue}>
                <Plus size={14} />
            </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {Object.entries(modelDowngradeChains).map(([model, chain]) => (
                <div
                    key={model}
                    style={{
                        padding: '0.9rem',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={flexBetweenGapMd}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                minWidth: 0,
                                flex: 1,
                            }}
                        >
                            <input
                                value={model}
                                onChange={(e) => onRename(model, e.target.value.trim())}
                                placeholder="source model"
                                style={{
                                    minWidth: 0,
                                    flex: 1,
                                    ...inputDarkSm,
                                    color: 'var(--slate-50)',
                                    fontWeight: 700,
                                }}
                            />
                            <ArrowRight size={14} style={{ color: 'var(--slate-500)', flexShrink: 0 }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                            <button
                                onClick={() => onSave(model, chain)}
                                title="Save downgrade chain"
                                style={iconBtnBlue}
                            >
                                <Save size={14} />
                            </button>
                            <button
                                onClick={() => onRemove(model)}
                                title="Remove chain"
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 6,
                                    border: '1px solid rgba(239,68,68,0.22)',
                                    background: 'rgba(239,68,68,0.08)',
                                    color: 'var(--error)',
                                    cursor: 'pointer',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {chain.map((item, i) => (
                            <div
                                key={`${item}-${i}`}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '24px minmax(0, 1fr) 30px',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                    {i + 1}.
                                </span>
                                <input
                                    value={item}
                                    onChange={(e) => onUpdateItem(model, i, e.target.value)}
                                    placeholder="downgrade model"
                                    style={{ ...inputDarkSm, color: '#93c5fd', fontWeight: 600 }}
                                />
                                <button
                                    onClick={() => onRemoveItem(model, i)}
                                    title="Remove model"
                                    style={{
                                        width: 28,
                                        height: 28,
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
                        ))}
                        <button
                            onClick={() => onAddItem(model)}
                            style={{
                                padding: '0.45rem',
                                borderRadius: 8,
                                background: 'rgba(59,130,246,0.08)',
                                color: '#60a5fa',
                                border: '1px dashed rgba(59,130,246,0.25)',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus
                                size={14}
                                style={{ marginRight: '0.35rem', verticalAlign: 'middle' }}
                            />{' '}
                            ADD MODEL
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default DowngradeMapSection;
