import { flexBetween } from '../../styles/common';

interface HealthStatCardProps {
    label: string;
    value: string | number;
    color: string;
    icon: React.ReactNode;
}

export const HealthStatCard: React.FC<HealthStatCardProps> = ({ label, value, color, icon }) => (
    <div
        style={{
            padding: '1.25rem',
            borderRadius: 16,
            border: `1px solid ${color}20`,
            background: `linear-gradient(145deg, ${color}05 0%, rgba(0,0,0,0.2) 100%)`,
            backdropFilter: 'blur(10px)',
        }}
    >
        <div style={flexBetween}>
            <div
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--slate-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </div>
            <div style={{ color }}>{icon}</div>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-50)', marginTop: '0.5rem' }}>
            {value}
        </div>
    </div>
);
