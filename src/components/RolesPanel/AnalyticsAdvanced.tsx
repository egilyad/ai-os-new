import React from 'react';
import { Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { MiniBar } from './AnalyticsOverview';
import type {
    ToolUsage,
    TempCorrelation,
    HeatmapRow,
    TopRole,
    FatigueAlert,
} from './analytics-utils';

interface AnalyticsAdvancedProps {
    toolUsage: ToolUsage[];
    tempCorrelation: TempCorrelation[];
    heatmapData: HeatmapRow[];
    topRoles: TopRole[];
    fatigueAlerts: FatigueAlert[];
}

const AnalyticsAdvanced: React.FC<AnalyticsAdvancedProps> = ({
    toolUsage,
    tempCorrelation,
    heatmapData,
    topRoles,
    fatigueAlerts,
}) => {
    const maxToolUsage = Math.max(...toolUsage.map((t) => t.count), 1);

    return (
        <>
            {/* Tool Usage + Temperature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Per-tool usage */}
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
                        Tool Usage
                    </div>
                    {toolUsage.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {toolUsage.map((t) => (
                                <div
                                    key={t.tool}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-400)',
                                            width: 80,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t.tool}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <MiniBar
                                            value={t.count}
                                            max={maxToolUsage}
                                            color="#a855f7"
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '0.6rem',
                                            color: 'var(--slate-500)',
                                            width: 30,
                                            textAlign: 'right',
                                        }}
                                    >
                                        {t.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-500)',
                                textAlign: 'center',
                                padding: '1rem',
                            }}
                        >
                            No tool usage data yet
                        </div>
                    )}
                </div>

                {/* Temperature-vs-success */}
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
                        Temp vs Success Rate
                    </div>
                    {tempCorrelation.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {tempCorrelation.map((t) => (
                                <div key={t.label}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-400)',
                                            marginBottom: 3,
                                        }}
                                    >
                                        <span style={{ textTransform: 'capitalize' }}>
                                            {t.label} ({t.total}x)
                                        </span>
                                        <span
                                            style={{
                                                color:
                                                    t.rate > 80
                                                        ? '#10b981'
                                                        : t.rate > 60
                                                          ? '#f59e0b'
                                                          : '#ef4444',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {t.rate}%
                                        </span>
                                    </div>
                                    <MiniBar
                                        value={t.rate}
                                        max={100}
                                        color={
                                            t.rate > 80
                                                ? '#10b981'
                                                : t.rate > 60
                                                  ? '#f59e0b'
                                                  : '#ef4444'
                                        }
                                        height={6}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-500)',
                                textAlign: 'center',
                                padding: '1rem',
                            }}
                        >
                            No temperature data yet
                        </div>
                    )}
                </div>
            </div>

            {/* Heatmap + ELO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Hourly Heatmap */}
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: '0.5rem',
                        }}
                    >
                        <Clock size={14} color="#f59e0b" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'var(--slate-400)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Hourly Activity (top 5)
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {heatmapData.map((row) => (
                            <div
                                key={row.roleId}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.55rem',
                                        color: 'var(--slate-400)',
                                        width: 70,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {row.roleName}
                                </span>
                                <div style={{ display: 'flex', gap: 1, flex: 1 }}>
                                    {row.hours.map((val, h) => {
                                        const intensity = val / row.max;
                                        return (
                                            <div
                                                key={h}
                                                style={{
                                                    flex: 1,
                                                    height: 10,
                                                    borderRadius: 1,
                                                    background:
                                                        val > 0
                                                            ? `rgba(245,158,11,${0.2 + intensity * 0.8})`
                                                            : 'rgba(255,255,255,0.03)',
                                                    transition: 'background 0.2s',
                                                }}
                                                title={`${row.roleName} at ${h}:00 — ${val} calls`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div
                        style={{
                            fontSize: '0.55rem',
                            color: 'var(--slate-500)',
                            marginTop: 4,
                            textAlign: 'center',
                        }}
                    >
                        {Array.from({ length: 6 }, (_, i) => (
                            <span key={i} style={{ display: 'inline-block', width: `${100 / 6}%` }}>
                                {i * 4}:00
                            </span>
                        ))}
                    </div>
                </div>

                {/* ELO Leaderboard */}
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: '0.5rem',
                        }}
                    >
                        <TrendingUp size={14} color="#10b981" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'var(--slate-400)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            ELO Leaderboard
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {topRoles.slice(0, 8).map((r, i) => (
                            <div
                                key={r.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        color: i < 3 ? '#f59e0b' : '#64748b',
                                        fontWeight: 800,
                                        width: 16,
                                    }}
                                >
                                    #{i + 1}
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-400)',
                                        width: 80,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {r.name}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <MiniBar
                                        value={r.eloScore}
                                        max={1000}
                                        color={i < 3 ? '#f59e0b' : '#3b82f6'}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--slate-200)',
                                        fontWeight: 700,
                                        width: 32,
                                        textAlign: 'right',
                                    }}
                                >
                                    {r.eloScore}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fatigue Alerts */}
            {fatigueAlerts.length > 0 && (
                <div
                    style={{
                        background: 'rgba(239,68,68,0.05)',
                        borderRadius: 10,
                        padding: '0.75rem',
                        border: '1px solid rgba(239,68,68,0.15)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: '0.5rem',
                        }}
                    >
                        <TrendingDown size={14} color="#ef4444" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'var(--error)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Role Fatigue Detected ({fatigueAlerts.length})
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {fatigueAlerts.slice(0, 5).map((f) => (
                            <div
                                key={f.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '0.4rem 0.5rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 8,
                                }}
                            >
                                <AlertTriangle
                                    size={12}
                                    color={f.status === 'critical' ? '#ef4444' : '#f59e0b'}
                                />
                                <span style={{ fontSize: '0.7rem', color: 'var(--slate-200)', flex: 1 }}>
                                    {f.name}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                    {f.overallRate}% → {f.recentRate}%
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: f.status === 'critical' ? '#ef4444' : '#f59e0b',
                                        background:
                                            f.status === 'critical'
                                                ? 'rgba(239,68,68,0.2)'
                                                : 'rgba(245,158,11,0.2)',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: 4,
                                    }}
                                >
                                    {f.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default AnalyticsAdvanced;
