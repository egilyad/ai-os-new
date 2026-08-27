import { useState } from 'react';

interface Props {
    data: Record<string, string | number>[];
    dataKey: string;
    xKey: string;
    color?: string;
    height?: number;
    barRadius?: number;
    tickColor?: string;
}

export function BarChart({
    data,
    dataKey,
    xKey,
    color = '#3b82f6',
    height = 180,
    barRadius = 3,
    tickColor = '#64748b',
}: Props) {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const values = data.map((d) => Number(d[dataKey]) || 0);
    const max = Math.max(...values, 1);
    const barWidth = Math.max(4, Math.min(32, data.length > 0 ? 200 / data.length : 20));
    const gap = Math.max(2, barWidth * 0.3);
    const totalWidth = data.length * (barWidth + gap);
    const w = Math.max(totalWidth, 300);
    const padding = { top: 8, right: 8, bottom: 24, left: 4 };
    const plotH = height - padding.top - padding.bottom;

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
                {data.map((d, i) => {
                    const v = values[i]!;
                    const barH = (v / max) * plotH;
                    const x = i * (barWidth + gap);
                    const y = padding.top + plotH - barH;
                    const isHover = hoverIdx === i;
                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(barH, 1)}
                                fill={isHover ? '#60a5fa' : color}
                                rx={barRadius}
                                style={{ transition: 'fill 0.15s', cursor: 'pointer' }}
                                onMouseEnter={() => setHoverIdx(i)}
                                onMouseLeave={() => setHoverIdx(null)}
                            />
                            {i % Math.max(1, Math.floor(data.length / 8)) === 0 && (
                                <text
                                    x={x + barWidth / 2}
                                    y={height - 4}
                                    textAnchor="middle"
                                    fill={tickColor}
                                    fontSize={10}
                                >
                                    {String(d[xKey])}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
