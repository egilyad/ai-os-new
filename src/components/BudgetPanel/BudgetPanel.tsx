import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { platformBudgetService, budgetIncidentService } from '../../kernel/instances/services-extras';
import type { PlatformBudget, BudgetIncident } from '../../kernel/contracts/budget';

export default function BudgetPanel() {
    const { t } = useTranslation();
    const [budget, setBudget] = useState<PlatformBudget | undefined>();
    const [incidents, setIncidents] = useState<BudgetIncident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const b = await platformBudgetService.getPlatformBudget();
                setBudget(b);
                const inc = await budgetIncidentService.listIncidents(50);
                setIncidents(inc);
            } catch {
                // services not registered
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div style={{ padding: 20 }}>
            <h2>{t('budget.platform.title')}</h2>

            {budget ? (
                <div style={{ marginBottom: 20 }}>
                    <p><strong>{t('budget.platform.current_spend')}:</strong> ${budget.currentSpendUsd.toFixed(2)}</p>
                    {budget.monthlyLimitUsd !== undefined && (
                        <p><strong>{t('budget.platform.monthly_limit')}:</strong> ${budget.monthlyLimitUsd}</p>
                    )}
                    {budget.dailyLimitUsd !== undefined && (
                        <p><strong>{t('budget.platform.daily_limit')}:</strong> ${budget.dailyLimitUsd}</p>
                    )}
                    <p><strong>{t('budget.platform.hard_stop')}:</strong> {budget.hardStopEnabled ? 'Yes' : 'No'}</p>
                </div>
            ) : (
                <p>No platform budget configured</p>
            )}

            <h3>{t('budget.incidents.title')}</h3>
            {incidents.length === 0 ? (
                <p>{t('budget.incidents.empty')}</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>{t('budget.incidents.title')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>{t('budget.incidents.spend')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>{t('budget.incidents.limit')}</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map(inc => (
                            <tr key={inc.id}>
                                <td>{t(`budget.incidents.${inc.type}`)}</td>
                                <td>${inc.spendUsd.toFixed(2)}</td>
                                <td>${inc.limitUsd.toFixed(2)}</td>
                                <td>{inc.resolvedAt ? t('budget.incidents.resolved') : 'Active'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
