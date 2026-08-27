import { GitFork } from 'lucide-react';
import type { DebateArgument, DebateParticipant } from '../../kernel/contracts/debate-types';
import { glassPanelRounded24 } from '../../styles/common';
import { badgeGreen, badgeAmber, badgeRed } from './debate-analytics-badges';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

interface CausalAnalysisSectionProps {
    args: DebateArgument[];
    participants: DebateParticipant[];
    t: (key: string) => string;
}

const CAUSAL_REGEX =
    /\b(causes?|leads?\s+to|results?\s+in|therefore|because\s+of|triggers?|drives?|produces?|creates?|influences?|impacts?|affects?|exacerbates?|reduces?|increases?|prevents?|enables?)\b/i;

const LOOP_REGEX =
    /\b(feedback\s+loop|vicious\s+cycle|virtuous\s+cycle|self-reinforcing|self-correcting|balancing\s+loop|reinforcing\s+loop|circular|counteract|amplify|dampen|oscillat)\b/i;

const CASCADE_REGEX =
    /\b(which\s+(in\s+turn|causes|leads|triggers|creates)|cascade|chain\s+reaction|ripple\s+effect|knock-?on|snowball|domino|spillover)\b/i;

const DIMENSION_REGEX: { keyword: RegExp; label: string }[] = [
    { keyword: /economic|market|price|cost|inflation|gdp|unemployment/i, label: 'Economic' },
    { keyword: /social|cultural|inequality|community|demographic|norms/i, label: 'Social' },
    { keyword: /environmental|climate|ecosystem|pollution|emissions/i, label: 'Environmental' },
    {
        keyword: /political|policy|regulation|governance|legislation|geopolitical/i,
        label: 'Political',
    },
    { keyword: /technolog|innovation|automation|digital|ai|algorithm/i, label: 'Technological' },
    {
        keyword: /psycholog|mental|behavior|cognitive|perception|wellbeing/i,
        label: 'Psychological',
    },
    { keyword: /temporal|long.?term|future|generational|decade|century/i, label: 'Temporal' },
];

function computeCausalMetrics(args: DebateArgument[]) {
    const texts = args.map((a) => a.content).join(' ');
    const totalCausalMatches = texts.match(CAUSAL_REGEX);
    const totalClaims = totalCausalMatches ? totalCausalMatches.length : 0;
    const loopCount = texts.match(LOOP_REGEX)?.length ?? 0;
    const cascadeCount = texts.match(CASCADE_REGEX)?.length ?? 0;
    const coveredDimensions = DIMENSION_REGEX.filter((d) => d.keyword.test(texts)).map(
        (d) => d.label,
    );
    const allDimensions = DIMENSION_REGEX.map((d) => d.label);
    const missingDimensions = allDimensions.filter((d) => !coveredDimensions.includes(d));
    const loopRatio = totalClaims > 0 ? (loopCount + cascadeCount) / totalClaims : 0;

    const perAgent = args.reduce<
        Record<string, { claims: number; loops: number; cascades: number }>
    >((acc, a) => {
        if (!acc[a.agentId]) acc[a.agentId] = { claims: 0, loops: 0, cascades: 0 };
        if (CAUSAL_REGEX.test(a.content)) acc[a.agentId]!.claims++;
        if (LOOP_REGEX.test(a.content)) acc[a.agentId]!.loops++;
        if (CASCADE_REGEX.test(a.content)) acc[a.agentId]!.cascades++;
        return acc;
    }, {});

    return {
        totalClaims,
        loopCount,
        cascadeCount,
        loopRatio,
        coveredDimensions,
        missingDimensions,
        perAgent,
    };
}

