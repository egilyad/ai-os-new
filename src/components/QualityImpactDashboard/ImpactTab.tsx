import React, { useState, useEffect, useCallback } from 'react';
import { qualityImpactCollector } from '../../kernel/instances';
import type { TechniqueImpactMetrics } from '../../kernel/contracts/quality-impact';
import { useTranslation } from '../../i18n/useTranslation';
import {
    CONFIDENCE_ORDER,
    CONFIDENCE_COLOR,
    PRETTY_CONFIDENCE,
    statsRowStyle,
    statCardStyle,
    statValueStyle,
    statLabelStyle,
    tableContainerStyle,
    tableHeaderStyle,
    rowStyle,
    expandedRowStyle,
    emptyStyle,
    badgeStyle,
    deltaStyle,
    formatPct,
    type SortKey,
    type SortDir,
} from './quality-impact-shared';

const ImpactTab: React.FC = () => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<TechniqueImpactMetrics[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('avgJudgeScoreDelta');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const refresh = useCallback(() => {
        try {
            const all = qualityImpactCollector.getAllMetrics();
            setMetrics(all ?? []);
        } catch {
            /* not initialized */
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 10000);
        return () => clearInterval(id);
    }, [refresh]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const sorted = [...metrics].sort((a, b) => {
        let cmp: number;
        if (sortKey === 'techniqueId') cmp = a.techniqueId.localeCompare(b.techniqueId);
        else if (sortKey === 'confidence')
            cmp = (CONFIDENCE_ORDER[a.confidence] ?? 0) - (CONFIDENCE_ORDER[b.confidence] ?? 0);
        else if (sortKey === 'totalActivations') cmp = a.totalActivations - b.totalActivations;
        else cmp = a.avgJudgeScoreDelta - b.avgJudgeScoreDelta;
        return sortDir === 'desc' ? -cmp : cmp;
    });

    const totalSessions = metrics.reduce((s, m) => Math.max(s, m.totalSessions), 0);
    const totalActivations = metrics.reduce((s, m) => s + m.totalActivations, 0);
    const sortArrow = (key: SortKey): string =>
        sortKey === key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : '';

    return (
        <>
            <div style={statsRowStyle}>
                <div style={statCardStyle}>
                    <div style={statValueStyle}>{totalSessions}</div>
                    <div style={statLabelStyle}>{t('quality_impact.sessions') ?? 'Sessions'}</div>
                </div>
                <div style={statCardStyle}>
                    <div style={statValueStyle}>{metrics.length}/70</div>
                    <div style={statLabelStyle}>
                        {t('quality_impact.techniques') ?? 'Techniques'}
                    </div>
                </div>
                <div style={statCardStyle}>
                    <div style={statValueStyle}>{totalActivations}</div>
                    <div style={statLabelStyle}>
                        {t('quality_impact.activations') ?? 'Activations'}
                    </div>
                </div>
                <div style={statCardStyle}>
                    <div style={statValueStyle}>
                        {metrics.filter((m) => m.avgJudgeScoreDelta > 0).length}
                    </div>
                    <div style={statLabelStyle}>
                        {t('quality_impact.positive') ?? 'Positive Impact'}
                    </div>
                </div>
            </div>
            <div style={tableContainerStyle}>
                <div
                    style={tableHeaderStyle}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('techniqueId')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSort('techniqueId');
                        }
                    }}
                >
                    <span>
                        {t('quality_impact.technique') ?? 'Technique'}
                        {sortArrow('techniqueId')}
                    </span>
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSort('avgJudgeScoreDelta');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleSort('avgJudgeScoreDelta');
                            }
                        }}
                    >
                        {t('quality_impact.delta') ?? 'ΔScore'}
                        {sortArrow('avgJudgeScoreDelta')}
                    </span>
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSort('totalActivations');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleSort('totalActivations');
                            }
                        }}
                    >
                        {t('quality_impact.uses') ?? 'Uses'}
                        {sortArrow('totalActivations')}
                    </span>
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSort('confidence');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleSort('confidence');
                            }
                        }}
                    >
                        {t('quality_impact.confidence') ?? 'Confidence'}
                        {sortArrow('confidence')}
                    </span>
                    <span>{t('quality_impact.sessions_short') ?? 'Sess'}</span>
                    <span></span>
                </div>
                {sorted.length === 0 && (
                    <div style={emptyStyle}>{t('quality_impact.empty') ?? 'No data yet.'}</div>
                )}
                {sorted.map((m) => (
                    <React.Fragment key={m.techniqueId}>
                        <div
                            style={rowStyle}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                                setExpandedId(expandedId === m.techniqueId ? null : m.techniqueId)
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setExpandedId(
                                        expandedId === m.techniqueId ? null : m.techniqueId,
                                    );
                                }
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                    'rgba(148, 163, 184, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                        >
                            <span style={{ fontWeight: 500, color: 'var(--slate-200)' }}>
                                {m.techniqueId}
                            </span>
                            <span style={deltaStyle(m.avgJudgeScoreDelta)}>
                                {m.avgJudgeScoreDelta >= 0 ? '+' : ''}
                                {formatPct(m.avgJudgeScoreDelta)}
                            </span>
                            <span style={{ color: 'var(--slate-400)' }}>{m.totalActivations}</span>
                            <span>
                                <span
                                    style={badgeStyle(CONFIDENCE_COLOR[m.confidence] ?? '#6b7280')}
                                >
                                    {PRETTY_CONFIDENCE[m.confidence] ?? m.confidence}
                                </span>
                            </span>
                            <span style={{ color: 'var(--slate-400)' }}>{m.totalSessions}</span>
                            <span style={{ color: 'var(--slate-500)', fontSize: '16px' }}>
                                {expandedId === m.techniqueId ? '−' : '+'}
                            </span>
                        </div>
                        {expandedId === m.techniqueId && (
                            <div style={expandedRowStyle}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>
                                        {t('quality_impact.detail_sessions') ?? 'Sessions'}:
                                    </strong>{' '}
                                    {m.sampleSizeOn} ON / {m.sampleSizeOff} OFF
                                </div>
                                {m.avgConfidenceDelta !== 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>
                                            {t('quality_impact.detail_confidence') ?? 'Conf Δ'}:
                                        </strong>{' '}
                                        <span style={deltaStyle(m.avgConfidenceDelta)}>
                                            {m.avgConfidenceDelta >= 0 ? '+' : ''}
                                            {formatPct(m.avgConfidenceDelta)}
                                        </span>
                                    </div>
                                )}
                                {m.avgRoundCountDelta !== 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>
                                            {t('quality_impact.detail_rounds') ?? 'Rounds Δ'}:
                                        </strong>{' '}
                                        <span style={deltaStyle(m.avgRoundCountDelta)}>
                                            {m.avgRoundCountDelta >= 0 ? '+' : ''}
                                            {formatPct(m.avgRoundCountDelta)}
                                        </span>
                                    </div>
                                )}
                                {m.avgTokenCostDelta !== 0 && (
                                    <div>
                                        <strong>
                                            {t('quality_impact.detail_tokens') ?? 'Tokens Δ'}:
                                        </strong>{' '}
                                        <span style={deltaStyle(-m.avgTokenCostDelta)}>
                                            {m.avgTokenCostDelta >= 0 ? '+' : ''}
                                            {formatPct(m.avgTokenCostDelta)}
                                        </span>
                                    </div>
                                )}
                                {m.pValue !== undefined && (
                                    <div style={{ marginTop: '8px', color: 'var(--slate-500)' }}>
                                        p-value: {m.pValue.toFixed(4)}
                                    </div>
                                )}
                                <div
                                    style={{
                                        marginTop: '10px',
                                        paddingTop: '10px',
                                        borderTop: '1px solid rgba(148,163,184,0.15)',
                                    }}
                                >
                                    <div style={{ marginBottom: '6px' }}>
                                        <strong>
                                            {t('quality_impact.attribution_title') ?? 'Attribution'}
                                            :
                                        </strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                                        <div>
                                            <span style={{ color: 'var(--slate-400)' }}>
                                                {t('quality_impact.last_touch') ?? 'Last-touch'}:
                                            </span>{' '}
                                            <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                                                {m.lastTouchCount ?? 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-400)' }}>
                                                {t('quality_impact.frequency_title') ?? 'Frequency'}
                                                :
                                            </span>{' '}
                                            <span style={{ color: 'var(--purple-muted)', fontWeight: 600 }}>
                                                {((m.frequencyInBestRounds ?? 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-400)' }}>Composite:</span>{' '}
                                            <span style={{ color: '#f472b6', fontWeight: 600 }}>
                                                {(
                                                    (m.lastTouchCount ?? 0) * 2 +
                                                    (m.frequencyInBestRounds ?? 0) * 100
                                                ).toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </>
    );
};

export default ImpactTab;
