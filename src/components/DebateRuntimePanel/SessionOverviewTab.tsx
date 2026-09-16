import { motion } from 'framer-motion';
import { AlertCircle, Brain, Circle, Thermometer } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type {
    DebateSessionSnapshot,
    CognitiveMetricsSnapshot,
    CognitivePressure,
} from '../../kernel/instances';
import { TopologyDiagram } from './TopologyDiagram';
import { PhaseTimeline } from './PhaseTimeline';
import { AGENT_COLORS } from './debate-runtime-constants';
import { grid2, h3Section, iconMarginRight, textSecondary } from '../../styles/common';

interface SessionOverviewTabProps {
    selected: DebateSessionSnapshot;
    thinkingAgentId: string | undefined;
    cognitiveMetrics: CognitiveMetricsSnapshot | null;
    cognitivePressure: CognitivePressure | null;
}

export function SessionOverviewTab({
    selected,
    thinkingAgentId,
    cognitiveMetrics,
    cognitivePressure,
}: SessionOverviewTabProps) {
    const { t } = useTranslation();
    return (
        <div style={grid2}>
            <div>
                <h4 style={h3Section}>Topology</h4>
                <div
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--slate-500)',
                        marginBottom: '0.5rem',
                    }}
                >
                    {t('debate_runtime.type')}{' '}
                    <strong style={{ color: 'var(--slate-200)' }}>{selected.topology.type}</strong>
                </div>
                <TopologyDiagram topology={selected.topology} />

                <h4
                    style={{
                        margin: '1rem 0 0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--slate-400)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    {t('debate_runtime.agent_states')}
                    {thinkingAgentId && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--success)',
                                fontWeight: 700,
                            }}
                        >
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: 'var(--success)',
                                }}
                            />
                            {t('debate_runtime.thinking', {
                                agent: thinkingAgentId,
                            })}
                        </motion.span>
                    )}
                </h4>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                    }}
                >
                    {selected.agentStates.map((a) => (
                        <div
                            key={a.agentId}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 0.6rem',
                                borderRadius: 6,
                                background: `${AGENT_COLORS[a.phase]}10`,
                            }}
                        >
                            <Circle
                                size={8}
                                fill={AGENT_COLORS[a.phase]}
                                color={AGENT_COLORS[a.phase]}
                            />
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--slate-200)',
                                    fontWeight: 500,
                                }}
                            >
                                {a.agentId}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: AGENT_COLORS[a.phase],
                                    marginLeft: 'auto',
                                }}
                            >
                                {a.phase}
                            </span>
                            {a.tokensUsed > 0 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                    {t('debate_runtime.tokens_short', {
                                        value: a.tokensUsed,
                                    })}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 style={h3Section}>{t('debate_runtime.phase')}</h4>
                <PhaseTimeline phase={selected.phase} />
                <div
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--slate-500)',
                        marginTop: '0.3rem',
                    }}
                >
                    {t('debate_runtime.round', { value: selected.round })}
                </div>

                <h4
                    style={{
                        margin: '1rem 0 0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--slate-400)',
                    }}
                >
                    <Brain size={14} style={iconMarginRight} />{' '}
                    {t('debate_runtime.cognitive_intelligence')}
                </h4>
                {cognitiveMetrics && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={textSecondary}>{t('debate_runtime.debate_quality')}</span>
                            <span
                                style={{
                                    color:
                                        cognitiveMetrics.debateQuality > 0.6
                                            ? '#22c55e'
                                            : cognitiveMetrics.debateQuality > 0.3
                                              ? '#f59e0b'
                                              : '#ef4444',
                                    fontWeight: 600,
                                }}
                            >
                                {(cognitiveMetrics.debateQuality * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={textSecondary}>
                                {t('debate_runtime.contradiction_density')}
                            </span>
                            <span
                                style={{
                                    color:
                                        cognitiveMetrics.avgContradictionDensity > 0.5
                                            ? '#ef4444'
                                            : '#94a3b8',
                                    fontWeight: 600,
                                }}
                            >
                                {(cognitiveMetrics.avgContradictionDensity * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={textSecondary}>
                                {t('debate_runtime.consensus_confidence')}
                            </span>
                            <span
                                style={{
                                    color:
                                        cognitiveMetrics.avgConsensusConfidence > 0.6
                                            ? '#22c55e'
                                            : '#94a3b8',
                                    fontWeight: 600,
                                }}
                            >
                                {(cognitiveMetrics.avgConsensusConfidence * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={textSecondary}>
                                {t('debate_runtime.reasoning_coherence')}
                            </span>
                            <span
                                style={{
                                    color:
                                        cognitiveMetrics.avgReasoningCoherence > 0.6
                                            ? '#22c55e'
                                            : '#94a3b8',
                                    fontWeight: 600,
                                }}
                            >
                                {(cognitiveMetrics.avgReasoningCoherence * 100).toFixed(0)}%
                            </span>
                        </div>
                        {cognitiveMetrics.reasoningCollapseDetected && (
                            <div
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: 4,
                                    background: 'rgba(239,68,68,0.15)',
                                    color: '#fca5a5',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    marginTop: '0.25rem',
                                }}
                            >
                                <AlertCircle size={12} style={iconMarginRight} />
                                {t('debate_runtime.reasoning_collapse')}
                            </div>
                        )}
                    </div>
                )}
                {cognitivePressure && (
                    <div
                        style={{
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid rgba(100,116,139,0.2)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--purple-muted)',
                                marginBottom: '0.3rem',
                            }}
                        >
                            <Thermometer size={12} style={iconMarginRight} />
                            {t('debate_runtime.cognitive_pressure_label', {
                                level: cognitivePressure.level,
                            })}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                fontSize: '0.7rem',
                                color: 'var(--slate-500)',
                                flexWrap: 'wrap',
                            }}
                        >
                            <span>
                                {t('debate_runtime.score', {
                                    value: (cognitivePressure.score * 100).toFixed(0),
                                })}
                            </span>
                            <span>
                                {t('debate_runtime.chains', {
                                    count: cognitivePressure.activeReasoningChains,
                                })}
                            </span>
                            <span>
                                {t('debate_runtime.contention', {
                                    value: (cognitivePressure.contentionScore * 100).toFixed(0),
                                })}
                            </span>
                            <span>
                                {t('debate_runtime.complexity', {
                                    value: (cognitivePressure.complexityScore * 100).toFixed(0),
                                })}
                            </span>
                        </div>
                    </div>
                )}

                <h4
                    style={{
                        margin: '1rem 0 0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--slate-400)',
                    }}
                >
                    {t('debate_runtime.budget')}
                </h4>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <span>
                        {t('debate_runtime.tokens_used', {
                            value: selected.totalTokens,
                        })}
                    </span>
                    <span>
                        {t('debate_runtime.cost_used', {
                            value: selected.totalCost.toFixed(4),
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
}
