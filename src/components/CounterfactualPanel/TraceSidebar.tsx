import { CARD, PRESET_LABELS } from './counterfactual-constants';
import type { CausalTraceEntry } from '../../kernel/contracts/causal-debugger';

interface Props {
    traces: CausalTraceEntry[];
    selectedId: string | null;
    activePreset: number | null;
    onRun: (trace: CausalTraceEntry, presetIndex: number | null) => void;
}

const TraceSidebar: React.FC<Props> = ({ traces, selectedId, activePreset, onRun }) => {
    if (traces.length === 0) {
        return (
            <div
                style={{
                    ...CARD,
                    textAlign: 'center',
                    padding: 24,
                    color: 'var(--slate-500)',
                    fontSize: '0.8rem',
                }}
            >
                No traces — make a request first
            </div>
        );
    }

    return (
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {traces.map((t) => {
                const isSelected = selectedId === t.causalId;
                return (
                    <div
                        key={t.causalId}
                        style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                    >
                        <button
                            onClick={() => onRun(t, null)}
                            style={{
                                ...CARD,
                                padding: '0.4rem 0.75rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                border: 'none',
                                background: isSelected
                                    ? 'rgba(245,158,11,0.1)'
                                    : 'rgba(255,255,255,0.03)',
                                borderLeft: `3px solid ${isSelected ? '#f59e0b' : 'transparent'}`,
                                transition: 'all 0.15s',
                                fontSize: '0.75rem',
                            }}
                        >
                            <div style={{ fontWeight: 600, color: 'var(--slate-200)' }}>
                                {String(t.decision.selected) || '(none)'} ←{' '}
                                {String(t.decision.strategy) || '?'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                {t.causalId}
                            </div>
                        </button>
                        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', paddingLeft: 8 }}>
                            {PRESET_LABELS.map((label, i) => {
                                const isActive = activePreset === i && selectedId === t.causalId;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => onRun(t, i)}
                                        style={{
                                            fontSize: '0.6rem',
                                            padding: '0.1rem 0.35rem',
                                            borderRadius: 4,
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            background: isActive
                                                ? 'rgba(245,158,11,0.15)'
                                                : 'transparent',
                                            color: isActive ? '#f59e0b' : '#64748b',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TraceSidebar;
