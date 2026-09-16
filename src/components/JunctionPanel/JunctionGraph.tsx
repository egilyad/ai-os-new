import React from 'react';
import type { Junction, JunctionSource } from '../../kernel/types/junction-types';

interface Props {
    junction: Junction;
    width?: number;
    height?: number;
}

const TYPE_COLORS: Record<string, string> = {
    structural_analogy: '#8b5cf6',
    contradiction: '#ef4444',
    abstraction: '#10b981',
    pattern_completion: '#f59e0b',
};

/**
 * JunctionGraph — visualizes the bridge between domains: source nodes on the
 * left/right connected through a central junction node.
 */
const JunctionGraph: React.FC<Props> = ({ junction, width = 320, height = 140 }) => {
    const color = TYPE_COLORS[junction.synthesisType] ?? '#64748b';
    const inputs = junction.inputs.slice(0, 2);
    const cx = width / 2;
    const cy = height / 2;

    const renderSource = (src: JunctionSource, x: number, index: number) => {
        const y = cy + (index === 0 ? -34 : 34);
        return (
            <g key={src.id}>
                <circle cx={x} cy={y} r={16} fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="#cbd5e1">
                    {src.domain}
                </text>
                <line
                    x1={x}
                    y1={y + (index === 0 ? 16 : -16)}
                    x2={cx}
                    y2={cy}
                    stroke={color}
                    strokeWidth={1.6}
                />
            </g>
        );
    };

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <circle cx={cx} cy={cy} r={22} fill={`${color}26`} stroke={color} strokeWidth={2} />
            <text x={cx} y={cy + 3} textAnchor="middle" fontSize="10" fill={color} fontWeight={700}>
                J
            </text>
            {inputs.map((s, i) => renderSource(s, i === 0 ? 44 : width - 44, i))}
            <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                fontSize="8"
                fill="#64748b"
                letterSpacing={1}
            >
                {Math.round(junction.confidence * 100)}% · {junction.status}
            </text>
        </svg>
    );
};

export default JunctionGraph;
