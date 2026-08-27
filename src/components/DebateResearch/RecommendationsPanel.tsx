import { AlertTriangle } from 'lucide-react';

interface Props {
    recommendations: string[];
}

const RecommendationsPanel: React.FC<Props> = ({ recommendations }) => (
    <div
        style={{
            marginTop: '1.25rem',
            padding: '0.85rem',
            borderRadius: 10,
            background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.12)',
        }}
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: '0.4rem',
            }}
        >
            <AlertTriangle size={13} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>
                Recommendations
            </span>
        </div>
        <ul
            style={{
                margin: 0,
                paddingLeft: '1rem',
                fontSize: '0.7rem',
                color: 'var(--slate-400)',
                lineHeight: 1.6,
            }}
        >
            {recommendations.map((rec, i) => (
                <li key={`rec-${i}`}>{rec}</li>
            ))}
        </ul>
    </div>
);

export default RecommendationsPanel;
