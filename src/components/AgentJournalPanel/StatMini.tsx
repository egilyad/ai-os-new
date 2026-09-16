import { textMutedXs, textWhiteXs } from '../../styles/common';

export const StatMini: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}> = ({ icon, label, value, color }) => (
    <div
        style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            border: `1px solid ${color}20`,
            background: `linear-gradient(145deg, ${color}05, rgba(0,0,0,0.2))`,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            {icon}
            <span style={{ ...textMutedXs, fontSize: '0.65rem' }}>{label}</span>
        </div>
        <div style={{ ...textWhiteXs, fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
    </div>
);
