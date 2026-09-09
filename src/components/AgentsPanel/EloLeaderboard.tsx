import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { eloService } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import type { AgentElo } from '../../kernel/services/elo/elo-service';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];

const EloTrend: React.FC<{ history: AgentElo['history'] }> = ({ history }) => {
    if (history.length < 2) return <Minus size={14} color="#64748b" />;
    const last = history[history.length - 1]!.elo;
    const prev = history[history.length - 2]!.elo;
    if (last > prev) return <TrendingUp size={14} color="#10b981" />;
    if (last < prev) return <TrendingDown size={14} color="#ef4444" />;
    return <Minus size={14} color="#64748b" />;
};

const MiniLineChart: React.FC<{ data: number[]; width?: number; height?: number }> = ({
    data,
    width = 200,
    height = 50,
}) => {
    if (data.length < 2)
        return (
            <div
                style={{
                    width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: 'var(--slate-500)',
                }}
            >
                No data
            </div>
        );
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - 4 - ((v - min) / range) * (height - 8);
            return `${x},${y}`;
        })
        .join(' ');
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <polygon fill="rgba(59,130,246,0.1)" points={areaPoints} />
            <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" points={points} />
            {data.length > 0 &&
                (() => {
                    const lastX = width;
                    const lastY =
                        height - 4 - ((data[data.length - 1]! - min) / range) * (height - 8);
                    return <circle cx={lastX} cy={lastY} r="3" fill="#3b82f6" />;
                })()}
        </svg>
    );
};

export const EloLeaderboard: React.FC = () => {
    const [entries, setEntries] = useState<AgentElo[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            await eloService.init();
            setEntries(eloService.getLeaderboard());
        };
        void load();

        // RO-6: Subscribe to ELO updates to refresh leaderboard
        const unsub = eventBus.on(EVENTS.ELO_RATING_UPDATED, () => {
            setEntries(eloService.getLeaderboard());
        });
        return () => {
            unsub();
        };
    }, []);

    const expandedHistory = useMemo(() => {
        if (!expandedId) return [];
        return eloService.getHistory(expandedId).slice(-20);
    }, [expandedId]);

    const chartData = useMemo(
        () => expandedHistory.map((h: { elo: number }) => h.elo),
        [expandedHistory],
    );

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.01)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '1.25rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <Trophy size={18} color="#f59e0b" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                    ELO Leaderboard
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginLeft: 'auto' }}>
                    {entries.length} agents ranked
                </span>
            </div>

            {entries.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.85rem',
                    }}
                >
                    No ELO scores yet. Complete debates to rank agents.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Header */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '36px 1fr 70px 80px 60px 24px',
                            gap: 8,
                            padding: '0 12px 6px',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        <span>#</span>
                        <span>Agent</span>
                        <span style={{ textAlign: 'right' }}>ELO</span>
                        <span style={{ textAlign: 'center' }}>W / L / D</span>
                        <span style={{ textAlign: 'right' }}>Matches</span>
                        <span />
                    </div>

                    {entries.map((entry, idx) => {
                        const isTop3 = idx < 3;
                        const isExpanded = expandedId === entry.agentId;
                        const identity = resolveAgentIdentity(entry.agentId);
                        return (
                            <React.Fragment key={entry.agentId}>
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : entry.agentId)}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '36px 1fr 70px 80px 60px 24px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        background: isTop3
                                            ? `${MEDAL_COLORS[idx]}08`
                                            : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isTop3 ? `${MEDAL_COLORS[idx]}20` : 'rgba(255,255,255,0.03)'}`,
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: isTop3 ? MEDAL_COLORS[idx] : '#64748b',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {isTop3 ? `🏆` : idx + 1}
                                    </span>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            minWidth: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: isTop3
                                                    ? `linear-gradient(135deg, ${MEDAL_COLORS[idx]}40, ${MEDAL_COLORS[idx]}15)`
                                                    : 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                color: isTop3 ? MEDAL_COLORS[idx] : '#94a3b8',
                                                border: `1px solid ${isTop3 ? `${MEDAL_COLORS[idx]}30` : 'rgba(255,255,255,0.08)'}`,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {identity.avatar.emoji}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {identity.displayName}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                color: isTop3 ? MEDAL_COLORS[idx] : '#f8fafc',
                                            }}
                                        >
                                            {entry.elo}
                                        </span>
                                        <EloTrend history={entry.history} />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                            textAlign: 'center',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        <span style={{ color: 'var(--success)' }}>{entry.wins}</span>
                                        <span style={{ color: 'var(--slate-600)' }}> / </span>
                                        <span style={{ color: 'var(--error)' }}>{entry.losses}</span>
                                        <span style={{ color: 'var(--slate-600)' }}> / </span>
                                        <span style={{ color: 'var(--warning)' }}>{entry.draws}</span>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {entry.matches}
                                    </span>
                                    <span
                                        style={{
                                            color: 'var(--slate-500)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isExpanded ? (
                                            <ChevronUp size={14} />
                                        ) : (
                                            <ChevronDown size={14} />
                                        )}
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            background: 'rgba(0,0,0,0.15)',
                                            borderRadius: 8,
                                            margin: '0 4px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'var(--slate-400)',
                                                marginBottom: 8,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            ELO History (last {chartData.length} matches)
                                        </div>
                                        <MiniLineChart data={chartData} width={360} height={60} />
                                        {expandedHistory.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 12,
                                                    marginTop: 8,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                {expandedHistory.slice(-6).map((h, i: number) => (
                                                    <div
                                                        key={h.timestamp ?? i}
                                                        style={{
                                                            fontSize: '0.6rem',
                                                            color: 'var(--slate-500)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: '50%',
                                                                background:
                                                                    h.result === 'win'
                                                                        ? '#10b981'
                                                                        : h.result === 'loss'
                                                                          ? '#ef4444'
                                                                          : '#f59e0b',
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                color:
                                                                    h.result === 'win'
                                                                        ? '#10b981'
                                                                        : h.result === 'loss'
                                                                          ? '#ef4444'
                                                                          : '#f59e0b',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {h.elo}
                                                        </span>
                                                        {h.opponent && (
                                                            <span style={{ color: 'var(--slate-600)' }}>
                                                                vs {h.opponent.slice(0, 8)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EloLeaderboard;
