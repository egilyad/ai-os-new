import { textMutedXs, textWhiteXs } from '../../styles/common';

export const StatBox: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}> = ({ icon, label, value, color }) => (
    <div
        style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 8,
            border: `1px solid ${color}20`,
            background: `linear-gradient(145deg, ${color}05, rgba(0,0,0,0.2))`,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            {icon}
            <span style={{ ...textMutedXs, fontSize: '0.65rem' }}>{label}</span>
        </div>
        <div style={{ ...textWhiteXs, fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
    </div>
);

export const MiniStat: React.FC<{ label: string; value: string; color: string }> = ({
    label,
    value,
    color,
}) => (
    <div style={{ padding: '0.25rem 0.4rem', borderRadius: 4, background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ ...textMutedXs, fontSize: '0.6rem' }}>{label}</div>
        <div style={{ color, fontSize: '0.8rem', fontWeight: 600 }}>{value}</div>
    </div>
);

export const LatencyCell: React.FC<{ value: number; highlight?: boolean }> = ({
    value,
    highlight,
}) => {
    const color = value > 2000 ? '#fca5a5' : value > 500 ? '#fcd34d' : '#86efac';
    return (
        <span
            style={{
                textAlign: 'right',
                color: highlight ? color : 'var(--slate-300)',
                fontWeight: highlight ? 600 : 400,
            }}
        >
            {value.toFixed(0)}ms
        </span>
    );
};
