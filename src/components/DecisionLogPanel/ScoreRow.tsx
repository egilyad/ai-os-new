
// Missing scores render as an empty bar + em-dash, never NaN%.
export const ScoreRow: React.FC<{ label: string; value: number | undefined }> = ({
    label,
    value,
}) => {
    const v = typeof value === 'number' && Number.isFinite(value) ? value : null;
    return (
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
                        width: `${(v ?? 0) * 100}%`,
                        background: v === null ? 'transparent' : v > 0.7 ? '#10b981' : v > 0.4 ? '#f59e0b' : '#ef4444',
                    }}
                />
            </div>
            <span style={{ color: 'var(--slate-300)', minWidth: 30, textAlign: 'right' }}>
                {v === null ? '—' : `${(v * 100).toFixed(0)}%`}
            </span>
        </div>
    );
};
