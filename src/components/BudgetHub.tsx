import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import BudgetPanel from './BudgetPanel';
import BudgetAlertsPanel from './BudgetAlertsPanel';
import CostOptimizationPanel from './CostOptimizationPanel';

type TabId = 'overview' | 'alerts' | 'optimization';

const BudgetHub: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabId>('overview');

    const tabs: Array<{ id: TabId; label: string }> = [
        { id: 'overview', label: t('budget.hub.overview') },
        { id: 'alerts', label: t('budget.hub.alerts') },
        { id: 'optimization', label: t('budget.hub.optimization') },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(15,23,42,0.4)',
                    flexWrap: 'wrap',
                }}
                role="tablist"
                aria-label={t('budget.hub.title')}
            >
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        role="tab"
                        aria-selected={tab === t.id}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor: tab === t.id ? 'rgba(16,185,129,0.35)' : 'transparent',
                            background: tab === t.id ? 'rgba(16,185,129,0.12)' : 'transparent',
                            color: tab === t.id ? '#34d399' : 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: tab === t.id ? 700 : 600,
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {tab === 'overview' && <BudgetPanel />}
                {tab === 'alerts' && <BudgetAlertsPanel />}
                {tab === 'optimization' && <CostOptimizationPanel />}
            </div>
        </div>
    );
};

export default BudgetHub;
