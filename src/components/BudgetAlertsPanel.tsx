import React, { useState } from 'react';
import { usePolling } from './Common/usePolling';
import { useTranslation } from '../i18n/useTranslation';
import {
    Bell,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    Info,
    AlertCircle,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { budgetAlertService } from '../kernel/instances';
import type {
    BudgetAlertRule,
    BudgetAlertEvent,
    BudgetAlertCondition,
    BudgetAlertAction,
} from '../kernel/contracts/budget-alert';

const CONDITION_KEYS: Record<BudgetAlertCondition, string> = {
    above_threshold: 'budgetAlerts.cond_above_threshold',
    below_threshold: 'budgetAlerts.cond_below_threshold',
    near_limit: 'budgetAlerts.cond_near_limit',
    trending_up: 'budgetAlerts.cond_trending_up',
    trending_down: 'budgetAlerts.cond_trending_down',
};

const ACTION_KEYS: Record<BudgetAlertAction, string> = {
    notification: 'budgetAlerts.act_notification',
    block_usage: 'budgetAlerts.act_block_usage',
    switch_provider: 'budgetAlerts.act_switch_provider',
    warn_user: 'budgetAlerts.act_warn_user',
};

const SEVERITY_COLORS: Record<string, string> = {
    info: '#3b82f6',
    warn: '#f59e0b',
    critical: '#ef4444',
};
const SEVERITY_ICONS: Record<string, React.ReactNode> = {
    info: <Info size={14} />,
    warn: <AlertTriangle size={14} />,
    critical: <AlertCircle size={14} />,
};

const BudgetAlertsPanelContent: React.FC = () => {
    const { t } = useTranslation();
    const [rules, setRules] = useState<BudgetAlertRule[]>([]);
    const [history, setHistory] = useState<BudgetAlertEvent[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [condition, setCondition] = useState<BudgetAlertCondition>('near_limit');
    const [threshold, setThreshold] = useState('80');
    const [action, setAction] = useState<BudgetAlertAction>('notification');

    const refresh = () => {
        setRules(budgetAlertService.getRules());
        setHistory(budgetAlertService.getAlertHistory());
    };

    usePolling(refresh, 15000);

    const handleAdd = () => {
        if (!name.trim()) return;
        budgetAlertService.addRule({
            name: name.trim(),
            condition,
            threshold: Number(threshold),
            action,
            enabled: true,
        });
        setName('');
        setThreshold('80');
        setShowForm(false);
        refresh();
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t('budgetAlerts.title')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate-400)' }}>
                        {t('budgetAlerts.subtitle')}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    <Plus size={16} /> {t('budgetAlerts.addRule')}
                </button>
            </div>

            {showForm && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('budgetAlerts.ruleName')}
                        style={inputStyle}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value as BudgetAlertCondition)}
                            style={inputStyle}
                        >
                            {Object.entries(CONDITION_KEYS).map(([k, key]) => (
                                <option key={k} value={k}>
                                    {t(key)}
                                </option>
                            ))}
                        </select>
                        <input
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder={t('budgetAlerts.threshold')}
                            type="number"
                            style={inputStyle}
                        />
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value as BudgetAlertAction)}
                            style={inputStyle}
                        >
                            {Object.entries(ACTION_KEYS).map(([k, key]) => (
                                <option key={k} value={k}>
                                    {t(key)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleAdd}
                        style={{
                            padding: '8px 20px',
                            background: 'var(--success)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            alignSelf: 'flex-start',
                        }}
                    >
                        {t('budgetAlerts.createRule')}
                    </button>
                </div>
            )}

            <div style={{ marginBottom: 24 }}>
                {rules.length === 0 && (
                    <div
                        style={{ textAlign: 'center', padding: 32, color: 'var(--slate-500)', fontSize: 13 }}
                    >
                        <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>{t('budgetAlerts.noRules')}</p>
                    </div>
                )}
                {rules.map((rule) => (
                    <div
                        key={rule.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            background: 'var(--slate-800)',
                            borderRadius: 8,
                            marginBottom: 6,
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.name}</div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-500)',
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 2,
                                }}
                            >
                                <span>{t(CONDITION_KEYS[rule.condition])}</span>
                                <span>·</span>
                                <span>{rule.threshold}%</span>
                                <span>·</span>
                                <span>{t(ACTION_KEYS[rule.action])}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                budgetAlertService.updateRule(rule.id, { enabled: !rule.enabled });
                                refresh();
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: rule.enabled ? '#22c55e' : '#64748b',
                                cursor: 'pointer',
                                padding: 4,
                            }}
                        >
                            {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                            onClick={() => {
                                budgetAlertService.removeRule(rule.id);
                                refresh();
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                padding: 4,
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--slate-400)' }}>
                {t('budgetAlerts.history')}
            </h3>
            {history.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate-500)', fontSize: 13 }}>
                    <p>{t('budgetAlerts.noHistory')}</p>
                </div>
            )}
            {history
                .slice(-20)
                .reverse()
                .map((ev, i) => (
                    <div
                        key={ev.timestamp ?? i}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'var(--slate-800)',
                            borderRadius: 6,
                            marginBottom: 4,
                            fontSize: 12,
                        }}
                    >
                        <div
                            style={{
                                color: SEVERITY_COLORS[ev.severity],
                                flexShrink: 0,
                                marginTop: 2,
                            }}
                        >
                            {SEVERITY_ICONS[ev.severity]}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--slate-200)' }}>{ev.message}</div>
                            <div style={{ color: 'var(--slate-500)', marginTop: 2 }}>
                                {new Date(ev.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    background: 'var(--slate-900)',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
};

const BudgetAlertsPanel: React.FC = () => (
    <PanelLoader>
        <BudgetAlertsPanelContent />
    </PanelLoader>
);
export default BudgetAlertsPanel;
