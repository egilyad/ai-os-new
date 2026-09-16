import React, { useState } from 'react';
import { usePolling } from './Common/usePolling';
import { DollarSign, TrendingUp, BarChart3, Activity, ShieldAlert } from 'lucide-react';
import { budgetService } from '../kernel/instances';
import PanelLoader from './PanelLoader';
import {
    glassPanel,
    glassPanelPad15r,
    textXsMuted,
    flexBetween,
    progressBarSmall,
} from '../styles/common';
import { useTranslation } from '../i18n/useTranslation';
import { formatCost } from '../shared/utils/format-cost';

interface DailyCost {
    date: string;
    cost: number;
    count: number;
}
interface Anomaly {
    date: string;
    cost: number;
    expected: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
}

const CostAnalyticsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
    const [trend, setTrend] = useState<{
        direction: string;
        dailyAvg: number;
        projectedMonthly: number;
        forecast: number;
    } | null>(null);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [byProvider, setByProvider] = useState<Record<string, number>>({});
    const [byModel, setByModel] = useState<Record<string, number>>({});
    const [byAgent, setByAgent] = useState<Record<string, number>>({});
    const [budget, setBudget] = useState<{
        spentThisMonth: number;
        monthlyBudget: number;
        projectedMonthly: number;
    } | null>(null);
    const [days, setDays] = useState(30);

    usePolling(() => {
        setDailyCosts(budgetService.getDailyCosts(days));
        setTrend(budgetService.getCostTrend());
        setAnomalies(budgetService.detectAnomalies());
        setByProvider(budgetService.getCostByProvider());
        setByModel(budgetService.getCostByModel());
        setByAgent(budgetService.getCostByAgent());
        const bi = budgetService.getBudgetInfo();
        setBudget({
            spentThisMonth: bi.spentThisMonth,
            monthlyBudget: bi.monthlyBudget,
            projectedMonthly: bi.projectedMonthly,
        });
    }, 10000);

    const totalCost =
        budget?.spentThisMonth ?? Object.values(byProvider).reduce((s, v) => s + v, 0);

    const renderSparkline = (data: DailyCost[]) => {
        if (data.length < 2) return null;
        const max = Math.max(...data.map((d) => d.cost), 0.01);
        const h = 40;
        const w = 200;
        const pts = data
            .map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.cost / max) * h}`)
            .join(' ');
        return (
            <svg width={w} height={h} style={{ display: 'block' }}>
                <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="1.5" />
                <circle
                    cx={w}
                    cy={h - (data[data.length - 1]!.cost / max) * h}
                    r="2.5"
                    fill="#10b981"
                />
            </svg>
        );
    };

    return (
        <PanelLoader title={t('cost_analytics.title')}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 16,
                    height: '100%',
                    overflow: 'auto',
                }}
            >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                        className="glass-panel"
                        style={{ ...glassPanel, flex: 1, padding: '12px 16px' }}
                    >
                        <div style={flexBetween}>
                            <span style={textXsMuted}>{t('cost_analytics.total_cost')}</span>
                            <DollarSign size={16} style={{ color: 'var(--success)' }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#e4e4e7' }}>
                            {formatCost(totalCost)}
                        </div>
                    </div>
                    <div
                        className="glass-panel"
                        style={{ ...glassPanel, flex: 1, padding: '12px 16px' }}
                    >
                        <div style={flexBetween}>
                            <span style={textXsMuted}>{t('cost_analytics.this_month')}</span>
                            <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#e4e4e7' }}>
                            {formatCost(budget?.spentThisMonth ?? 0)}
                        </div>
                        {budget && budget.monthlyBudget > 0 && (
                            <div
                                style={{
                                    ...progressBarSmall,
                                    marginTop: 4,
                                    width: '100%',
                                    maxWidth: 200,
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        borderRadius: 3,
                                        width: `${Math.min(100, (budget.spentThisMonth / budget.monthlyBudget) * 100)}%`,
                                        background:
                                            budget.spentThisMonth / budget.monthlyBudget > 0.8
                                                ? '#ef4444'
                                                : '#10b981',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div
                        className="glass-panel"
                        style={{ ...glassPanel, flex: 1, padding: '12px 16px' }}
                    >
                        <div style={flexBetween}>
                            <span style={textXsMuted}>{t('cost_analytics.projected')}</span>
                            <TrendingUp size={16} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#e4e4e7' }}>
                            {formatCost(budget?.projectedMonthly ?? 0)}
                        </div>
                        {trend && (
                            <span style={textXsMuted}>
                                {trend.direction === 'up'
                                    ? '↑'
                                    : trend.direction === 'down'
                                      ? '↓'
                                      : '→'}{' '}
                                {trend.direction}
                            </span>
                        )}
                    </div>
                    <div
                        className="glass-panel"
                        style={{ ...glassPanel, flex: 1, padding: '12px 16px' }}
                    >
                        <div style={flexBetween}>
                            <span style={textXsMuted}>{t('cost_analytics.daily_avg')}</span>
                            <Activity size={16} style={{ color: 'var(--purple)' }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#e4e4e7' }}>
                            {formatCost(trend?.dailyAvg ?? 0)}
                        </div>
                        {trend && (
                            <span style={textXsMuted}>
                                {t('cost_analytics.forecast', {
                                    amount: formatCost(trend.forecast),
                                })}
                            </span>
                        )}
                    </div>
                </div>

                <div
                    className="glass-panel"
                    style={{
                        ...glassPanelPad15r,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <div style={flexBetween}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 600 }}>
                            {t('cost_analytics.trend')}
                        </span>
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            style={{
                                background: '#1a1a2e',
                                color: '#a1a1aa',
                                border: '1px solid #2d2d44',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 12,
                            }}
                        >
                            <option value={7}>{t('cost_analytics.days_7')}</option>
                            <option value={30}>{t('cost_analytics.days_30')}</option>
                            <option value={60}>{t('cost_analytics.days_60')}</option>
                        </select>
                    </div>
                    {dailyCosts.length === 0 ? (
                        <div style={{ ...textXsMuted, textAlign: 'center', padding: 24 }}>
                            {t('cost_analytics.no_data')}
                        </div>
                    ) : (
                        <>
                            {renderSparkline(dailyCosts)}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: 4,
                                }}
                            >
                                {dailyCosts.slice(-14).map((d) => (
                                    <div
                                        key={d.date}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: 11,
                                            color: '#a1a1aa',
                                            padding: '2px 4px',
                                            background: '#1a1a2e',
                                            borderRadius: 4,
                                        }}
                                    >
                                        <span>{d.date.slice(5)}</span>
                                        <span
                                            style={{ color: d.cost > 0.1 ? '#f59e0b' : '#71717a' }}
                                        >
                                            {formatCost(d.cost)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="glass-panel" style={{ ...glassPanelPad15r, flex: 1 }}>
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--slate-200)',
                                fontWeight: 600,
                                marginBottom: 8,
                            }}
                        >
                            {t('cost_analytics.by_provider')}
                        </div>
                        {Object.entries(byProvider).length === 0 ? (
                            <div style={textXsMuted}>{t('cost_analytics.no_data_short')}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {Object.entries(byProvider)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([p, c]) => (
                                        <div key={p}>
                                            <div style={flexBetween}>
                                                <span style={{ fontSize: 12, color: '#e4e4e7' }}>
                                                    {p}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#a1a1aa',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatCost(c)}
                                                </span>
                                            </div>
                                            <div style={{ ...progressBarSmall, marginTop: 2 }}>
                                                <div
                                                    style={{
                                                        ...progressBarSmall,
                                                        width: `${(c / totalCost) * 100}%`,
                                                        background: 'var(--accent)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-panel" style={{ ...glassPanelPad15r, flex: 1 }}>
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--slate-200)',
                                fontWeight: 600,
                                marginBottom: 8,
                            }}
                        >
                            {t('cost_analytics.by_model')}
                        </div>
                        {Object.entries(byModel).length === 0 ? (
                            <div style={textXsMuted}>{t('cost_analytics.no_data_short')}</div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    maxHeight: 200,
                                    overflow: 'auto',
                                }}
                            >
                                {Object.entries(byModel)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 15)
                                    .map(([m, c]) => (
                                        <div key={m} style={flexBetween}>
                                            <span style={{ fontSize: 11, color: '#e4e4e7' }}>
                                                {m.split('/').pop()}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#a1a1aa' }}>
                                                {formatCost(c)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-panel" style={{ ...glassPanelPad15r, flex: 1 }}>
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--slate-200)',
                                fontWeight: 600,
                                marginBottom: 8,
                            }}
                        >
                            {t('cost_analytics.by_agent')}
                        </div>
                        {Object.entries(byAgent).length === 0 ? (
                            <div style={textXsMuted}>{t('cost_analytics.no_agent_data')}</div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    maxHeight: 200,
                                    overflow: 'auto',
                                }}
                            >
                                {Object.entries(byAgent)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([a, c]) => (
                                        <div key={a} style={flexBetween}>
                                            <span style={{ fontSize: 11, color: '#e4e4e7' }}>
                                                {a}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#a1a1aa' }}>
                                                {formatCost(c)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                {anomalies.length > 0 && (
                    <div className="glass-panel" style={{ ...glassPanelPad15r }}>
                        <div style={{ ...flexBetween, marginBottom: 8 }}>
                            <span
                                style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 600 }}
                            >
                                {t('cost_analytics.anomalies')}
                            </span>
                            <ShieldAlert size={16} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {anomalies.slice(0, 10).map((a) => (
                                <div
                                    key={a.date}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 12,
                                        color: '#e4e4e7',
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: 999,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background:
                                                a.severity === 'high'
                                                    ? '#ef444420'
                                                    : a.severity === 'medium'
                                                      ? '#f59e0b20'
                                                      : '#10b98120',
                                            color:
                                                a.severity === 'high'
                                                    ? '#ef4444'
                                                    : a.severity === 'medium'
                                                      ? '#f59e0b'
                                                      : '#10b981',
                                        }}
                                    >
                                        {a.severity}
                                    </span>
                                    <span>{a.date}</span>
                                    <span style={{ color: '#a1a1aa' }}>
                                        {formatCost(a.cost)}{' '}
                                        {t('cost_analytics.vs_expected', {
                                            amount: formatCost(a.expected),
                                        })}
                                    </span>
                                    <span style={{ color: 'var(--warning)', fontSize: 11 }}>
                                        {a.deviation.toFixed(1)}σ
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PanelLoader>
    );
};

export default CostAnalyticsPanel;
