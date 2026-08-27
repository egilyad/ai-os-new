import React, { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { sectionPanelTitle } from '../../styles/common';
import type { MemoryEntry } from '../../types/memory';

interface ForgettingCurvePanelProps {
    memories: MemoryEntry[];
}

const CURVE_POINTS = 30;

function computeDecayCurve(memories: MemoryEntry[]): { day: number; retention: number }[] {
    const now = Date.now();
    const msPerDay = 86_400_000;
    const perDay: number[] = new Array(CURVE_POINTS).fill(0);
    for (const m of memories) {
        const age = Math.floor((now - m.metadata.timestamp) / msPerDay);
        if (age >= 0 && age < CURVE_POINTS) perDay[age]!++;
    }
    const curve: { day: number; retention: number }[] = [];
    let cumulative = 0;
    for (let d = 0; d < CURVE_POINTS; d++) {
        cumulative += perDay[d]!;
        const retention = Math.max(0, 1 - cumulative / (memories.length || 1));
        if (d % 3 === 0 || d === CURVE_POINTS - 1) curve.push({ day: d, retention });
    }
    return curve;
}

const ForgettingCurvePanel: React.FC<ForgettingCurvePanelProps> = ({ memories }) => {
    const curve = useMemo(() => computeDecayCurve(memories), [memories]);
    if (curve.length < 2) return null;

    const w = 240,
        h = 60,
        pad = 4;
    const maxRet = Math.max(...curve.map((c) => c.retention), 0.01);
    const pts = curve
        .map(
            (c, i) =>
                `${(i / (curve.length - 1)) * (w - pad * 2) + pad},${h - pad - (c.retention / maxRet) * (h - pad * 2)}`,
        )
        .join(' ');

    return (
        <div
            className="glass-panel"
            style={{
                padding: '1.5rem',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
                flex: 1,
            }}
        >
            <h3 style={sectionPanelTitle}>
                <TrendingDown size={18} color="#8b5cf6" aria-hidden="true" /> Forgetting Curve
            </h3>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                Memory retention over time (days)
            </div>
            <svg width={w} height={h} style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                    <linearGradient id="fc-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <polyline
                    fill="url(#fc-grad)"
                    points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`}
                />
                <polyline fill="none" stroke="#8b5cf6" strokeWidth={1.5} points={pts} />
                <circle
                    cx={w - pad}
                    cy={h - pad - (curve[curve.length - 1]!.retention / maxRet) * (h - pad * 2)}
                    r={2.5}
                    fill="#8b5cf6"
                />
            </svg>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.55rem',
                    color: 'var(--slate-500)',
                    marginTop: '0.25rem',
                }}
            >
                <span>Day 0</span>
                <span>
                    {Math.round(curve[curve.length - 1]!.retention * 100)}% retained at day{' '}
                    {curve[curve.length - 1]!.day}
                </span>
            </div>
        </div>
    );
};

export default ForgettingCurvePanel;
