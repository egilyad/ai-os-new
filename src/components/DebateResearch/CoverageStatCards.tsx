import { scoreColor } from './obs-gaps-constants';

interface Props {
    overall: number;
    gaps: number;
    total: number;
}

const CoverageStatCards: React.FC<Props> = ({ overall, gaps, total }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.6rem',
            marginBottom: '1rem',
        }}
    >
        <StatCard
            value={`${overall}%`}
            label="Overall"
            valueColor={scoreColor(overall)}
            bg="rgba(6,182,212,0.08)"
            border="rgba(6,182,212,0.15)"
        />
        <StatCard
            value={gaps}
            label="Services w/ gaps"
            valueColor="#f59e0b"
            bg="rgba(245,158,11,0.08)"
            border="rgba(245,158,11,0.15)"
        />
        <StatCard
            value={total}
            label="Total services"
            valueColor="#94a3b8"
            bg="rgba(100,116,139,0.08)"
            border="rgba(100,116,139,0.15)"
        />
    </div>
);

const StatCard: React.FC<{
    value: string | number;
    label: string;
    valueColor: string;
    bg: string;
    border: string;
}> = ({ value, label, valueColor, bg, border }) => (
    <div
        style={{
            padding: '0.75rem',
            borderRadius: 10,
            background: bg,
            border: `1px solid ${border}`,
            textAlign: 'center',
        }}
    >
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: valueColor }}>{value}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>{label}</div>
    </div>
);

export default CoverageStatCards;
