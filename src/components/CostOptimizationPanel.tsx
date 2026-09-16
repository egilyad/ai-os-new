import React, { useState, useEffect, useCallback } from 'react';
import {
    getSummary,
    getRecommendations,
    dismissRecommendation,
} from '../kernel/services/cost-optimization-service';
import { useTranslation } from '../i18n/useTranslation';
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    X,
    Lightbulb,
    AlertTriangle,
    Info,
} from 'lucide-react';
import type {
    CostSummary,
    CostRecommendation,
} from '../kernel/contracts/cost-optimization-types';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const statCard: React.CSSProperties = {
    ...card,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
};

const REC_COLORS: Record<string, string> = {
    cheaper_alternative: '#10b981',
    overpriced: '#ef4444',
    unused_key: '#64748b',
    underutilized: '#f59e0b',
    budget_alert: '#f97316',
};

const REC_ICONS: Record<string, React.ReactNode> = {
    cheaper_alternative: <TrendingDown size={16} />,
    overpriced: <AlertTriangle size={16} />,
    unused_key: <Info size={16} />,
    underutilized: <Lightbulb size={16} />,
    budget_alert: <AlertTriangle size={16} />,
};

const CostOptimizationPanel: React.FC = () => {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<CostSummary | null>(null);
    const [recommendations, setRecommendations] = useState<CostRecommendation[]>([]);
    const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

    const load = useCallback(async () => {
        const [s, r] = await Promise.all([getSummary(period), getRecommendations()]);
        setSummary(s);
        setRecommendations(r);
    }, [period]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDismiss = async (id: string) => {
        await dismissRecommendation(id);
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
    };

    const totalPotentialSavings = recommendations.reduce(
        (s, r) => s + (r.potentialSavings || 0),
        0,
    );

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: 1000,
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <DollarSign size={28} style={{ color: 'var(--success)' }} />
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--slate-200)',
                            }}
                        >
                            {t('cost_opt.title')}
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                            {t('cost_opt.subtitle')}
                        </p>
                    </div>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | 'all')}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                >
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="all">All time</option>
                </select>
            </div>

            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={statCard}>
                        <DollarSign size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                {t('cost_opt.total_spend')}
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                                ${summary.totalSpend.toFixed(4)}
                            </div>
                        </div>
                    </div>
                    <div style={statCard}>
                        <TrendingUp size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                {t('cost_opt.total_requests')}
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                                {summary.totalRequests}
                            </div>
                        </div>
                    </div>
                    <div style={statCard}>
                        <TrendingDown size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                {t('cost_opt.potential_savings')}
                            </div>
                            <div
                                style={{
                                    fontSize: '1.3rem',
                                    fontWeight: 700,
                                    color: summary.totalSpend > 0 ? '#f59e0b' : '#64748b',
                                }}
                            >
                                ${totalPotentialSavings.toFixed(4)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {recommendations.length > 0 && (
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: '0.9rem',
                            color: 'var(--slate-400)',
                            fontWeight: 600,
                        }}
                    >
                        <Lightbulb size={14} style={{ marginRight: 6 }} />
                        {t('cost_opt.recommendations')} ({recommendations.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recommendations.map((rec) => (
                            <div
                                key={rec.id}
                                style={{
                                    ...card,
                                    borderLeft: `3px solid ${REC_COLORS[rec.type] || '#64748b'}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            flex: 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: REC_COLORS[rec.type] || '#64748b',
                                                marginTop: 2,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {REC_ICONS[rec.type] || <Info size={16} />}
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    color: 'var(--slate-200)',
                                                }}
                                            >
                                                {rec.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--slate-500)',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {rec.description}
                                            </div>
                                            {rec.potentialSavings && rec.potentialSavings > 0 && (
                                                <div
                                                    style={{
                                                        fontSize: '0.78rem',
                                                        color: 'var(--success)',
                                                        marginTop: 4,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {t('cost_opt.savings')}: $
                                                    {rec.potentialSavings.toFixed(4)}
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--slate-400)',
                                                    marginTop: 4,
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                {rec.action}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDismiss(rec.id)}
                                        style={{
                                            padding: 4,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--slate-600)',
                                            flexShrink: 0,
                                        }}
                                        title={t('cost_opt.dismiss')}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {summary && summary.providerCosts.length > 0 && (
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: '0.9rem',
                            color: 'var(--slate-400)',
                            fontWeight: 600,
                        }}
                    >
                        {t('cost_opt.provider_breakdown')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {summary.providerCosts.map((p) => (
                            <div
                                key={p.provider}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 80px 100px 100px',
                                    gap: 8,
                                    padding: '8px 12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 8,
                                    fontSize: '0.8rem',
                                    color: 'var(--slate-400)',
                                }}
                            >
                                <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>
                                    {p.provider}
                                </span>
                                <span>{p.requests} req</span>
                                <span>${p.totalCost.toFixed(4)}</span>
                                <span
                                    style={{
                                        color: p.avgCostPerRequest > 0.01 ? '#f87171' : '#34d399',
                                    }}
                                >
                                    ${(p.avgCostPerRequest * 1000).toFixed(2)}/1K
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {summary && summary.providerCosts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                    <DollarSign size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>{t('cost_opt.no_data')}</p>
                </div>
            )}
        </div>
    );
};

export default CostOptimizationPanel;
