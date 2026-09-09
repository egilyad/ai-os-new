import { GitBranch } from 'lucide-react';
import type { DebateSession } from '../../kernel/instances';
import { glassPanelRounded24 } from '../../styles/common';
import { badgeGreen, badgeAmber, badgeRed, badgePink, badgeBlue } from './debate-analytics-badges';

interface GraphMetricsSectionProps {
    session: DebateSession;
    t: (key: string) => string;
}

const GraphMetricsSection: React.FC<GraphMetricsSectionProps> = ({ session, t }) => {
    if (!session.graphMetrics) return null;

    return (
        <div className="glass-panel" style={glassPanelRounded24}>
            <h3 className="debate-panel-header">
                <GitBranch size={18} color="#f59e0b" /> {t('debate.structural_metrics')}
            </h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                    marginTop: '0.75rem',
                }}
            >
                {[
                    {
                        label: t('debate.max_depth'),
                        value: String(session.graphMetrics.maxDepth),
                        color: 'var(--purple-muted)',
                    },
                    {
                        label: t('debate.avg_depth'),
                        value: session.graphMetrics.avgDepth.toFixed(1),
                        color: '#60a5fa',
                    },
                    {
                        label: t('debate.branching'),
                        value: session.graphMetrics.branchingFactor.toFixed(1),
                        color: '#34d399',
                    },
                    {
                        label: t('debate.orphan_rate'),
                        value: `${(session.graphMetrics.orphanRate * 100).toFixed(0)}%`,
                        color: session.graphMetrics.orphanRate > 0.3 ? '#ef4444' : '#f59e0b',
                    },
                    {
                        label: t('debate.challenge_density'),
                        value: `${(session.graphMetrics.challengeDensity * 100).toFixed(0)}%`,
                        color: '#f472b6',
                    },
                    {
                        label: t('debate.refinement_density'),
                        value: `${(session.graphMetrics.refinementDensity * 100).toFixed(0)}%`,
                        color: 'var(--info)',
                    },
                ].map((m) => (
                    <div
                        key={m.label}
                        className="debate-stat"
                        style={{ textAlign: 'center', padding: '0.5rem' }}
                    >
                        <div className="debate-sub-label" style={{ fontSize: '0.65rem' }}>
                            {m.label}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: m.color }}>
                            {m.value}
                        </div>
                    </div>
                ))}
            </div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: 'var(--slate-500)',
                }}
            >
                {session.graphMetrics.maxDepth >= 4 && (
                    <span style={badgeGreen}>{t('debate.badge_deep')}</span>
                )}
                {session.graphMetrics.branchingFactor > 2 && (
                    <span style={badgeAmber}>{t('debate.badge_branching')}</span>
                )}
                {session.graphMetrics.orphanRate > 0.3 && (
                    <span style={badgeRed}>{t('debate.badge_orphan')}</span>
                )}
                {session.graphMetrics.challengeDensity > 0.5 && (
                    <span style={badgePink}>{t('debate.badge_challenge')}</span>
                )}
                {session.graphMetrics.refinementDensity > 0.5 && (
                    <span style={badgeBlue}>{t('debate.badge_refinement')}</span>
                )}
            </div>
        </div>
    );
};

export default GraphMetricsSection;