const CausalAnalysisSection: React.FC<CausalAnalysisSectionProps> = ({ args, participants, t }) => {
    const metrics = computeCausalMetrics(args);
    if (metrics.totalClaims === 0) return null;

    const depthScore =
        metrics.totalClaims > 0 ? metrics.loopCount * 3 + metrics.cascadeCount * 2 : 0;
    const maxPossibleDepth = metrics.totalClaims * 3;
    const depthPct = maxPossibleDepth > 0 ? Math.round((depthScore / maxPossibleDepth) * 100) : 0;

    return (
        <div className="glass-panel" style={glassPanelRounded24}>
            <h3 className="debate-panel-header">
                <GitFork size={18} color="#06b6d4" />{' '}
                {t('debate.causal_analysis') || 'Causal Loop Analysis'}
            </h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                    marginTop: '0.75rem',
                }}
            >
                <div className="debate-stat" style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <div className="debate-sub-label" style={{ fontSize: '0.65rem' }}>
                        {t('debate.causal_claims') || 'Causal Claims'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#06b6d4' }}>
                        {metrics.totalClaims}
                    </div>
                </div>
                <div className="debate-stat" style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <div className="debate-sub-label" style={{ fontSize: '0.65rem' }}>
                        {t('debate.feedback_loops') || 'Feedback Loops'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple-muted)' }}>
                        {metrics.loopCount}
                    </div>
                </div>
                <div className="debate-stat" style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <div className="debate-sub-label" style={{ fontSize: '0.65rem' }}>
                        {t('debate.systems_depth') || 'Systems Depth'}
                    </div>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color:
                                depthPct > 50 ? '#10b981' : depthPct > 20 ? '#f59e0b' : '#ef4444',
                        }}
                    >
                        {depthPct}%
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: 'var(--slate-500)',
                }}
            >
                <span>
                    {metrics.loopCount + metrics.cascadeCount} systemic (
                    {Math.round(metrics.loopRatio * 100)}%)
                </span>
                <span style={{ color: 'var(--slate-600)' }}>|</span>
                <span>{metrics.cascadeCount} cascades</span>
                <span style={{ color: 'var(--slate-600)' }}>|</span>
                <span>
                    {metrics.coveredDimensions.length}/{DIMENSION_REGEX.length} dimensions
                </span>
            </div>

            {metrics.missingDimensions.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.6rem',
                        fontSize: '0.7rem',
                    }}
                >
                    <span style={{ color: 'var(--slate-500)', marginRight: '0.25rem' }}>Missing:</span>
                    {metrics.missingDimensions.map((d) => (
                        <span key={d} style={badgeAmber}>
                            {d}
                        </span>
                    ))}
                </div>
            )}

            {metrics.loopRatio < 0.2 && metrics.totalClaims >= 5 && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.6rem',
                    }}
                >
                    <span style={badgeRed}>
                        {'\u26A0'} Linear thinking detected — low systemic ratio
                    </span>
                </div>
            )}

            {Object.keys(metrics.perAgent).length > 0 && (
                <div
                    style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--slate-500)',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                        }}
                    >
                        Per-Agent Causal Depth
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {Object.entries(metrics.perAgent)
                            .sort(([, a], [, b]) => b.claims - a.claims)
                            .slice(0, 8)
                            .map(([agentId, m]) => {
                                const p = participants.find((p) => p.id === agentId);
                                const label = p?.name || resolveAgentIdentity(agentId).displayName;
                                const agentDepth =
                                    m.claims > 0
                                        ? Math.round(
                                              ((m.loops * 3 + m.cascades * 2) / (m.claims * 3)) *
                                                  100,
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={agentId}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                        }}
                                    >
                                        <span>{label}</span>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span>
                                                {m.claims}c {m.cascades}s {m.loops}l
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    color:
                                                        agentDepth > 50
                                                            ? '#10b981'
                                                            : agentDepth > 20
                                                              ? '#f59e0b'
                                                              : '#64748b',
                                                    width: 36,
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {agentDepth}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {metrics.loopRatio >= 0.2 && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.6rem',
                    }}
                >
                    <span style={badgeGreen}>{'\u2713'} Systemic reasoning detected</span>
                </div>
            )}
        </div>
    );
};

export default CausalAnalysisSection;
