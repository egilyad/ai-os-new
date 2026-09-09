import { Activity } from 'lucide-react';

interface Props {
    label: string;
    value: string | number;
    unit: string;
    color: string;
}

const LiveStatCard: React.FC<Props> = ({ label, value, unit, color }) => (
    <div
        style={{
            padding: '1rem',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}
        aria-label={`${label}: ${value} ${unit}`}
    >
        <div>
            <div
                style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.2rem',
                }}
            >
                {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{value}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>
            </div>
        </div>
        <div style={{ padding: '0.5rem', background: `${color}11`, borderRadius: 8 }}>
            <Activity size={16} color={color} aria-hidden="true" />
        </div>
    </div>
);

export default LiveStatCard;
