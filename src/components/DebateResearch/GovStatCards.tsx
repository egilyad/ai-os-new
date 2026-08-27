import { Shield, FileText, BarChart3 } from 'lucide-react';

interface Props {
    livePolicyCount: number;
    liveViolationCount: number;
    roleCount: number;
    scenarioCount: number;
}

const GovStatCards: React.FC<Props> = ({
    livePolicyCount,
    liveViolationCount,
    roleCount,
    scenarioCount,
}) => (
    <div
        style={{
            padding: '0.6rem 1.25rem',
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
    >
        <StatCard
            icon={<Shield size={14} color="#60a5fa" />}
            label="Policies"
            value={livePolicyCount}
            valueColor="#60a5fa"
            bg="rgba(59,130,246,0.08)"
            border="rgba(59,130,246,0.15)"
        />
        <StatCard
            icon={<FileText size={14} color="#f59e0b" />}
            label="Violations"
            value={liveViolationCount}
            valueColor="#f59e0b"
            bg="rgba(245,158,11,0.08)"
            border="rgba(245,158,11,0.15)"
        />
        <StatCard
            icon={<Shield size={14} color="#a855f7" />}
            label="Roles"
            value={roleCount}
            valueColor="#a855f7"
            bg="rgba(168,85,247,0.08)"
            border="rgba(168,85,247,0.15)"
        />
        <StatCard
            icon={<BarChart3 size={14} color="#10b981" />}
            label="Scenarios"
            value={scenarioCount}
            valueColor="#10b981"
            bg="rgba(16,185,129,0.08)"
            border="rgba(16,185,129,0.15)"
        />
    </div>
);

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor: string;
    bg: string;
    border: string;
}> = ({ icon, label, value, valueColor, bg, border }) => (
    <div
        style={{
            flex: 1,
            padding: '0.5rem 0.7rem',
            borderRadius: 8,
            background: bg,
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}
    >
        {icon}
        <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: valueColor }}>{value}</div>
        </div>
    </div>
);

export default GovStatCards;
