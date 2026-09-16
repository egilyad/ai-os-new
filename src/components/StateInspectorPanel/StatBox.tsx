import { textMutedXs, textWhiteXs } from '../../styles/common';

interface StatBoxProps {
    label: string;
    value: string | number;
    color: string;
}

export const StatBox: React.FC<StatBoxProps> = ({ label, value, color }) => (
    <div
        style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 8,
            border: `1px solid ${color}20`,
            background: `linear-gradient(145deg, ${color}05, rgba(0,0,0,0.2))`,
        }}
    >
        <div style={{ ...textMutedXs, fontSize: '0.65rem', marginBottom: 2 }}>{label}</div>
        <div style={{ ...textWhiteXs, fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
    </div>
);
