
interface Props {
    totalSessions: number;
    totalArguments: number;
    completedWithConclusion: number;
    avgConfidence: number;
}

const DebateMemoryStats: React.FC<Props> = ({
    totalSessions,
    totalArguments,
    completedWithConclusion,
    avgConfidence,
}) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '1rem',
        }}
    >
        <StatBox value={totalSessions} label="Sessions" color="#a855f7" />
        <StatBox value={totalArguments} label="Arguments" color="#3b82f6" />
        <StatBox value={completedWithConclusion} label="Completed" color="#10b981" />
        <StatBox
            value={`${Math.round(avgConfidence * 100)}%`}
            label="Avg Confidence"
            color="#f59e0b"
        />
    </div>
);

const StatBox: React.FC<{ value: string | number; label: string; color: string }> = ({
    value,
    label,
    color,
}) => (
    <div
        style={{
            textAlign: 'center',
            padding: '0.5rem',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
        }}
    >
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
);

export default DebateMemoryStats;
