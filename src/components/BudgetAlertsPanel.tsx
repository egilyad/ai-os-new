import React, { useState } from 'react';
import { usePolling } from './Common/usePolling';
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

const CONDITION_LABELS: Record<BudgetAlertCondition, string> = {
    above_threshold: 'Above Threshold',
    below_threshold: 'Below Threshold',
    near_limit: 'Near Limit',
    trending_up: 'Trending Up',
    trending_down: 'Trending Down',
};

const ACTION_LABELS: Record<BudgetAlertAction, string> = {
    notification: 'Notification',
    block_usage: 'Block Usage',
    switch_provider: 'Switch Provider',
    warn_user: 'Warn User',
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
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Budget Alert Rules</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate-400)' }}>
                        Configure when and how to get alerted about budget usage
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
                    <Plus size={16} /> Add Rule
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
                        placeholder="Rule name"
                        style={inputStyle}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value as BudgetAlertCondition)}
                            style={inputStyle}
                        >
                            {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                        <input
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder="Threshold %"
                            type="number"
                            style={inputStyle}
                        />
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value as BudgetAlertAction)}
                            style={inputStyle}
                        >
                            {Object.entries(ACTION_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
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
                        Create Rule
                    </button>
                </div>
            )}

            <div style={{ marginBottom: 24 }}>
                {rules.length === 0 && (
                    <div
                        style={{ textAlign: 'center', padding: 32, color: 'var(--slate-500)', fontSize: 13 }}
                    >
                        <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>No alert rules configured.</p>
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
                                <span>{CONDITION_LABELS[rule.condition]}</span>
                                <span>·</span>
                                <span>{rule.threshold}%</span>
                                <span>·</span>
                                <span>{ACTION_LABELS[rule.action]}</span>
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
                Alert History
            </h3>
            {history.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate-500)', fontSize: 13 }}>
                    <p>No alerts triggered yet.</p>
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
