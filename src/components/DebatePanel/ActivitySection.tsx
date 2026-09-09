import { BarChart3, MessageSquare } from 'lucide-react';
import type { DebateSession } from '../../kernel/instances';
import { glassPanelRounded24 } from '../../styles/common';

interface ActivitySectionProps {
    session: DebateSession;
    t: (key: string) => string;
}

const ActivityHeatmap: React.FC<ActivitySectionProps> = ({ session, t }) => {
    if (session.status !== 'completed' || !session.activityMetrics) return null;
    const perAgent = session.activityMetrics.perAgent;
    if (perAgent.length === 0) return null;

    const maxCount = Math.max(...perAgent.map((x) => x.argumentCount), 1);
    const maxChildren = Math.max(...perAgent.map((x) => x.childrenReceived), 1);

    return (
        <div className="glass-panel" style={glassPanelRounded24}>
            <h3 className="debate-panel-header">
                <BarChart3 size={18} color="#f97316" /> {t('debate.activity_heatmap')}
            </h3>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                }}
            >
                {perAgent.map((a, i) => {
                    const pct = (a.argumentCount / maxCount) * 100;
                    const childrenPct = (a.childrenReceived / maxChildren) * 100;
                    const heatColor = pct > 66 ? '#ef4444' : pct > 33 ? '#f59e0b' : '#3b82f6';
                    return (
                        <div key={a.agentId} style={{ fontSize: '0.72rem' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.15rem',
                                }}
                            >
                                <span
                                    style={{
                                        color: 'var(--slate-200)',
                                        fontWeight: 500,
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {a.agentName}
                                </span>
                                <span
                                    style={{
                                        color: 'var(--slate-400)',
                                        flexShrink: 0,
                                        marginLeft: '0.5rem',
                                    }}
                                >
                                    {a.argumentCount} {t('debate.args')} &middot; {a.wordCount}{' '}
                                    {t('debate.words')} &middot; {Math.round(a.avgConfidence * 100)}
                                    %
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div
                                    style={{
                                        flex: 1,
                                        height: 6,
                                        borderRadius: 3,
                                        background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: heatColor,
                                            borderRadius: 3,
                                            transition: 'width 0.5s ease',
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        color: childrenPct > 0 ? '#f472b6' : '#475569',
                                        fontSize: '0.6rem',
                                        flexShrink: 0,
                                        width: 36,
                                        textAlign: 'right',
                                    }}
                                >
                                    {'\u21C4'}
                                    {a.childrenReceived}
                                </span>
                            </div>
                            {i < perAgent.length - 1 &&
                                i === Math.min(2, perAgent.length - 2) &&
                                perAgent.length > 4 && (
                                    <div
                                        style={{
                                            borderTop: '1px solid rgba(255,255,255,0.04)',
                                            margin: '0.4rem 0',
                                        }}
                                    />
                                )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MostDiscussedSection: React.FC<ActivitySectionProps> = ({ session, t }) => {
    if (
        session.status !== 'completed' ||
        !session.activityMetrics ||
        session.activityMetrics.mostDiscussed.length === 0
    )
        return null;
    const mostDiscussed = session.activityMetrics.mostDiscussed;
    const maxChildren = Math.max(...mostDiscussed.map((x) => x.childCount), 1);

    return (
        <div className="glass-panel" style={glassPanelRounded24}>
            <h3 className="debate-panel-header">
                <MessageSquare size={18} color="#a855f7" /> {t('debate.most_discussed')}
            </h3>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                }}
            >
                {mostDiscussed.map((arg) => {
                    const pct = (arg.childCount / maxChildren) * 100;
                    return (
                        <div
                            key={arg.argumentId}
                            style={{
                                padding: '0.5rem 0.65rem',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.68rem',
                                        color: '#c084fc',
                                        fontWeight: 600,
                                    }}
                                >
                                    @{arg.agentName}{' '}
                                    <span style={{ color: 'var(--slate-500)', fontWeight: 400 }}>
                                        &middot; {t('debate.round_label')} {arg.round}
                                    </span>
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        color: '#f472b6',
                                        fontWeight: 600,
                                    }}
                                >
                                    {arg.childCount} {t('debate.responses')}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
                                "{arg.content}"
                            </div>
                            <div
                                style={{
                                    marginTop: '0.3rem',
                                    height: 3,
                                    borderRadius: 2,
                                    background: 'rgba(255,255,255,0.04)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background: '#a855f7',
                                        borderRadius: 2,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ActivitySection: React.FC<ActivitySectionProps> = (props) => (
    <>
        <ActivityHeatmap {...props} />
        <MostDiscussedSection {...props} />
    </>
);

export default ActivitySection;
