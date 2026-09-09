import { CARD } from './shadow-constants';

interface Props {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub: string;
    borderColor?: string;
    valueColor?: string;
}

const ShadowStatCard: React.FC<Props> = ({ icon, label, value, sub, borderColor, valueColor }) => (
    <div style={{ ...CARD, ...(borderColor ? { borderLeft: `3px solid ${borderColor}` } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {icon}
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{label}</span>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: valueColor || '#e2e8f0' }}>
            {value}
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>/100</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>{sub}</div>
    </div>
);

export default ShadowStatCard;
