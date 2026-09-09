
export const ScoreRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
        <span style={{ color: 'var(--slate-400)', minWidth: 60 }}>{label}</span>
        <div
            style={{
                flex: 1,
                height: 4,
                background: 'var(--border-default)',
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: `${value * 100}%`,
                    background: value > 0.7 ? '#10b981' : value > 0.4 ? '#f59e0b' : '#ef4444',
                }}
            />
        </div>
        <span style={{ color: 'var(--slate-300)', minWidth: 30, textAlign: 'right' }}>
            {(value * 100).toFixed(0)}%
        </span>
    </div>
);
