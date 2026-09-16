import { useState } from 'react';

interface DonutData {
    name: string;
    value: number;
    color: string;
}

interface Props {
    data: DonutData[];
    width?: number;
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    formatter?: (value: number, name: string) => [string, string];
}

export function DonutChart({
    data,
    width = 200,
    height = 160,
    innerRadius = 40,
    outerRadius = 65,
    formatter,
}: Props) {
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;
    const cx = width / 2;
    const cy = height / 2;
    const mid = (innerRadius + outerRadius) / 2;
    const circumference = 2 * Math.PI * mid;

    const ratios = data.map((d) => d.value / total);
    const cumulativeOffsets: number[] = [];
    let running = 0;
    for (const r of ratios) {
        cumulativeOffsets.push(running);
        running += r * circumference;
    }

    const segments = data.map((d, i) => {
        const ratio = ratios[i]!;
        const length = ratio * circumference;
        const offset = cumulativeOffsets[i]!;
        const gap = 3;
        return (
            <circle
                key={i}
                cx={cx}
                cy={cy}
                r={mid}
                fill="none"
                stroke={d.color}
                strokeWidth={outerRadius - innerRadius}
                strokeDasharray={`${length - gap} ${circumference - length + gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{
                    cursor: 'pointer',
                    opacity: activeIdx === null || activeIdx === i ? 1 : 0.4,
                }}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
            />
        );
    });

    const active = activeIdx !== null ? data[activeIdx] : null;

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: width }}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                {segments}
                <circle cx={cx} cy={cy} r={innerRadius} fill="transparent" />
            </svg>
            {active && formatter && (
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: 'var(--slate-800)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.75rem',
                        color: 'var(--slate-400)',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatter(active.value, active.name).join(' — ')}
                </div>
            )}
        </div>
    );
}
