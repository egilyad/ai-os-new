interface Props {
    data: Array<{ signal: string; value: number }>;
    height?: number;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    gridColor?: string;
    tickColor?: string;
    levels?: number;
}

export function RadarChart({
    data,
    height = 200,
    stroke = '#a855f7',
    fill = '#a855f7',
    fillOpacity = 0.2,
    gridColor = 'rgba(255,255,255,0.1)',
    tickColor = '#64748b',
    levels = 4,
}: Props) {
    if (data.length === 0) return null;
    const size = Math.min(280, height - 40);
    const cx = 150;
    const cy = height / 2;
    const r = size / 2;
    const angleStep = (2 * Math.PI) / data.length;

    const point = (i: number, radius: number) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    };

    const gridLines = [];
    for (let l = 1; l <= levels; l++) {
        const radius = (r / levels) * l;
        const pts = data.map((_, i) => point(i, radius));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        gridLines.push(
            <path key={`g-${l}`} d={d} fill="none" stroke={gridColor} strokeWidth={1} />,
        );
    }

    const dataPts = data.map((d, i) => point(i, d.value * r));
    const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    return (
        <svg width="100%" height={height} viewBox={`0 0 300 ${height}`}>
            {gridLines}
            {data.map((_, i) => {
                const p = point(i, r);
                return (
                    <line
                        key={`a-${i}`}
                        x1={cx}
                        y1={cy}
                        x2={p.x}
                        y2={p.y}
                        stroke={gridColor}
                        strokeWidth={1}
                    />
                );
            })}
            {data.map((d, i) => {
                const p = point(i, r + 16);
                return (
                    <text
                        key={`l-${i}`}
                        x={p.x}
                        y={p.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={tickColor}
                        fontSize={11}
                    >
                        {d.signal}
                    </text>
                );
            })}
            <path
                d={dataPath}
                fill={fill}
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeWidth={2}
            />
            {dataPts.map((p, i) => (
                <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={3} fill={stroke} />
            ))}
        </svg>
    );
}
