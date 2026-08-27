
interface Props {
    passed: number;
    warned: number;
    blocked: number;
    total: number;
}

const GovSummaryBar: React.FC<Props> = ({ passed, warned, blocked, total }) => {
    if (total === 0) return null;

    return (
        <div
            style={{
                padding: '0.6rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}
        >
            <div style={{ display: 'flex', gap: 4, height: 24 }}>
                {passed > 0 && (
                    <BarSegment
                        count={passed}
                        total={total}
                        color="#10b981"
                        label="Pass"
                        textColor="#34d399"
                    />
                )}
                {warned > 0 && (
                    <BarSegment
                        count={warned}
                        total={total}
                        color="#f59e0b"
                        label="Warn"
                        textColor="#fbbf24"
                    />
                )}
                {blocked > 0 && (
                    <BarSegment
                        count={blocked}
                        total={total}
                        color="#ef4444"
                        label="Block"
                        textColor="#f87171"
                    />
                )}
            </div>
        </div>
    );
};

const BarSegment: React.FC<{
    count: number;
    total: number;
    color: string;
    label: string;
    textColor: string;
}> = ({ count, total, color, label, textColor }) => (
    <div
        style={{
            flex: count,
            background: `${color}25`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${color}30`,
        }}
    >
        <span style={{ fontSize: '0.6rem', color: textColor, fontWeight: 700 }}>
            {Math.round((count / total) * 100)}% {label}
        </span>
    </div>
);

export default GovSummaryBar;
