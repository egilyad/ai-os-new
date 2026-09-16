import { AlertTriangle, Activity, Clock, GitBranch, CheckCircle2 } from 'lucide-react';
import { CARD, BADGE, SEVERITY_COLORS } from './shadow-constants';
import ShadowStatCard from './ShadowStatCard';
import type { RouterDiffReport } from '../../kernel/services/projections/router-shadow-diff';

interface Props {
    report: RouterDiffReport;
}

const SyncedRouter: React.FC = () => (
    <div style={{ ...CARD, textAlign: 'center', padding: 32, borderColor: 'rgba(34,197,94,0.2)' }}>
        <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 600 }}>
            Router Fully Synchronized
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            RouterService history and event-sourced projection are identical
        </div>
    </div>
);

const RouterDiffView: React.FC<Props> = ({ report }) => {
    const driftColor =
        report.driftScore === 0 ? '#22c55e' : report.driftScore < 20 ? '#f59e0b' : '#ef4444';

    if (
        report.mismatches.length === 0 &&
        report.missingInProjection.length === 0 &&
        report.missingInLive.length === 0
    ) {
        return <SyncedRouter />;
    }

    return (
        <div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <ShadowStatCard
                    icon={<GitBranch size={16} color={driftColor} />}
                    label="Drift Score"
                    value={report.driftScore}
                    sub={`${report.criticalCount} critical / ${report.mismatches.length} total`}
                    borderColor={driftColor}
                    valueColor={driftColor}
                />
                <ShadowStatCard
                    icon={<Activity size={16} color="#3b82f6" />}
                    label="Live"
                    value={report.totalLive}
                    sub="decisions in router history"
                />
                <ShadowStatCard
                    icon={<Clock size={16} color="#a78bfa" />}
                    label="Projected"
                    value={report.totalProjected}
                    sub="decisions in event projection"
                />
                <ShadowStatCard
                    icon={<AlertTriangle size={16} color="#f59e0b" />}
                    label="Missing in Projection"
                    value={report.missingInProjection.length}
                    sub="decisions not captured"
                    valueColor={report.missingInProjection.length > 0 ? '#f59e0b' : '#22c55e'}
                />
            </div>

            {report.missingInProjection.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--warning)',
                            marginBottom: 8,
                        }}
                    >
                        Live Decisions Missing from Projection ({report.missingInProjection.length})
                    </div>
                    {report.missingInProjection.slice(0, 10).map((id) => (
                        <div
                            key={id}
                            style={{
                                ...CARD,
                                padding: '0.4rem 0.75rem',
                                marginBottom: 4,
                                fontSize: '0.75rem',
                                color: 'var(--slate-300)',
                            }}
                        >
                            {id}
                        </div>
                    ))}
                </div>
            )}

            {report.mismatches.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {report.mismatches.map((m) => {
                        const sc = (SEVERITY_COLORS[m.severity!] ?? SEVERITY_COLORS.medium)!;
                        return (
                            <div
                                key={m.requestId}
                                style={{
                                    ...CARD,
                                    padding: '0.4rem 0.75rem',
                                    borderLeft: `3px solid ${sc.text}`,
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                        minWidth: 80,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                    title={m.requestId}
                                >
                                    {m.requestId.slice(0, 8)}
                                </span>
                                <span style={{ ...BADGE, background: sc.bg, color: sc.text }}>
                                    {m.severity}
                                </span>
                                <span
                                    style={{
                                        ...BADGE,
                                        background: 'var(--purple-tint)',
                                        color: 'var(--purple-muted)',
                                    }}
                                >
                                    {m.field}
                                </span>
                                <span style={{ color: 'var(--slate-400)' }}>
                                    live:{' '}
                                    <span style={{ color: '#fca5a5', fontWeight: 600 }}>
                                        {String(m.live)}
                                    </span>
                                </span>
                                <span style={{ color: 'var(--slate-500)' }}>→</span>
                                <span style={{ color: 'var(--slate-400)' }}>
                                    projection:{' '}
                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                        {String(m.projected)}
                                    </span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RouterDiffView;
