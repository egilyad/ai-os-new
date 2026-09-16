import { ArrowRight, Info, TrendingUp, Zap, DollarSign, Shield } from 'lucide-react';
import { DonutChart } from '../shared/charts/DonutChart';
import { useTranslation } from '../../i18n/useTranslation';
import type { RouterDecision } from '../../kernel/instances';
import { STRATEGY_LABELS, providerColor, scoreBreakdown, getExplanation } from './routing-utils';
import {
    detailRow,
    emptyState,
    flexColGap2,
    flexWrapCenter,
    textMutedSm,
    textSecondary,
    textXsMuted,
    textXsSecondary,
    textXxsMuted,
} from '../../styles/common';

interface Props {
    decisions: RouterDecision[];
    selected: RouterDecision | null;
    onSelect: (d: RouterDecision | null) => void;
}

function HistoryTab({ decisions, selected, onSelect }: Props) {
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
                gap: '1.5rem',
            }}
        >
            <div>
                <div style={textMutedSm}>Last {decisions.length} routing decisions</div>
                {decisions.length > 0 &&
                    (() => {
                        const dist = new Map<string, number>();
                        for (const d of decisions) {
                            const p = d.selected || 'unknown';
                            dist.set(p, (dist.get(p) || 0) + 1);
                        }
                        const chartData = Array.from(dist.entries())
                            .map(([provider, count]) => ({
                                name: provider,
                                value: count,
                                color: providerColor(provider) || '#64748b',
                            }))
                            .sort((a, b) => b.value - a.value);
                        return (
                            <div
                                style={{
                                    margin: '0.75rem 0',
                                    padding: '0.75rem',
                                    borderRadius: 12,
                                    background: 'rgba(0,0,0,0.15)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        fontWeight: 700,
                                        marginBottom: '0.25rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Provider Distribution
                                </div>
                                <DonutChart
                                    data={chartData}
                                    width={200}
                                    height={160}
                                    innerRadius={40}
                                    outerRadius={65}
                                    formatter={(value, name) => [
                                        `${value} (${Math.round((value / decisions.length) * 100)}%)`,
                                        name,
                                    ]}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        marginTop: '0.25rem',
                                    }}
                                >
                                    {chartData.map((entry) => (
                                        <span
                                            key={entry.name}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 3,
                                                fontSize: '0.65rem',
                                                color: 'var(--slate-400)',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: entry.color,
                                                    display: 'inline-block',
                                                }}
                                            />
                                            {entry.name} (
                                            {Math.round((entry.value / decisions.length) * 100)}%)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                <div style={flexColGap2}>
                    {decisions.map((d, i) => {
                        const top = d.scores[0];
                        return (
                            <div
                                key={`${d.requestId}-${i}`}
                                onClick={() =>
                                    onSelect(selected?.requestId === d.requestId ? null : d)
                                }
                                style={{
                                    padding: '1rem',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    border: `1px solid ${selected?.requestId === d.requestId ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                    background:
                                        selected?.requestId === d.requestId
                                            ? 'rgba(139,92,246,0.08)'
                                            : 'rgba(255,255,255,0.02)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {new Date(d.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 4,
                                            background: 'var(--purple-tint)',
                                            color: '#a855f7',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {STRATEGY_LABELS[d.strategy] || d.strategy}
                                    </span>
                                </div>

                                <div style={flexWrapCenter}>
                                    <span style={textXsMuted}>Request</span>
                                    <ArrowRight size={12} style={textSecondary} />
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 4,
                                            background: `${providerColor(d.selected)}15`,
                                            color: providerColor(d.selected),
                                            fontWeight: 700,
                                        }}
                                    >
                                        {d.selected}
                                    </span>
                                    {d.secondBest && (
                                        <>
                                            <span style={textXxsMuted}>(or {d.secondBest})</span>
                                        </>
                                    )}
                                </div>

                                {top && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.75rem',
                                            marginTop: '0.5rem',
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        <span>Score: {top.score.toFixed(3)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {decisions.length === 0 && (
                        <div style={emptyState}>{t('routing.history.empty')}</div>
                    )}
                </div>
            </div>

            {selected && (
                <div>
                    <div style={textMutedSm}>Decision Details</div>

                    <div
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <Info size={18} style={{ color: 'var(--purple)' }} /> Why this route
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <div style={detailRow}>
                                <Zap size={16} style={{ color: 'var(--warning)' }} />
                                <div>
                                    <div style={textXsSecondary}>Strategy</div>
                                    <div
                                        style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--slate-50)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {STRATEGY_LABELS[selected.strategy] || selected.strategy}
                                    </div>
                                </div>
                            </div>
                            <div style={detailRow}>
                                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                                <div>
                                    <div style={textXsSecondary}>
                                        {t('routing.detail.selected')}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.85rem',
                                            color: providerColor(selected.selected),
                                            fontWeight: 700,
                                        }}
                                    >
                                        {selected.selected}
                                    </div>
                                </div>
                            </div>
                            {selected.secondBest && (
                                <div style={detailRow}>
                                    <Shield size={16} style={{ color: 'var(--success)' }} />
                                    <div>
                                        <div style={textXsSecondary}>
                                            {t('routing.detail.fallback')}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.85rem',
                                                color: '#34d399',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {selected.secondBest}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {selected.estimatedCost && (
                                <div style={detailRow}>
                                    <DollarSign size={16} style={{ color: 'var(--success)' }} />
                                    <div>
                                        <div style={textXsSecondary}>
                                            {t('routing.detail.estimated_cost')}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.85rem',
                                                color: '#34d399',
                                                fontWeight: 600,
                                            }}
                                        >
                                            ${selected.estimatedCost.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--slate-50)',
                                fontWeight: 700,
                                marginBottom: '0.75rem',
                            }}
                        >
                            Scores
                        </div>
                        <table
                            style={{
                                width: '100%',
                                fontSize: '0.75rem',
                                borderCollapse: 'collapse',
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        color: 'var(--slate-500)',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>
                                        {t('routing.detail.table.provider')}
                                    </th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {t('routing.detail.table.score')}
                                    </th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {t('routing.detail.table.ttft')}
                                    </th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {t('routing.detail.table.tps')}
                                    </th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {t('routing.detail.table.reliability')}
                                    </th>
                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>
                                        {t('routing.detail.table.cost')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {selected.scores.map((s, i) => {
                                    const breakdown = scoreBreakdown(s);
                                    return (
                                        <tr
                                            key={s.provider}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: '0.5rem',
                                                    fontWeight: 700,
                                                    color:
                                                        i === 0
                                                            ? providerColor(s.provider)
                                                            : '#94a3b8',
                                                }}
                                            >
                                                {s.provider}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '0.5rem',
                                                    textAlign: 'right',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {s.score.toFixed(3)}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                {(breakdown.ttft * 100).toFixed(0)}%
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                {(breakdown.tps * 100).toFixed(0)}%
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                {(breakdown.reliability * 100).toFixed(0)}%
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                {breakdown.cost.toFixed(4)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div
                            style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                borderRadius: 8,
                                background: 'rgba(139,92,246,0.05)',
                                border: '1px solid rgba(139,92,246,0.1)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#a855f7',
                                    fontWeight: 600,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Explanation
                            </div>
                            <ul
                                style={{
                                    margin: 0,
                                    padding: '0 0 0 1rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-400)',
                                    lineHeight: 1.8,
                                }}
                            >
                                {getExplanation(selected).map((line, i) => (
                                    <li key={`${line}-${i}`}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoryTab;
