import { Target } from 'lucide-react';
import type { DebateSession } from '../../kernel/instances';
import {
    glassPanelRounded24,
    flexColGap3MarginTop3,
    flexBetweenCenterSm,
    grid2TinyGap,
    progressBgSmall,
    borderTopSection,
    metricBoxSmall,
    textXsSubtle,
} from '../../styles/common';

interface QualityMetricsSectionProps {
    session: DebateSession;
    args: Array<unknown>;
    t: (key: string) => string;
}

const QualityMetricsSection: React.FC<QualityMetricsSectionProps> = ({ session, args, t }) => {
    if (session.status !== 'completed' || !session.qualityMetrics) return null;

    return (
        <div className="glass-panel" style={glassPanelRounded24}>
            <h3 className="debate-panel-header">
                <Target size={18} color="#10b981" /> {t('debate.quality_metrics')}
            </h3>
            <div style={flexColGap3MarginTop3}>
                <div>
                    <div style={flexBetweenCenterSm}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--info)' }}>
                            {t('debate.depth')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--info)', fontWeight: 600 }}>
                            {Math.round(session.qualityMetrics.depth.depthScore * 100)}%
                        </span>
                    </div>
                    <div style={grid2TinyGap}>
                        <span>
                            {t('debate.unique_args')}:{' '}
                            <strong style={{ color: 'var(--slate-200)' }}>
                                {session.qualityMetrics.depth.uniqueArguments}
                            </strong>{' '}
                            / {args.length}
                        </span>
                        <span>
                            {t('debate.lexical_diversity')}:{' '}
                            <strong style={{ color: 'var(--slate-200)' }}>
                                {(session.qualityMetrics.depth.lexicalDiversity * 100).toFixed(0)}%
                            </strong>
                        </span>
                        <span>
                            {t('debate.unique_bigrams')}:{' '}
                            <strong style={{ color: 'var(--slate-200)' }}>
                                {session.qualityMetrics.depth.uniqueBigrams}
                            </strong>
                        </span>
                        <span>
                            {t('debate.topic_breadth')}:{' '}
                            <strong style={{ color: 'var(--slate-200)' }}>
                                {(session.qualityMetrics.depth.topicBreadth * 100).toFixed(0)}%
                            </strong>
                        </span>
                    </div>
                    <div style={progressBgSmall}>
                        <div
                            style={{
                                width: `${Math.round(session.qualityMetrics.depth.depthScore * 100)}%`,
                                height: '100%',
                                background: 'var(--info)',
                                borderRadius: 2,
                            }}
                        />
                    </div>
                </div>
                <div style={borderTopSection}>
                    <div style={flexBetweenCenterSm}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f472b6' }}>
                            {t('debate.originality')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#f472b6', fontWeight: 600 }}>
                            {Math.round(session.qualityMetrics.originality.noveltyScore * 100)}%
                        </span>
                    </div>
                    <div style={grid2TinyGap}>
                        <span>
                            {t('debate.self_repetition')}:{' '}
                            <strong
                                style={{
                                    color:
                                        session.qualityMetrics.originality.selfRepetition > 0.3
                                            ? '#ef4444'
                                            : '#e2e8f0',
                                }}
                            >
                                {(session.qualityMetrics.originality.selfRepetition * 100).toFixed(
                                    0,
                                )}
                                %
                            </strong>
                        </span>
                        <span>
                            {t('debate.cross_repetition')}:{' '}
                            <strong
                                style={{
                                    color:
                                        session.qualityMetrics.originality.crossRepetition > 0.3
                                            ? '#ef4444'
                                            : '#e2e8f0',
                                }}
                            >
                                {(session.qualityMetrics.originality.crossRepetition * 100).toFixed(
                                    0,
                                )}
                                %
                            </strong>
                        </span>
                    </div>
                    <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.3rem' }}>
                        <div
                            style={{
                                flex: 1,
                                height: 4,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.04)',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${Math.min(session.qualityMetrics.originality.selfRepetition * 100, 100)}%`,
                                    height: '100%',
                                    background: '#f472b6',
                                    borderRadius: 2,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                flex: 1,
                                height: 4,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.04)',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${Math.min(session.qualityMetrics.originality.crossRepetition * 100, 100)}%`,
                                    height: '100%',
                                    background: '#a855f7',
                                    borderRadius: 2,
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.55rem',
                            color: 'var(--slate-500)',
                            marginTop: '0.15rem',
                        }}
                    >
                        <span>{t('debate.self_repetition')}</span>
                        <span>{t('debate.cross_repetition')}</span>
                    </div>
                </div>
                <div style={borderTopSection}>
                    <div style={flexBetweenCenterSm}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--warning)' }}>
                            {t('debate.usefulness')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>
                            {Math.round(session.qualityMetrics.usefulness.usefulnessScore * 100)}%
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            fontSize: '0.62rem',
                            color: 'var(--slate-400)',
                        }}
                    >
                        <div style={metricBoxSmall}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
                                {Math.round(session.qualityMetrics.usefulness.relevanceScore * 100)}
                                %
                            </div>
                            <div style={textXsSubtle}>{t('debate.relevance')}</div>
                        </div>
                        <div style={metricBoxSmall}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa' }}>
                                {Math.round(session.qualityMetrics.usefulness.evidenceScore * 100)}%
                            </div>
                            <div style={textXsSubtle}>{t('debate.evidence')}</div>
                        </div>
                        <div style={metricBoxSmall}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple-muted)' }}>
                                {Math.round(session.qualityMetrics.usefulness.structureScore * 100)}
                                %
                            </div>
                            <div style={textXsSubtle}>{t('debate.structure')}</div>
                        </div>
                    </div>
                    <div style={progressBgSmall}>
                        <div
                            style={{
                                width: `${Math.round(session.qualityMetrics.usefulness.usefulnessScore * 100)}%`,
                                height: '100%',
                                background: 'var(--warning)',
                                borderRadius: 2,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QualityMetricsSection;
