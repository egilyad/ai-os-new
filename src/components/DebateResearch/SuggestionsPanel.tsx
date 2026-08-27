import { ChevronDown, ChevronRight, Lightbulb, CheckCircle } from 'lucide-react';
import type { PromptSuggestion } from '../../kernel/contracts/prompt-audit';
import { suggestionTypeColor } from './prompt-audit-constants';

interface Props {
    suggestions: PromptSuggestion[];
    showSuggestions: boolean;
    onToggle: () => void;
}

const SuggestionsPanel: React.FC<Props> = ({ suggestions, showSuggestions, onToggle }) => {
    if (suggestions.length === 0) return null;

    return (
        <div
            style={{
                padding: '0.5rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}
        >
            <div
                style={{
                    marginBottom: '0.3rem',
                    borderRadius: 10,
                    border: '1px solid rgba(245,158,11,0.12)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '0.45rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        cursor: 'pointer',
                        background: 'rgba(245,158,11,0.04)',
                    }}
                    onClick={onToggle}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onToggle();
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {showSuggestions ? (
                        <ChevronDown size={12} color="#64748b" />
                    ) : (
                        <ChevronRight size={12} color="#64748b" />
                    )}
                    <Lightbulb size={13} color="#f59e0b" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--warning)' }}>
                        Suggestions ({suggestions.length})
                    </span>
                </div>
                {showSuggestions &&
                    suggestions.map((s) => (
                        <div
                            key={`${s.agent}-${s.type}`}
                            style={{
                                padding: '0.3rem 0.85rem',
                                borderTop: '1px solid rgba(255,255,255,0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <CheckCircle size={10} color={suggestionTypeColor(s.type)} />
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    color: 'var(--slate-400)',
                                }}
                            >
                                {s.agent}:
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{s.text}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default SuggestionsPanel;
