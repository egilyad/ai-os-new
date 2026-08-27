import { Clock, Zap } from 'lucide-react';
import type { DebateSession } from '../../kernel/instances';
import { glassPanelRounded24 } from '../../styles/common';

interface RoundTimelineProps {
    session: DebateSession;
    args: Array<{ round: number; agentId: string; confidence?: number }>;
    t: (key: string) => string;
}

const RoundTimeline: React.FC<RoundTimelineProps> = ({ session, args, t }) => {
    if (session.status !== 'completed' || args.length === 0) return null;

    const roundNumbers = [...new Set(args.map((a) => a.round))].sort((a, b) => a - b);
    const roundCounts = roundNumbers.map((r) => args.filter((a) => a.round === r).length);
    const maxRoundCount = Math.max(...roundCounts, 1);

    return (
        <div className="glass-panel" style={glassPanelRounded24}>
            <h3 className="debate-panel-header">
                <Clock size={18} color="#60a5fa" /> {t('debate.round_timeline')}
            </h3>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    marginTop: '0.75rem',
                }}
            >
                {roundNumbers.map((r, ri) => {
                    const roundArgs = args.filter((a) => a.round === r);
                    const agentIds = [...new Set(roundArgs.map((a) => a.agentId))];
                    const avgConf =
                        roundArgs.reduce((s, a) => s + (a.confidence || 0), 0) / roundArgs.length;
                    const timelinePoint = session.interpretation?.disagreementTimeline?.find(
                        (point) => point.round === r,
                    );
                    const intensity = timelinePoint?.intensity ?? roundCounts[ri]! / maxRoundCount;
                    const isPeak = session.interpretation?.disagreementPeak?.round === r;
                    const intensityPct = Math.round(Math.min(intensity, 1) * 100);

                    return (
                        <div
                            key={r}
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                padding: '0.35rem 0.5rem',
                                borderRadius: 8,
                                background: isPeak ? 'rgba(239,68,68,0.06)' : 'transparent',
                                border: isPeak ? '1px solid rgba(239,68,68,0.12)' : 'none',
                            }}
                        >
                            <div
                                style={{
                                    width: 24,
                                    textAlign: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: isPeak ? '#ef4444' : '#60a5fa',
                                    flexShrink: 0,
                                }}
                            >
                                {r}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.6rem',
                                            color: 'var(--slate-400)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {agentIds.length} {t('debate.agents')} &middot;{' '}
                                        {roundArgs.length} {t('debate.arg_short')}
                                        {roundArgs.length !== 1 ? 's' : ''}
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
                                                width: `${intensityPct}%`,
                                                height: '100%',
                                                background: isPeak
                                                    ? '#ef4444'
                                                    : `rgba(96,165,250,${0.3 + intensity * 0.7})`,
                                                borderRadius: 2,
                                                transition: 'width 0.4s ease',
                                            }}
                                        />
                                    </div>
                                    {isPeak && (
                                        <Zap size={10} color="#ef4444" style={{ flexShrink: 0 }} />
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.58rem',
                                        color: 'var(--slate-500)',
                                        marginTop: '0.1rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {agentIds
                                        .map(
                                            (id) =>
                                                session.participants.find((p) => p.id === id)
                                                    ?.name || id,
                                        )
                                        .join(', ')}
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    flexShrink: 0,
                                    textAlign: 'right',
                                }}
                            >
                                <div>{Math.round(avgConf * 100)}%</div>
                                <div style={{ fontSize: '0.5rem' }}>{t('debate.conf_short')}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoundTimeline;
