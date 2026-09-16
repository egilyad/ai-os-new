
interface Props {
    agentsCount: number;
    avgWords: number;
    withToolsCount: number;
    withKeyTerms: number;
    avgTemp: number;
}

const AuditStatCards: React.FC<Props> = ({
    agentsCount,
    avgWords,
    withToolsCount,
    withKeyTerms,
    avgTemp,
}) => (
    <div
        style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
    >
        <Card
            label="Agents"
            value={agentsCount}
            color="#60a5fa"
            bg="rgba(59,130,246,0.1)"
            border="rgba(59,130,246,0.2)"
        />
        <Card
            label="Avg words"
            value={avgWords}
            color="#f59e0b"
            bg="rgba(245,158,11,0.1)"
            border="rgba(245,158,11,0.2)"
        />
        <Card
            label="With tools"
            value={withToolsCount}
            color="#10b981"
            bg="rgba(16,185,129,0.1)"
            border="rgba(16,185,129,0.2)"
        />
        <Card
            label="Constraints"
            value={withKeyTerms}
            color="#ef4444"
            bg="rgba(239,68,68,0.1)"
            border="rgba(239,68,68,0.2)"
        />
        <Card
            label="Avg temp"
            value={avgTemp.toFixed(2)}
            color="#a855f7"
            bg="rgba(168,85,247,0.1)"
            border="rgba(168,85,247,0.2)"
        />
    </div>
);

const Card: React.FC<{
    label: string;
    value: string | number;
    color: string;
    bg: string;
    border: string;
}> = ({ label, value, color, bg, border }) => (
    <div
        style={{
            padding: '0.5rem 0.85rem',
            borderRadius: 8,
            background: bg,
            border: `1px solid ${border}`,
            minWidth: 80,
        }}
    >
        <div style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>{label}</div>
    </div>
);

export default AuditStatCards;
