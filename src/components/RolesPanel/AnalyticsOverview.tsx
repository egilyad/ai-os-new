import React from 'react';
import { Zap, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SummaryData, TopRole, CategorySegment } from './analytics-utils';

interface MiniBarProps {
    value: number;
    max: number;
    color: string;
    height?: number;
}

const MiniBar: React.FC<MiniBarProps> = ({ value, max, color, height = 4 }) => {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div
            style={{
                height,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                overflow: 'hidden',
                width: '100%',
            }}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%', background: color, borderRadius: 2 }}
            />
        </div>
    );
};

interface DonutChartProps {
    segments: CategorySegment[];
    size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ segments, size = 90 }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const r = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg width={size} height={size} style={{ display: 'block' }}>
            {segments.map((seg) => {
                const pct = seg.value / total;
                const dash = pct * circumference;
                const dashOffset = -offset;
                offset += dash;
                return (
                    <circle
                        key={seg.color}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="6"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                    />
                );
            })}
            <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="16"
                fontWeight="700"
            >
                {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="9">
                roles
            </text>
        </svg>
    );
};

interface AnalyticsOverviewProps {
    summary: SummaryData;
    topRoles: TopRole[];
    categorySegments: CategorySegment[];
}

export { MiniBar, DonutChart };

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
    summary,
    topRoles,
    categorySegments,
}) => {
    const maxInvocations = Math.max(...topRoles.map((r) => r.invocations), 1);

    return (
        <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                    {
                        label: 'Total Invocations',
                        value: summary.totalInvocations.toLocaleString(),
                        icon: <Zap size={14} />,
                        color: 'var(--accent)',
                    },
                    {
                        label: 'Success Rate',
                        value: `${summary.successRate}%`,
                        icon: <Activity size={14} />,
                        color: summary.successRate > 90 ? '#10b981' : '#f59e0b',
                    },
                    {
                        label: 'Avg Latency',
                        value: `${summary.avgLatency}ms`,
                        icon: <BarChart3 size={14} />,
                        color: summary.avgLatency < 500 ? '#10b981' : '#f59e0b',
                    },
                    {
                        label: 'Total Errors',
                        value: summary.totalErrors.toString(),
                        icon: <AlertTriangle size={14} />,
                        color: summary.totalErrors > 0 ? '#ef4444' : '#10b981',
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 10,
                            padding: '0.6rem 0.75rem',
                            border: `1px solid ${card.color}22`,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                marginBottom: 4,
                                color: card.color,
                            }}
                        >
                            {card.icon}
                            <span
                                style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {card.label}
                            </span>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-200)' }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 10,
                        padding: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--slate-400)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Invocations per Role
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {topRoles.map((r) => (
                            <div
                                key={r.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        width: 90,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {r.name}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <MiniBar
                                        value={r.invocations}
                                        max={maxInvocations}
                                        color="#3b82f6"
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        width: 36,
                                        textAlign: 'right',
                                    }}
                                >
                                    {r.invocations}
                                </span>
                            </div>
                        ))}
                        {topRoles.length === 0 && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                    textAlign: 'center',
                                    padding: '1rem',
                                }}
                            >
                                No role usage data yet
                            </div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 10,
                        padding: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--slate-400)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        By Category
                    </div>
                    <DonutChart segments={categorySegments} size={80} />
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginTop: 8,
                            justifyContent: 'center',
                        }}
                    >
                        {categorySegments.map((seg) => (
                            <div
                                key={seg.label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-400)',
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 2,
                                        background: seg.color,
                                    }}
                                />
                                {seg.label}: {seg.value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalyticsOverview;
