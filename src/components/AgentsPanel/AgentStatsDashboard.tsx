import { useNow } from '../../hooks/useNow';
import { BarChart3, TrendingUp, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';

interface AgentStatsDashboardProps {
    agentStats: Record<
        string,
        {
            calls: number;
            tokens: number;
            latency: number;
            errors?: number;
            avgTokensPerCall?: number;
            lastActive?: number;
            estimatedCost?: number;
        }
    >;
    agents: Array<{
        id: string;
        name: string;
        role: string;
        stats: {
            calls: number;
            tokens: number;
            latency: number;
            errors?: number;
            avgTokensPerCall?: number;
            lastActive?: number;
            estimatedCost?: number;
        };
    }>;
}

const MiniBar: React.FC<{ value: number; max: number; color: string; height?: number }> = ({
    value,
    max,
    color,
    height = 4,
}) => {
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

const DonutChart: React.FC<{
    segments: Array<{ label: string; value: number; color: string }>;
    size?: number;
}> = ({ segments, size = 100 }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const r = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const cumulativeOffsets = segments.map((_, i) =>
        segments.slice(0, i).reduce((a, s) => a + (s.value / total) * circumference, 0),
    );

    return (
        <svg width={size} height={size} style={{ display: 'block' }}>
            {segments.map((seg, i) => {
                const pct = seg.value / total;
                const dash = pct * circumference;
                const dashOffset = -cumulativeOffsets[i]!;
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
                total
            </text>
        </svg>
    );
};

export const AgentStatsDashboard: React.FC<AgentStatsDashboardProps> = ({ agentStats, agents }) => {
    useTranslation();

    const totalCalls = Object.values(agentStats).reduce((s, a) => s + a.calls, 0);
    const totalTokens = Object.values(agentStats).reduce((s, a) => s + a.tokens, 0);
    const totalErrors = Object.values(agentStats).reduce((s, a) => s + (a.errors || 0), 0);
    const avgLatency =
        agents.length > 0
            ? Math.round(agents.reduce((s, a) => s + a.stats.latency, 0) / agents.length)
            : 0;
    const successRate =
        totalCalls > 0 ? Math.round(((totalCalls - totalErrors) / totalCalls) * 100) : -1;

    const maxCalls = Math.max(...agents.map((a) => a.stats.calls), 1);
    const maxTokens = Math.max(...agents.map((a) => a.stats.tokens), 1);

    const now = useNow(30_000);
    const RECENT_THRESHOLD_MS = 30 * 60 * 1000;
    const statusSegments = [
        {
            label: 'Active',
            value: agents.filter((a) => (a.stats.lastActive ?? 0) > now - RECENT_THRESHOLD_MS)
                .length,
            color: 'var(--success)',
        },
        {
            label: 'Idle',
            value: agents.filter((a) => (a.stats.lastActive ?? 0) <= now - RECENT_THRESHOLD_MS)
                .length,
            color: 'var(--slate-500)',
        },
    ];

    const topAgents = agents
        .slice()
        .sort((a, b) => b.stats.calls - a.stats.calls)
        .slice(0, 8);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color="#3b82f6" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-200)' }}>
                    Agent Statistics Dashboard
                </span>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                    {
                        label: 'Total Calls',
                        value: totalCalls.toLocaleString(),
                        icon: <Zap size={16} />,
                        color: 'var(--accent)',
                    },
                    {
                        label: 'Total Tokens',
                        value:
                            totalTokens > 1000
                                ? `${(totalTokens / 1000).toFixed(1)}K`
                                : totalTokens.toLocaleString(),
                        icon: <Activity size={16} />,
                        color: 'var(--purple)',
                    },
                    {
                        label: 'Avg Latency',
                        value: `${avgLatency}ms`,
                        icon: <TrendingUp size={16} />,
                        color: 'var(--warning)',
                    },
                    {
                        label: 'Success Rate',
                        value: successRate >= 0 ? `${successRate}%` : '--',
                        icon: <BarChart3 size={16} />,
                        color:
                            successRate >= 0
                                ? successRate > 90
                                    ? '#10b981'
                                    : successRate > 70
                                      ? '#f59e0b'
                                      : '#ef4444'
                                : '#64748b',
                    },
                ].map((card, _i) => (
                    <div
                        key={card.label}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 10,
                            padding: '0.75rem',
                            border: `1px solid ${card.color}22`,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 6,
                                color: card.color,
                            }}
                        >
                            {card.icon}
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {card.label}
                            </span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-200)' }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                {/* Bar Chart: Calls per Agent */}
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
                        Calls per Agent
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {topAgents.map((a) => (
                            <div
                                key={a.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-400)',
                                        width: 80,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {a.name}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <MiniBar value={a.stats.calls} max={maxCalls} color="#3b82f6" />
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        width: 36,
                                        textAlign: 'right',
                                    }}
                                >
                                    {a.stats.calls}
                                </span>
                            </div>
                        ))}
                        {topAgents.length === 0 && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                    textAlign: 'center',
                                    padding: '1rem',
                                }}
                            >
                                No agent data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Donut Chart: Active vs Idle */}
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
                        Agent Activity
                    </div>
                    <DonutChart segments={statusSegments} size={90} />
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        {statusSegments.map((seg) => (
                            <div
                                key={seg.label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '0.65rem',
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

            {/* Tokens per Agent */}
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
                    Tokens per Agent
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {topAgents.map((a) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    width: 80,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {a.name}
                            </span>
                            <div style={{ flex: 1 }}>
                                <MiniBar value={a.stats.tokens} max={maxTokens} color="#8b5cf6" />
                            </div>
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-500)',
                                    width: 48,
                                    textAlign: 'right',
                                }}
                            >
                                {a.stats.tokens > 1000
                                    ? `${(a.stats.tokens / 1000).toFixed(1)}K`
                                    : a.stats.tokens}
                            </span>
                        </div>
                    ))}
                    {topAgents.length === 0 && (
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-500)',
                                textAlign: 'center',
                                padding: '1rem',
                            }}
                        >
                            No agent data yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentStatsDashboard;
