import React from 'react';
import { Info, Scale, XCircle, TrendingUp, GitBranch, ArrowRight } from 'lucide-react';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import type { DecisionPayload } from '../../kernel/events';
import {
    ScoreBar,
    ClassificationBadge,
    ComponentRow,
    providerColor,
} from './router-trace-components';
import {
    inputDarkBg,
    panelRounded16,
    scoreHeader,
    scoreRowDefault,
    winnerRow,
    skippedRow,
    tagSmall,
    flexCenterGap2,
    flexCenterSmGap,
    flexColGap1,
    flexColGap4,
    textMutedWeight700XsMargin,
} from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';

const STRATEGY_LABELS: Record<string, string> = {
    broadcast: 'router_trace.strategy.broadcast',
    performance: 'router_trace.strategy.performance',
    reliability: 'router_trace.strategy.reliability',
    latency: 'router_trace.strategy.latency',
    auto: 'router_trace.strategy.auto',
    race: 'router_trace.strategy.race',
    cost: 'router_trace.strategy.cost',
    free_first: 'router_trace.strategy.free_first',
};

interface DecisionDetailProps {
    decision: DecisionPayload;
}

const DecisionDetail: React.FC<DecisionDetailProps> = ({ decision }) => {
    const { t } = useTranslation();

    return (
        <div style={flexColGap4}>
            <div className="glass-panel" style={panelRounded16}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Info size={16} style={{ color: 'var(--purple)' }} />{' '}
                            {t('router_trace.decision_trace')}
                            <span
                                style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--slate-500)',
                                    fontFamily: 'monospace',
                                    fontWeight: 400,
                                }}
                            >
                                {decision.requestId}
                            </span>
                            {decision.profile && decision.profile !== 'default' && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: 4,
                                        background: 'rgba(245,158,11,0.15)',
                                        color: 'var(--warning)',
                                        fontWeight: 700,
                                    }}
                                >
                                    Profile: {decision.profile}
                                </span>
                            )}
                            {decision.isExperiment && (
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: 4,
                                        background: 'rgba(239,68,68,0.15)',
                                        color: 'var(--error)',
                                        fontWeight: 700,
                                    }}
                                >
                                    A/B Experiment
                                </span>
                            )}
                        </div>
                    </div>
                    {decision.classification && (
                        <ClassificationBadge cls={decision.classification} />
                    )}
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '0.75rem',
                    }}
                >
                    <div style={inputDarkBg}>
                        <div style={textMutedWeight700XsMargin}>
                            {t('router_trace.strategy_label')}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-50)', fontWeight: 700 }}>
                            {t(STRATEGY_LABELS[decision.strategy] || decision.strategy)}
                        </div>
                    </div>
                    <div style={inputDarkBg}>
                        <div style={textMutedWeight700XsMargin}>
                            {t('router_trace.selected_label')}
                        </div>
                        <div style={flexCenterSmGap}>
                            <ProviderIcon provider={decision.selected} size={16} />
                            <span
                                style={{
                                    fontSize: '0.85rem',
                                    color: providerColor(decision.selected),
                                    fontWeight: 700,
                                }}
                            >
                                {decision.selected}
                            </span>
                        </div>
                    </div>
                    {decision.secondBest && (
                        <div style={inputDarkBg}>
                            <div style={textMutedWeight700XsMargin}>
                                {t('router_trace.runner_up')}
                            </div>
                            <div style={flexCenterSmGap}>
                                <ProviderIcon provider={decision.secondBest} size={16} />
                                <span
                                    style={{
                                        fontSize: '0.85rem',
                                        color: providerColor(decision.secondBest),
                                        fontWeight: 700,
                                    }}
                                >
                                    {decision.secondBest}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-panel" style={panelRounded16}>
                <div style={{ ...scoreHeader, marginBottom: '0.75rem' }}>
                    <Scale size={16} style={{ color: 'var(--warning)' }} />{' '}
                    {t('router_trace.effective_weights')}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        height: 24,
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    {(() => {
                        const w = decision.weights as
                            { ttft: number; tps: number; reliability: number } | undefined;
                        if (!w) return null;
                        const total = w.ttft + w.tps + w.reliability;
                        const ttftPct = (w.ttft / total) * 100;
                        const tpsPct = (w.tps / total) * 100;
                        const relPct = (w.reliability / total) * 100;
                        return (
                            <>
                                <div
                                    style={{
                                        width: `${ttftPct}%`,
                                        background: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: 'white',
                                    }}
                                >
                                    {ttftPct > 10 ? `TTFT ${(w.ttft * 100).toFixed(0)}%` : null}
                                </div>
                                <div
                                    style={{
                                        width: `${tpsPct}%`,
                                        background: 'var(--success)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: 'white',
                                    }}
                                >
                                    {tpsPct > 10 ? `TPS ${(w.tps * 100).toFixed(0)}%` : null}
                                </div>
                                <div
                                    style={{
                                        width: `${relPct}%`,
                                        background: 'var(--purple)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: 'white',
                                    }}
                                >
                                    {relPct > 10
                                        ? `Rel ${(w.reliability * 100).toFixed(0)}%`
                                        : null}
                                </div>
                            </>
                        );
                    })()}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '0.5rem',
                        fontSize: '0.65rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <span>
                        <span style={{ color: '#60a5fa' }}>■</span> {t('router_trace.legend_ttft')}
                    </span>
                    <span>
                        <span style={{ color: '#34d399' }}>■</span> {t('router_trace.legend_tps')}
                    </span>
                    <span>
                        <span style={{ color: 'var(--purple-muted)' }}>■</span>{' '}
                        {t('router_trace.legend_reliability')}
                    </span>
                </div>
            </div>

            {decision.skipped && decision.skipped.length > 0 && (
                <div className="glass-panel" style={panelRounded16}>
                    <div style={{ ...scoreHeader, marginBottom: '0.75rem' }}>
                        <XCircle size={16} style={{ color: 'var(--error)' }} />{' '}
                        {t('router_trace.skipped_providers', { count: decision.skipped.length })}
                    </div>
                    <div style={flexColGap1}>
                        {decision.skipped.map((s, i) => {
                            const stageColor: Record<string, string> = {
                                status: '#f59e0b',
                                policy: '#ef4444',
                                quota: '#8b5cf6',
                                score: '#3b82f6',
                                budget: '#ec4899',
                                unavailable: '#64748b',
                                circuit: '#dc2626',
                                ratelimit: '#f97316',
                                backoff: '#94a3b8',
                            };
                            return (
                                <div key={`skipped-${i}`} style={skippedRow}>
                                    <ProviderIcon provider={s.provider} size={14} />
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-200)',
                                            width: 100,
                                        }}
                                    >
                                        {s.provider}
                                    </span>
                                    <span
                                        style={{
                                            ...tagSmall,
                                            background: `${stageColor[s.stage] || '#64748b'}20`,
                                            color: stageColor[s.stage] || '#64748b',
                                        }}
                                    >
                                        {s.stage}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', flex: 1 }}>
                                        {s.reason}
                                    </span>
                                    {s.keyLabel && (
                                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                            ({s.keyLabel})
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="glass-panel" style={panelRounded16}>
                <div style={scoreHeader}>
                    <TrendingUp size={16} style={{ color: 'var(--accent)' }} />{' '}
                    {t('router_trace.score_breakdown')}
                </div>
                <div style={flexColGap4}>
                    {decision.scores.map((s, i) => {
                        const isWinner = i === 0;
                        const scoreVal = parseFloat(s.s);
                        const components = s.c;
                        return (
                            <div key={s.p} style={isWinner ? winnerRow : scoreRowDefault}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    <div style={flexCenterGap2}>
                                        <ProviderIcon provider={s.p} size={20} />
                                        <span
                                            style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                color: isWinner ? providerColor(s.p) : '#94a3b8',
                                            }}
                                        >
                                            {s.p}
                                        </span>
                                        {isWinner && (
                                            <span
                                                style={{
                                                    ...tagSmall,
                                                    background: 'rgba(16,185,129,0.15)',
                                                    color: 'var(--success)',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {t('router_trace.selected_badge')}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 800,
                                            fontFamily: 'monospace',
                                            color: isWinner ? '#10b981' : '#64748b',
                                        }}
                                    >
                                        {scoreVal.toFixed(3)}
                                    </span>
                                </div>
                                {components && (
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '0.35rem 1.5rem',
                                        }}
                                    >
                                        <div>
                                            <ScoreBar
                                                label={t('router_trace.score_raw')}
                                                value={components.raw}
                                                color="#3b82f6"
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_stability')}
                                                value={components.stabilityBonus}
                                                max={0.2}
                                                color="#06b6d4"
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_reputation')}
                                                value={components.reputationBonus}
                                                max={0.2}
                                                color="#8b5cf6"
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_exploration')}
                                                value={components.explorationBonus}
                                                max={0.5}
                                                color="#f59e0b"
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_key_reputation')}
                                                value={components.keyReputationBonus}
                                                max={0.3}
                                                color="#a855f7"
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_affinity')}
                                                value={components.affinityBonus}
                                                max={0.3}
                                                color="#ec4899"
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_priority')}
                                                value={components.priorityBonus}
                                                max={0.3}
                                                color="#f97316"
                                            />
                                        </div>
                                        <div>
                                            <ScoreBar
                                                label={t('router_trace.score_cost_penalty')}
                                                value={components.costPenalty}
                                                max={0.5}
                                                color="#ef4444"
                                                invert
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_latency_penalty')}
                                                value={components.latencyPenalty}
                                                max={0.5}
                                                color="#ef4444"
                                                invert
                                            />
                                            <ScoreBar
                                                label={t('router_trace.score_budget_penalty')}
                                                value={components.budgetPenalty}
                                                max={0.5}
                                                color="#ef4444"
                                                invert
                                            />
                                        </div>
                                    </div>
                                )}
                                {components && (
                                    <div
                                        style={{
                                            marginTop: '0.75rem',
                                            paddingTop: '0.5rem',
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            gap: '0.75rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <ComponentRow
                                            label={t('router_trace.score_stability')}
                                            value={components.stabilityBonus}
                                            type="bonus"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_reputation')}
                                            value={components.reputationBonus}
                                            type="bonus"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_exploration')}
                                            value={components.explorationBonus}
                                            type="bonus"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_key_reputation')}
                                            value={components.keyReputationBonus}
                                            type="bonus"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_affinity')}
                                            value={components.affinityBonus}
                                            type="bonus"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_priority')}
                                            value={components.priorityBonus}
                                            type="bonus"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_cost_penalty')}
                                            value={components.costPenalty}
                                            type="penalty"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_latency_penalty')}
                                            value={components.latencyPenalty}
                                            type="penalty"
                                        />
                                        <ComponentRow
                                            label={t('router_trace.score_budget_penalty')}
                                            value={components.budgetPenalty}
                                            type="penalty"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {decision.scores.length >= 2 && decision.scores[0]!.c && decision.scores[1]!.c && (
                <div className="glass-panel" style={panelRounded16}>
                    <div style={scoreHeader}>
                        <GitBranch size={16} style={{ color: 'var(--success)' }} />{' '}
                        {t('router_trace.winner_vs_runner')}
                    </div>
                    {(() => {
                        const w = decision.scores[0]!;
                        const r = decision.scores[1]!;
                        const wScore = parseFloat(w.s);
                        const rScore = parseFloat(r.s);
                        if (!w.c || !r.c) return null;
                        const diff = wScore - rScore;
                        const wTotalBonuses =
                            w.c.stabilityBonus +
                            w.c.reputationBonus +
                            w.c.explorationBonus +
                            w.c.keyReputationBonus +
                            w.c.affinityBonus +
                            w.c.priorityBonus;
                        const wTotalPenalties =
                            w.c.costPenalty + w.c.latencyPenalty + w.c.budgetPenalty;
                        const rTotalBonuses =
                            r.c.stabilityBonus +
                            r.c.reputationBonus +
                            r.c.explorationBonus +
                            r.c.keyReputationBonus +
                            r.c.affinityBonus +
                            r.c.priorityBonus;
                        const rTotalPenalties =
                            r.c.costPenalty + r.c.latencyPenalty + r.c.budgetPenalty;
                        return (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto 1fr',
                                    gap: '1rem',
                                    alignItems: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(16,185,129,0.05)',
                                        border: '1px solid rgba(16,185,129,0.15)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--success)',
                                            fontWeight: 700,
                                            marginBottom: '0.25rem',
                                        }}
                                    >
                                        {w.p}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            color: 'var(--success)',
                                        }}
                                    >
                                        +{diff.toFixed(3)}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                        {t('router_trace.vs_raw', {
                                            raw: w.c.raw.toFixed(3),
                                            bonuses: wTotalBonuses.toFixed(3),
                                            penalties: wTotalPenalties.toFixed(3),
                                        })}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--slate-500)' }}>
                                    <ArrowRight size={20} />
                                </div>
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.15)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-400)',
                                            fontWeight: 700,
                                            marginBottom: '0.25rem',
                                        }}
                                    >
                                        {r.p}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            color: 'var(--slate-400)',
                                        }}
                                    >
                                        {rScore.toFixed(3)}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                        {t('router_trace.vs_raw', {
                                            raw: r.c.raw.toFixed(3),
                                            bonuses: rTotalBonuses.toFixed(3),
                                            penalties: rTotalPenalties.toFixed(3),
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default DecisionDetail;
