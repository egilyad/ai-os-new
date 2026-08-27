import React, { useState, useCallback } from 'react';
import { usePolling } from '../Common/usePolling';
import { DollarSign, RefreshCcw, Settings, Trash2, Save, BarChart3, Info } from 'lucide-react';
import {
    pricingService,
    budgetService,
    type ModelPricing,
    type BudgetInfo,
} from '../../kernel/instances';
import { motion, AnimatePresence } from 'framer-motion';
import { budgetValueLarge } from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';
import { formatCost } from '../../shared/utils/format-cost';

const PricingPanel: React.FC = () => {
    const { t } = useTranslation();
    const [prices, setPrices] = useState<Record<string, ModelPricing>>({});
    const [overrides, setOverrides] = useState<Record<string, ModelPricing>>({});
    const [budget, setBudget] = useState<BudgetInfo | null>(null);
    const [lastSync, setLastSync] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [editingModel, setEditingModel] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<ModelPricing>({ input: 0, output: 0 });

    const refreshData = useCallback(() => {
        setPrices(pricingService.getAllPrices());
        setOverrides(pricingService.getUserOverrides());
        setBudget(budgetService.getBudgetInfo());
        setLastSync(pricingService.getLastSync());
    }, []);

    usePolling(refreshData, 5000);

    const handleSync = async () => {
        setIsSyncing(true);
        await pricingService.syncFromOpenRouter();
        refreshData();
        setIsSyncing(false);
    };

    const saveOverride = () => {
        if (editingModel) {
            pricingService.setOverride(editingModel, editPrice);
            setEditingModel(null);
            refreshData();
        }
    };

    const removeOverride = (model: string) => {
        pricingService.removeOverride(model);
        refreshData();
    };

    const startEdit = (model: string, current: ModelPricing) => {
        setEditingModel(model);
        setEditPrice({ ...current });
    };

    return (
        <div
            className="pricing-panel-container"
            style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}
        >
            <header
                style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: 'var(--slate-50)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                        }}
                    >
                        <DollarSign size={28} color="#10b981" /> {t('pricing.plane_title')}
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>{t('pricing.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-50)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        <RefreshCcw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? t('pricing.syncing') : t('pricing.sync_openrouter')}
                    </button>
                </div>
            </header>

            {/* Budget Overview Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2.5rem',
                }}
            >
                <div
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        borderRadius: 20,
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.1)',
                    }}
                >
                    <div
                        style={{
                            color: 'var(--success)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('pricing.spent_this_month')}
                    </div>
                    <div style={budgetValueLarge}>{formatCost(budget?.spentThisMonth ?? 0)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
                        {t('pricing.daily_avg', {
                            amount: budget?.dailyAverage.toFixed(2) ?? '0.00',
                        })}
                    </div>
                </div>
                <div
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        borderRadius: 20,
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.1)',
                    }}
                >
                    <div
                        style={{
                            color: 'var(--accent)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('pricing.remaining_budget')}
                    </div>
                    <div style={budgetValueLarge}>
                        {budget != null && !isFinite(budget.remainingBudget)
                            ? '∞'
                            : formatCost(budget?.remainingBudget ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
                        {t('pricing.of_goal', {
                            amount: budget?.monthlyBudget.toFixed(2) ?? '0.00',
                        })}
                    </div>
                </div>
                <div
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        borderRadius: 20,
                        background: 'rgba(245,158,11,0.05)',
                        border: '1px solid rgba(245,158,11,0.1)',
                    }}
                >
                    <div
                        style={{
                            color: 'var(--warning)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('pricing.projected_month_end')}
                    </div>
                    <div style={budgetValueLarge}>{formatCost(budget?.projectedMonthly ?? 0)}</div>
                    <div
                        style={{
                            fontSize: '0.8rem',
                            color:
                                (budget?.projectedMonthly ?? 0) > (budget?.monthlyBudget ?? 0)
                                    ? '#ef4444'
                                    : '#10b981',
                            marginTop: '0.5rem',
                        }}
                    >
                        {(budget?.projectedMonthly ?? 0) > (budget?.monthlyBudget ?? 0)
                            ? t('pricing.exceeds_budget')
                            : t('pricing.within_budget')}
                    </div>
                </div>
                <div
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div
                        style={{
                            color: 'var(--slate-400)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        {t('pricing.last_sync')}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {lastSync ? new Date(lastSync).toLocaleTimeString() : t('pricing.never')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
                        {t('pricing.ttl')}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                {/* Pricing Table */}
                <section
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        borderRadius: 24,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--slate-50)',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <BarChart3 size={18} color="#3b82f6" /> {t('pricing.catalog')}
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    <th style={{ textAlign: 'left', padding: '1rem' }}>
                                        {t('pricing.table.model')}
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>
                                        {t('pricing.table.input')}
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>
                                        {t('pricing.table.output')}
                                    </th>
                                    <th style={{ textAlign: 'center', padding: '1rem' }}>
                                        {t('pricing.table.status')}
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '1rem' }}>
                                        {t('pricing.table.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(prices)
                                    .slice(0, 15)
                                    .map(([id, p]) => (
                                        <tr
                                            key={id}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>
                                                {id}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {formatCost(p.input)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {formatCost(p.output)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {overrides[id] ? (
                                                    <span
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: 4,
                                                            background: 'var(--success-tint)',
                                                            color: 'var(--success)',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {t('pricing.status.overridden')}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: 4,
                                                            background: 'rgba(255,255,255,0.05)',
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        {t('pricing.status.synced')}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() =>
                                                        startEdit(id, overrides[id] || p)
                                                    }
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--accent)',
                                                        cursor: 'pointer',
                                                        marginRight: '0.5rem',
                                                    }}
                                                >
                                                    {t('pricing.edit')}
                                                </button>
                                                {overrides[id] && (
                                                    <button
                                                        onClick={() => removeOverride(id)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--error)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {t('pricing.reset')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Sidebar Controls */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            borderRadius: 20,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <h4
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                marginBottom: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <Settings size={16} /> {t('pricing.budget_config')}
                        </h4>
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {t('pricing.monthly_budget')}
                            </label>
                            <input
                                type="number"
                                value={budget?.monthlyBudget || 0}
                                onChange={(e) => {
                                    budgetService.setMonthlyBudget(parseFloat(e.target.value) || 0);
                                    refreshData();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-400)',
                                background: 'rgba(59,130,246,0.05)',
                                padding: '0.75rem',
                                borderRadius: 8,
                                border: '1px solid rgba(59,130,246,0.1)',
                            }}
                        >
                            <Info
                                size={14}
                                style={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            />
                            {t('pricing.budget_hint')}
                        </div>
                    </div>

                    <div
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            borderRadius: 20,
                            background: 'rgba(139,92,246,0.03)',
                            border: '1px solid rgba(139,92,246,0.1)',
                        }}
                    >
                        <h4
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                marginBottom: '1rem',
                            }}
                        >
                            {t('pricing.active_overrides')}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {Object.keys(overrides).length === 0 ? (
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--slate-500)',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {t('pricing.no_overrides')}
                                </div>
                            ) : (
                                Object.entries(overrides).map(([id, p]) => (
                                    <div
                                        key={id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '0.75rem',
                                            borderRadius: 10,
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: 'var(--slate-50)',
                                                }}
                                            >
                                                {id}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>
                                                {t('pricing.override_entry', {
                                                    input: `$${p.input}`,
                                                    output: `$${p.output}`,
                                                })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeOverride(id)}
                                            style={{
                                                color: 'var(--error)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            <AnimatePresence>
                {editingModel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditingModel(null)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingModel(null);
                        }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel"
                            style={{
                                width: 400,
                                padding: '2rem',
                                borderRadius: 24,
                                background: 'var(--slate-900)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-50)',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                {t('pricing.edit_title', { model: editingModel })}
                            </h3>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-500)',
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    {t('pricing.input_cost')}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editPrice.input}
                                    onChange={(e) =>
                                        setEditPrice({
                                            ...editPrice,
                                            input: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-500)',
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    {t('pricing.output_cost')}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editPrice.output}
                                    onChange={(e) =>
                                        setEditPrice({
                                            ...editPrice,
                                            output: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setEditingModel(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 12,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={saveOverride}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 12,
                                        background: 'var(--success)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <Save size={18} /> {t('pricing.save_override')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PricingPanel;
