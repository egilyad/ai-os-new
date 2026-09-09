import React from 'react';

interface Props {
    data: number[];
    emptyLabel?: string;
}

const SparklineChart: React.FC<Props> = ({ data, emptyLabel = 'Insufficient data' }) => {
    if (data.length < 2)
        return (
            <div
                style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                }}
            >
                {emptyLabel}
            </div>
        );
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
        .join(' ');
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 40 }}>
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
        </svg>
    );
};

export const SparklineMemo = React.memo(SparklineChart);
export default SparklineChart;
