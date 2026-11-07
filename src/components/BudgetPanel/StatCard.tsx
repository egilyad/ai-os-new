
export const StatCard: React.FC<{ label: string; value: string; color: string }> = ({
    label,
    value,
    color,
}) => (
    <div
        style={{
            padding: '1rem',
            borderRadius: 10,
            background: 'var(--bg-main)',
            textAlign: 'center',
        }}
    >
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '0.25rem' }}>
            {label}
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
    </div>
);
