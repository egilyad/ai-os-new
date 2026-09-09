import { MessageSquare } from 'lucide-react';
import type { NarrativeExplanation } from '../../kernel/contracts/counterfactual-narrative';

interface Props {
    narrative: NarrativeExplanation;
}

const confidenceStyle = (conf: number): React.CSSProperties => ({
    marginLeft: 'auto',
    fontSize: '0.6rem',
    padding: '0.1rem 0.35rem',
    borderRadius: 4,
    background:
        conf > 0.7
            ? 'rgba(34,197,94,0.1)'
            : conf > 0.4
              ? 'rgba(245,158,11,0.1)'
              : 'rgba(239,68,68,0.1)',
    color: conf > 0.7 ? '#22c55e' : conf > 0.4 ? '#f59e0b' : '#ef4444',
});

const NarrativeSection: React.FC<Props> = ({ narrative }) => (
    <div
        style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 16,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageSquare size={14} color="#60a5fa" />
            <span
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#60a5fa',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}
            >
                Causal Narrative
            </span>
            <span style={confidenceStyle(narrative.confidence)}>
                conf {(narrative.confidence * 100).toFixed(0)}%
            </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--slate-200)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
            {narrative.summary}
        </p>
        {narrative.causalChain.map((step, i) => (
            <div
                key={`${step}-${i}`}
                style={{
                    fontSize: '0.7rem',
                    color: 'var(--slate-400)',
                    padding: '2px 0',
                    paddingLeft: 12,
                    borderLeft: '2px solid rgba(96,165,250,0.2)',
                    marginBottom: 4,
                }}
            >
                {step}
            </div>
        ))}
    </div>
);

export default NarrativeSection;
