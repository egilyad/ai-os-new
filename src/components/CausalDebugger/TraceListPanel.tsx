import { ChevronRight } from 'lucide-react';
import { textXxsMuted } from '../../styles/common';
import { CARD, PILL } from './causal-debugger-constants';
import type { CausalTraceEntry, CausalScope } from '../../kernel/contracts/causal-debugger';

interface Props {
    entries: CausalTraceEntry[];
    selectedId: string | null;
    scopes: CausalScope[];
    onSelect: (id: string) => void;
}

const TraceListPanel: React.FC<Props> = ({ entries, selectedId, scopes, onSelect }) => {
    if (entries.length === 0) {
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
                No traces yet — make a request and a causal trace will appear here
            </div>
        );
    }

    return (
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.map((t) => {
                const isSelected = t.causalId === selectedId;
                const scope = scopes.find((s) => s.causalId === t.causalId);
                return (
                    <button
                        key={t.causalId}
                        onClick={() => onSelect(t.causalId)}
                        style={{
                            ...CARD,
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            border: 'none',
                            background: isSelected
                                ? 'rgba(139,92,246,0.12)'
                                : 'rgba(255,255,255,0.03)',
                            borderLeft: `3px solid ${isSelected ? '#a78bfa' : 'transparent'}`,
                            transition: 'all 0.15s',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 2,
                            }}
                        >
                            <ChevronRight
                                size={12}
                                color="#64748b"
                                style={{
                                    transform: isSelected ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s',
                                }}
                            />
                            <span
                                style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-200)' }}
                            >
                                {t.causalId}
                            </span>
                            <span style={textXxsMuted}>{t.requestIds.length} req</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {scope?.providerIds.slice(0, 3).map((p) => (
                                <span
                                    key={p}
                                    style={{
                                        ...PILL,
                                        background: 'var(--accent-tint)',
                                        color: '#60a5fa',
                                    }}
                                >
                                    {p}
                                </span>
                            ))}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default TraceListPanel;
