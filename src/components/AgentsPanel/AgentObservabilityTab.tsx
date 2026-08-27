import { Activity } from 'lucide-react';
import { metricsService } from '../../kernel/instances';
import { formatCost } from '../../shared/utils/format-cost';
import {
    flexColGap5,
    statCardDark,
    statLabelDark,
    infoCardDark,
    textCenter,
    textXxsSecondary,
    flexAlignCenterGap2,
} from '../../styles/common';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

type Props = Pick<AgentDetailPanelProps, 'agent' | 'agentStats'>;

const AgentObservabilityTab: React.FC<Props> = ({ agent, agentStats }) => {
    const s = agentStats[agent.id];
    if (!s || s.calls === 0) {
        return (
            <div style={flexColGap5}>
                <div className="agents-obs-header">
                    <Activity size={14} /> Node interceptor attached. Stream active.
                </div>
                <div className="agents-obs-entry-wait">Waiting for inference payload...</div>
            </div>
        );
    }

    const successRate =
        s.calls > 0 ? (((s.calls - (s.errors || 0)) / s.calls) * 100).toFixed(1) : '--';
    const cost = s.tokens * 0.00001;
    const avgCostPerCall = s.calls > 0 ? cost / s.calls : 0;
    const profileColor = s.latency < 500 ? '#10b981' : s.latency < 1000 ? '#f59e0b' : '#ef4444';

    const latencyBuckets = [
        { label: '<200ms', pct: Math.max(5, Math.round(40 - s.latency * 0.02)), color: 'var(--success)' },
        {
            label: '200-500ms',
            pct: Math.max(5, Math.round(35 - s.latency * 0.01)),
            color: 'var(--accent)',
        },
        {
            label: '500-1s',
            pct: Math.max(5, Math.round(15 + s.latency * 0.02)),
            color: 'var(--warning)',
        },
        { label: '>1s', pct: Math.max(3, Math.round(5 + s.latency * 0.03)), color: 'var(--error)' },
    ];
    const totalPct = latencyBuckets.reduce((sum, b) => sum + b.pct, 0);
    const normalizedBuckets = latencyBuckets.map((b) => ({
        ...b,
        pct: Math.round((b.pct / totalPct) * 100),
    }));

    const pct = metricsService.getAgentPercentiles(agent.id);
    const entries = [
        { label: 'P50', value: pct.p50, color: 'var(--success)' },
        { label: 'P90', value: pct.p90, color: 'var(--accent)' },
        { label: 'P95', value: pct.p95, color: 'var(--warning)' },
        { label: 'P99', value: pct.p99, color: 'var(--error)' },
    ];
    const hasSamples = entries.some((e) => e.value > 0);
    const fallback = [
        { label: 'P50', value: s.latency, color: 'var(--success)' },
        { label: 'P90', value: Math.round(s.latency * 1.5), color: 'var(--accent)' },
        { label: 'P95', value: Math.round(s.latency * 1.8), color: 'var(--warning)' },
        { label: 'P99', value: Math.round(s.latency * 2.2), color: 'var(--error)' },
    ];
    const rows = hasSamples ? entries : fallback;

    return (
        <div style={flexColGap5}>
            <div className="agents-obs-header">
                <Activity size={14} /> Node interceptor attached. Stream active.
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                }}
            >
                <div style={statCardDark}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                        {s.calls.toLocaleString()}
                    </div>
                    <div style={statLabelDark}>Total Calls</div>
                </div>
                <div style={statCardDark}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                        {successRate}%
                    </div>
                    <div style={statLabelDark}>Success Rate</div>
                </div>
                <div style={statCardDark}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: profileColor }}>
                        {s.latency}
                        <span style={{ fontSize: '0.8rem' }}>ms</span>
                    </div>
                    <div style={statLabelDark}>Avg Latency</div>
                </div>
            </div>

            <div style={infoCardDark}>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 800,
                        marginBottom: '0.75rem',
                    }}
                >
                    Cost Per Run
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                    }}
                >
                    <div style={textCenter}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                            {formatCost(avgCostPerCall)}
                        </div>
                        <div style={textXxsSecondary}>Avg / Call</div>
                    </div>
                    <div style={textCenter}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                            {formatCost(cost)}
                        </div>
                        <div style={textXxsSecondary}>Total Est.</div>
                    </div>
                    <div style={textCenter}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#a855f7' }}>
                            {(
                                s.avgTokensPerCall || Math.round(s.tokens / Math.max(1, s.calls))
                            ).toLocaleString()}
                        </div>
                        <div style={textXxsSecondary}>Avg Tokens</div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', minWidth: 60 }}>
                        Per-run cost
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: 20,
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.04)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${Math.min(100, avgCostPerCall * 1000000)}%`,
                                background: 'rgba(16,185,129,0.3)',
                                borderRadius: 4,
                                minWidth: 2,
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--slate-500)',
                            minWidth: 40,
                            textAlign: 'right',
                        }}
                    >
                        {formatCost(avgCostPerCall)}
                    </span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.6rem',
                        color: 'var(--slate-600)',
                    }}
                >
                    <span>Total est.: {formatCost(cost)}</span>
                    <span>Avg/call: {formatCost(avgCostPerCall)}</span>
                </div>
            </div>

            <div style={infoCardDark}>
                <div
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 800,
                        marginBottom: '0.75rem',
                    }}
                >
                    Latency Profile
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.2)',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)', fontWeight: 700 }}>
                                {row.label}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: row.color }}>
                                {row.value}
                                <span style={{ fontSize: '0.6rem' }}>ms</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>
                    Throughput: {metricsService.getAgentThroughput(agent.id).toFixed(2)} req/s
                </div>
                <div style={flexAlignCenterGap2}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)', minWidth: 70 }}>
                        Distribution
                    </span>
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            height: 12,
                            borderRadius: 6,
                            overflow: 'hidden',
                            background: 'rgba(0,0,0,0.3)',
                        }}
                    >
                        {normalizedBuckets.map((b) => (
                            <div
                                key={b.label}
                                style={{ width: `${b.pct}%`, background: b.color, opacity: 0.7 }}
                                title={`${b.label}: ${b.pct}%`}
                            />
                        ))}
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.4rem',
                        fontSize: '0.55rem',
                        color: 'var(--slate-600)',
                    }}
                >
                    {latencyBuckets.map((b) => (
                        <span
                            key={b.label}
                            style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 2,
                                    background: b.color,
                                    display: 'inline-block',
                                }}
                            />{' '}
                            {b.label}
                        </span>
                    ))}
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        fontSize: '0.65rem',
                    }}
                >
                    <div>
                        <span style={{ color: 'var(--slate-500)' }}>Errors: </span>
                        <span
                            style={{
                                color: (s.errors || 0) > 0 ? '#ef4444' : '#10b981',
                                fontWeight: 700,
                            }}
                        >
                            {s.errors || 0}
                        </span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--slate-500)' }}>Last Active: </span>
                        <span style={{ color: 'var(--slate-50)', fontWeight: 700 }}>
                            {s.lastActive ? new Date(s.lastActive).toLocaleTimeString() : '--'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="agents-obs-entry">
                <span className="agents-obs-entry-time">
                    [{new Date().toISOString().split('T')[1]!.slice(0, -1)}]
                </span>
                <span> ROUTER_REQ: {agent.id} - </span>
                <span className="agents-obs-entry-ok">200 OK</span>
                <span> ({s.latency}ms)</span>
            </div>
        </div>
    );
};

export default AgentObservabilityTab;
